// Test script để kiểm tra kết nối DeepSeek API
// Chạy: node test-deepseek.js

const https = require("https");

console.log("=== Testing DeepSeek API Connection ===\n");

// Test 1: DNS Resolution
console.log("1. Testing DNS resolution...");
const dns = require("dns");
dns.lookup("api.deepseek.com", (err, address) => {
  if (err) {
    console.log("❌ DNS resolution failed:", err.message);
  } else {
    console.log("✅ DNS resolved:", address);
  }
});

// Test 2: Basic HTTPS connection
console.log("\n2. Testing HTTPS connection...");
const req = https.request(
  {
    hostname: "api.deepseek.com",
    port: 443,
    path: "/",
    method: "GET",
    timeout: 10000,
  },
  (res) => {
    console.log("✅ HTTPS connection successful");
    console.log("Status:", res.statusCode);
    console.log("Headers:", res.headers);
    res.on("data", () => {});
    res.on("end", () => {
      console.log("Response completed");
    });
  }
);

req.on("error", (err) => {
  console.log("❌ HTTPS connection failed:", err.message);
  console.log("Error code:", err.code);
});

req.on("timeout", () => {
  console.log("❌ HTTPS connection timeout");
  req.destroy();
});

req.end();

// Test 3: Fetch API test
console.log("\n3. Testing with fetch API...");
async function testFetch() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch("https://api.deepseek.com", {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log("✅ Fetch API successful");
    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);
  } catch (error) {
    console.log("❌ Fetch API failed:", error.message);
    console.log("Error name:", error.name);
    console.log("Error code:", error.code);
    console.log("Error cause:", error.cause);
  }
}

testFetch();

// Test 4: Full API call simulation
console.log("\n4. Testing full API call...");
async function testFullAPI() {
  const testData = {
    model: "deepseek-chat",
    messages: [
      {
        role: "user",
        content: "Hello, this is a test message",
      },
    ],
    stream: false,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer DUMMY_KEY", // Sẽ lỗi auth nhưng test được network
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log("✅ Full API call reached server");
    console.log("Status:", response.status);

    const text = await response.text();
    console.log("Response preview:", text.substring(0, 200));
  } catch (error) {
    console.log("❌ Full API call failed:", error.message);
    console.log("Error details:", {
      name: error.name,
      code: error.code,
      cause: error.cause,
    });
  }
}

setTimeout(testFullAPI, 2000);

console.log("\n=== Test started, waiting for results... ===");
