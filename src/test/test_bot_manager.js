const axios = require("axios");
const { exec } = require("child_process");

const token = "8313389349:AAFM3HcrJ-Py5lWhAIVEAaGkDJ5vqaLEmK4"; // Thay bằng token thật
const url = `https://api.telegram.org/bot${token}/getMe`;

// Kiểm tra kết nối internet
console.log("Kiểm tra kết nối internet và proxy...");

// Kiểm tra kết nối đến api.telegram.org
exec("ping api.telegram.org -n 3", (error, stdout, stderr) => {
  console.log("\n--- Ping api.telegram.org ---");
  if (error) {
    console.log(`Không thể ping đến api.telegram.org: ${error.message}`);
  }
  console.log(stdout);

  // Tiếp tục với request
  testRequest();
});

// Thử kết nối không có proxy
async function testRequest() {
  console.log("\n--- Test kết nối với Telegram API ---");

  try {
    console.log(`URL đang test: ${url}`);
    console.log("Đang gửi request...");

    const response = await axios.get(url, {
      timeout: 30000, // tăng timeout lên 30s
    });

    console.log("Kết nối thành công!");
    console.log("Status code:", response.status);
    console.log("Bot info:", response.data);
  } catch (error) {
    console.error("Axios request failed:", error.message);

    if (error.code) {
      console.error("Error code:", error.code);
    }

    if (error.response) {
      // Server trả về lỗi
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else if (error.request) {
      // Request đã được gửi nhưng không nhận được response
      console.error("Không nhận được response từ server");
      console.error("Error code:", error.code);

      // Kiểm tra nếu là lỗi timeout
      if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
        console.error("\nLỗi timeout hoặc kết nối bị hủy.");
        console.error("Có thể do:");
        console.error("1. Vấn đề kết nối mạng");
        console.error("2. Firewall hoặc antivirus đang chặn kết nối");
        console.error("3. Proxy hoặc VPN đang gây cản trở");
      }
    }
  }
}
