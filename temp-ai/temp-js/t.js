let toastContainer = document.querySelector(".toast-container");

if (!toastContainer) {
  // Tạo container cho toast
  toastContainer = document.createElement("div");
  toastContainer.className = "toast-container";
  document.body.appendChild(toastContainer);

  // CSS cho toast (chèn trực tiếp bằng JS)
  const style = document.createElement("style");
  style.textContent = `
    .toast-container {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .toast {
        width: calc(100% - 40px);
        max-width: 1200px;
        padding: 20px 20px;
        margin-bottom: 10px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.3s ease, transform 0.3s ease;
        font-size: 28px;
        font-weight: bold;
    }

    .toast.active {
        opacity: 1;
        transform: translateY(0);
    }

    .toast.info {
        background-color: rgba(224, 247, 250, 0.85);
        color: #006064;
    }

    .toast.success {
        background-color: hsl(125deg 53% 90% / 85%);
        color: #2e7d32;
    }

    .toast.error {
        background-color: rgba(255, 235, 238, 0.85);
        color: #c62828;
    }

    

    .test-btn {
        margin: 10px;
        padding: 8px 16px;
        cursor: pointer;
        border: none;
        border-radius: 4px;
        background-color: #f0f0f0;
        font-size: 14px;
    }
`;
  document.head.appendChild(style);
}

// Hàm tạo và hiển thị toast
function showToast(type, message, duration = 3000) {
  // Xóa tất cả toast cũ
  Array.from(toastContainer.children).forEach((toast) => {
    clearTimeout(toast.timeoutId);
    toast.classList.remove("active");
    setTimeout(() => toast.remove(), 300);
  });

  // Tạo toast mới
  const toast = document.createElement("div");
  toast.classList.add("toast", type);
  toast.innerHTML = `
    <span>${message}</span>
`;

  // Thêm toast vào container
  toastContainer.appendChild(toast);

  // Kích hoạt animation
  setTimeout(() => toast.classList.add("active"), 10);

  // Tự động xóa sau duration
  toast.timeoutId = setTimeout(() => {
    toast.classList.remove("active");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Tạo các nút test
const types = [
  { type: "info", message: "Đây là thông báo thông tin!", duration: 3000 },
  {
    type: "success",
    message: "Thành công! Dữ liệu đã được lưu.",
    duration: 4000,
  },
  {
    type: "error",
    message: "Có lỗi xảy ra, vui lòng thử lại.",
    duration: 5000,
  },
];

const type = "$type";
const message = "$message";
const duration = $duration;

showToast(type, message, duration);
