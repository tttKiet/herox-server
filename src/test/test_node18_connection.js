// Sử dụng cú pháp CommonJS (hỗ trợ cả Node.js v20 và các phiên bản cũ hơn)
const fetch = require("node-fetch");
const dns = require("dns");

// Thêm cấu hình DNS để ưu tiên IPv6 (giải pháp thay thế nếu hạ cấp Node.js không giải quyết vấn đề)
// Bỏ comment dòng bên dưới nếu cần
// dns.setDefaultResultOrder("ipv6first");

// Token Telegram của bạn
const token = "8313389349:AAFM3HcrJ-Py5lWhAIVEAaGkDJ5vqaLEmK4";

// Hiển thị thông tin về Node.js đang sử dụng
console.log("Node.js version:", process.version);
console.log("Node.js executable:", process.execPath);

// Test kết nối đến Telegram API
async function testConnection() {
  try {
    console.log("Testing Telegram API connection...");
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      method: "GET",
      timeout: 10000, // 10 seconds timeout
    });

    const data = await response.json();
    console.log("Response status:", response.status);
    console.log("API Response:", JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("Error connecting to Telegram API:", error.message);
    console.error("Error details:", error);
    return null;
  }
}

// Chạy test
testConnection().then((result) => {
  if (result && result.ok) {
    console.log("Connection successful with Node.js", process.version);
  } else {
    console.log("Connection failed with Node.js", process.version);
  }
});
