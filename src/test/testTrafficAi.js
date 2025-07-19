const axios = require("axios");
const { performance } = require("perf_hooks");

// Cấu hình
const CONFIG = {
  // Thay đổi URL API theo môi trường của bạn
  API_URL: "http://localhost:3000/api/v1/ai/chat",
  STATUS_URL: "http://localhost:3000/api/v1/ai/chat/{chatId}",
  // Số lượng request đồng thời
  CONCURRENT_REQUESTS: 20,
  // API Key của bạ
  API_KEY: "686cab550705deee4a81ae3f",
  // Khoảng thời gian (ms) giữa các lần kiểm tra trạng thái chat
  POLLING_INTERVAL: 12000,
  // Thời gian tối đa (ms) để đợi kết quả xử lý
  MAX_WAIT_TIME: 200000,
  // Thông điệp hệ thống (thêm dòng này)
  SYSTEM_MESSAGE: "You are a helpful assistant that writes content about AI.",
  // Thông điệp mẫu
  SAMPLE_MESSAGE:
    "Tôi cần hỗ trợ tạo một nội dung bài viết về trí tuệ nhân tạo.",
};

// Mảng lưu trữ kết quả request
const results = {
  successful: 0,
  failed: 0,
  pending: 0,
  totalTime: 0,
  requestDetails: [],
};

/**
 * Tạo một chat request đến API
 */
async function createChatRequest() {
  try {
    const startTime = performance.now();
    console.log("Đang gửi request đến API...");

    // Log request payload để debug
    const payload = {
      apiKey: CONFIG.API_KEY,
      userMessage: CONFIG.SAMPLE_MESSAGE,
      chatKey: "nimo-ai-server", // Sử dụng n8n endpoint (xử lý bất đồng bộ)
    };

    const response = await axios.post(CONFIG.API_URL, payload);
    const requestTime = performance.now() - startTime;

    if (response.data.ok) {
      // Request đã được chấp nhận, lấy chat ID từ response
      const chatId = response.data.data._id;
      console.log(`Nhận được chat ID: ${chatId}`);
      return {
        chatId,
        requestTime,
        status: "pending",
        error: null,
      };
    } else {
      // Request thất bại
      console.error(
        "Request thất bại:",
        response.data.message || "Unknown error"
      );
      return {
        chatId: null,
        requestTime,
        status: "failed",
        error: response.data.message || "Unknown error",
      };
    }
  } catch (error) {
    console.error("Lỗi khi gửi request:", error.message);
    if (error.response) {
      console.error(
        "Chi tiết lỗi từ server:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
    return {
      chatId: null,
      requestTime: 0,
      status: "failed",
      error: error.response?.data?.message || error.message,
    };
  }
}

/**
 * Kiểm tra trạng thái của một chat request
 */
async function checkChatStatus(chatId) {
  try {
    const url = CONFIG.STATUS_URL.replace("{chatId}", chatId);
    console.log(`Gọi API status: ${url}`);

    const response = await axios.get(url);

    // Kiểm tra và trả về trạng thái dựa trên response
    if (response.data.ok) {
      return {
        status: response.data.data.status,
        result: response.data.data.aiContent,
        error: null,
      };
    } else {
      return {
        status: "error",
        result: null,
        error: response.data.message || "Unknown error in status check",
      };
    }
  } catch (error) {
    console.error(
      `Lỗi khi kiểm tra trạng thái chat ID ${chatId}:`,
      error.message
    );
    if (error.response) {
      console.error(
        "Chi tiết lỗi:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
    return {
      status: "error",
      result: null,
      error: error.response?.data?.message || error.message,
    };
  }
}

/**
 * Xử lý một chat request đầy đủ từ tạo đến hoàn thành
 */
async function processChatRequestFully() {
  // Tạo chat request
  const requestResult = await createChatRequest();

  if (requestResult.status === "failed") {
    // Request thất bại ngay từ đầu
    results.failed++;
    results.requestDetails.push({
      initialRequestTime: requestResult.requestTime,
      processingTime: 0,
      totalTime: requestResult.requestTime,
      status: "failed",
      error: requestResult.error,
    });
    return null; // Trả về null nếu không có chat ID
  }

  if (requestResult.status === "success") {
    // Request đã hoàn thành đồng bộ (hiếm khi xảy ra)
    results.successful++;
    results.requestDetails.push({
      initialRequestTime: requestResult.requestTime,
      processingTime: 0,
      totalTime: requestResult.requestTime,
      status: "success",
    });
    return null; // Trả về null nếu không có chat ID
  }

  // Trả về thông tin để theo dõi sau
  return {
    chatId: requestResult.chatId,
    initialRequestTime: requestResult.requestTime,
    index: results.requestDetails.length,
  };
}

/**
 * Chạy n requests đồng thời và theo dõi kết quả~
 */
async function runConcurrentRequests(n) {
  console.log(`Bắt đầu chạy ${n} requests đồng thời...`);
  const startTime = performance.now();

  // BƯỚC 1: Gửi tất cả requests đến API_URL
  console.log("BƯỚC 1: Đang gửi tất cả requests đến API...");
  const promises = [];
  for (let i = 0; i < n; i++) {
    promises.push(processChatRequestFully());
  }

  // Đợi tất cả các requests hoàn thành và lấy các chat ID
  const chatRequests = await Promise.all(promises);
  const pendingChats = chatRequests.filter((req) => req !== null);

  // Log chi tiết hơn để debug
  console.log("Chi tiết kết quả các request:");
  chatRequests.forEach((req, index) => {
    if (req === null) {
      console.log(`Request #${index + 1}: Đã hoàn thành hoặc thất bại`);
    } else {
      console.log(
        `Request #${index + 1}: Đang chờ xử lý, chat ID: ${req.chatId}`
      );
    }
  });

  console.log(
    `Đã gửi ${n} requests, có ${pendingChats.length} requests đang xử lý bất đồng bộ`
  );

  // BƯỚC 2: Kiểm tra trạng thái của tất cả requests đang chờ
  if (pendingChats.length > 0) {
    console.log("\nBƯỚC 2: Kiểm tra trạng thái của tất cả requests...");
    await monitorAllPendingChats(pendingChats);
  }

  // Tính toán thời gian tổng
  results.totalTime = performance.now() - startTime;

  // In chat ID của các requests đã hoàn thành
  console.log("\n=============== KẾT QUẢ CHI TIẾT ===============");
  for (const detail of results.requestDetails) {
    if (detail.chatId) {
      try {
        // Gọi STATUS_URL để lấy thông tin chi tiết
        const url = CONFIG.STATUS_URL.replace("{chatId}", detail.chatId);

        const response = await axios.get(url);
        if (response.data.ok) {
          const status = response.data.data.status;
          if (status === "success") {
            console.log(`${detail.chatId} | ${response.data.data.aiContent}`);
          } else if (status === "error") {
            console.log(
              `${detail.chatId} | Lỗi: ${
                response.data.message || "Không có thông báo lỗi"
              }`
            );
          } else {
            console.log(`? TRẠNG THÁI: ${status}`);
            console.log(
              `Thông tin: ${JSON.stringify(response.data.data, null, 2)}`
            );
          }
        } else {
          console.log("✗ THẤT BẠI");
          console.log(
            `Lỗi: ${response.data.message || "Không có thông báo lỗi"}`
          );
        }
      } catch (error) {
        console.log("✗ THẤT BẠI");
        console.log(`Lỗi khi kiểm tra kết quả: ${error.message}`);
      }
    }
  }

  // In kết quả tổng hợp
  printResults();
}

/**
 * Theo dõi trạng thái của tất cả các chat đang chờ xử lý
 */
async function monitorAllPendingChats(pendingChats) {
  // Tạo một bản sao của danh sách để xử lý
  const remainingChats = [...pendingChats];
  const startTime = performance.now();
  let checkCount = 0;

  // Tiếp tục kiểm tra cho đến khi tất cả các chat hoàn thành hoặc hết thời gian
  while (
    remainingChats.length > 0 &&
    performance.now() - startTime < CONFIG.MAX_WAIT_TIME
  ) {
    checkCount++;
    console.log(
      `\n--- Lần kiểm tra thứ ${checkCount} (còn ${remainingChats.length} chats đang chờ) ---`
    );

    // Đợi 6 giây từ lần kiểm tra trước (bỏ qua lần đầu tiên)
    if (checkCount > 1) {
      console.log("Đợi 6 giây trước lần kiểm tra tiếp theo...");
      await new Promise((resolve) => setTimeout(resolve, 6000));
    }

    // Kiểm tra từng chat trong danh sách
    for (let i = remainingChats.length - 1; i >= 0; i--) {
      const chatInfo = remainingChats[i];
      const elapsedTime = performance.now() - startTime;

      console.log(
        `Kiểm tra chat ID: ${chatInfo.chatId} (${(elapsedTime / 1000).toFixed(
          1
        )}s)`
      );
      const statusResult = await checkChatStatus(chatInfo.chatId);
      console.log(`- Trạng thái hiện tại: ${statusResult.status}`);

      // Nếu chat đã hoàn thành hoặc lỗi, cập nhật kết quả và xóa khỏi danh sách chờ
      if (
        statusResult.status === "success" ||
        statusResult.status === "error"
      ) {
        // Tính thời gian xử lý
        const processingTime = performance.now() - startTime;

        if (statusResult.status === "success") {
          console.log(
            `✓ Chat ID ${chatInfo.chatId} đã hoàn thành thành công sau ${(
              processingTime / 1000
            ).toFixed(1)}s`
          );
          console.log(`- Nội dung: ${statusResult.result}`);
          results.successful++;
        } else {
          console.log(
            `✗ Chat ID ${chatInfo.chatId} thất bại sau ${(
              processingTime / 1000
            ).toFixed(1)}s`
          );
          results.failed++;
        }

        // Thêm chi tiết vào kết quả
        results.requestDetails.push({
          chatId: chatInfo.chatId,
          initialRequestTime: chatInfo.initialRequestTime,
          processingTime: processingTime,
          totalTime: chatInfo.initialRequestTime + processingTime,
          status: statusResult.status === "success" ? "success" : "failed",
          content: statusResult.result,
          error:
            statusResult.status === "error"
              ? statusResult.error || "Unknown error"
              : null,
        });

        // Xóa chat này khỏi danh sách chờ
        remainingChats.splice(i, 1);
      }
    }
  }

  // Xử lý các chat còn lại (timeout)
  if (remainingChats.length > 0) {
    console.log(
      `\n! Có ${remainingChats.length} chats đã hết thời gian chờ sau ${(
        CONFIG.MAX_WAIT_TIME / 1000
      ).toFixed(1)}s`
    );

    // Cập nhật kết quả cho các chat timeout
    remainingChats.forEach((chatInfo) => {
      results.failed++;
      results.requestDetails.push({
        chatId: chatInfo.chatId,
        initialRequestTime: chatInfo.initialRequestTime,
        processingTime: CONFIG.MAX_WAIT_TIME,
        totalTime: chatInfo.initialRequestTime + CONFIG.MAX_WAIT_TIME,
        status: "timeout",
        error: "Request processing timed out",
      });
    });
  }
}

/**
 * In kết quả kiểm tra
 */
function printResults() {
  console.log("\n=============== THỐNG KÊ ===============");
  console.log(`Tổng số requests: ${CONFIG.CONCURRENT_REQUESTS}`);
  console.log(`Thành công: ${results.successful}`);
  console.log(`Thất bại: ${results.failed}`);
  console.log(
    `Tỉ lệ thành công: ${(
      (results.successful / CONFIG.CONCURRENT_REQUESTS) *
      100
    ).toFixed(2)}%`
  );
  console.log(`Thời gian tổng: ${(results.totalTime / 1000).toFixed(2)} giây`);

  // Tính toán thời gian trung bình
  let avgInitialRequestTime = 0;
  let avgProcessingTime = 0;
  let avgTotalTime = 0;

  results.requestDetails.forEach((detail) => {
    avgInitialRequestTime += detail.initialRequestTime;
    avgProcessingTime += detail.processingTime;
    avgTotalTime += detail.totalTime;
  });

  avgInitialRequestTime /= results.requestDetails.length;
  avgProcessingTime /= results.requestDetails.length;
  avgTotalTime /= results.requestDetails.length;

  console.log(`\nThời gian trung bình:`);
  console.log(
    `Khởi tạo request: ${(avgInitialRequestTime / 1000).toFixed(2)} giây`
  );
  console.log(
    `Xử lý bất đồng bộ: ${(avgProcessingTime / 1000).toFixed(2)} giây`
  );
  console.log(`Tổng thời gian: ${(avgTotalTime / 1000).toFixed(2)} giây`);

  // In chi tiết nếu có lỗi
  const failedRequests = results.requestDetails.filter(
    (d) => d.status !== "success"
  );
  if (failedRequests.length > 0) {
    console.log("\n=============== CHI TIẾT LỖI ===============");
    failedRequests.forEach((request, index) => {
      console.log(`\nRequest lỗi #${index + 1}:`);
      console.log(`- Chat ID: ${request.chatId || "N/A"}`);
      console.log(`- Trạng thái: ${request.status}`);
      console.log(`- Lỗi: ${request.error}`);
      console.log(
        `- Thời gian xử lý: ${(request.totalTime / 1000).toFixed(2)} giây`
      );
    });
  }
}

/**
 * Hàm chính để chạy kiểm tra
 */
async function main() {
  // Kiểm tra cấu hình
  if (CONFIG.API_KEY === "your-api-key") {
    console.error(
      "Vui lòng cập nhật API_KEY trong file cấu hình trước khi chạy."
    );
    return;
  }

  // Chạy n requests đồng thời (n được cấu hình trong CONFIG)
  try {
    await runConcurrentRequests(CONFIG.CONCURRENT_REQUESTS);
  } catch (error) {
    console.error("Lỗi khi chạy test:", error);
  }
}

/**
 * Xóa tất cả toast notifications khỏi DOM
 * @param {boolean} removeContainer - Có xóa container không (mặc định: false)
 */
function removeAllToasts(removeContainer = false) {
  try {
    // Tìm tất cả các toast containers trên trang
    const containers = document.querySelectorAll("#toast-container");

    if (containers.length === 0) {
      console.log("Không tìm thấy toast nào để xóa.");
      return;
    }

    let totalRemoved = 0;

    containers.forEach((container) => {
      // Lấy tất cả toasts trong container
      const toasts = container.querySelectorAll(".toast");
      totalRemoved += toasts.length;

      // Xóa từng toast với animation
      toasts.forEach((toast) => {
        toast.style.animation = "toast-out 0.3s forwards";

        // Xóa toast sau khi animation hoàn thành
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      });

      // Xóa container nếu được yêu cầu
      if (removeContainer) {
        setTimeout(() => {
          if (container.parentNode) {
            container.parentNode.removeChild(container);
          }
        }, 350); // Đợi lâu hơn animation của toasts một chút
      }
    });

    console.log(`Đã xóa ${totalRemoved} toast notifications.`);
    if (removeContainer) {
      console.log("Container cũng đã bị xóa.");
    }
  } catch (error) {
    console.error("Lỗi khi xóa toast:", error);
  }
}

/**
 * Xóa một toast cụ thể theo ID
 * @param {string} id - ID của toast cần xóa
 */
function removeToastById(id) {
  try {
    const toast = document.querySelector(`[data-toast-id="${id}"]`);

    if (!toast) {
      console.log(`Không tìm thấy toast với ID: ${id}`);
      return;
    }

    // Xóa toast với animation
    toast.style.animation = "toast-out 0.3s forwards";

    // Xóa toast sau khi animation hoàn thành
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
        console.log(`Đã xóa toast với ID: ${id}`);
      }
    }, 300);
  } catch (error) {
    console.error(`Lỗi khi xóa toast với ID ${id}:`, error);
  }
}

// Make the functions available globally
if (typeof window !== "undefined") {
  window.removeAllToasts = removeAllToasts;
  window.removeToastById = removeToastById;
}

// Chạy chương trình
main();

// remove toast
