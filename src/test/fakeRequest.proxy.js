// Fake concurrent requests for debugging
const axios = require("axios");
const fs = require("fs");
const { HttpsProxyAgent } = require("https-proxy-agent");

const TARGET_URL =
  process.env.FAKE_REQUEST_URL ||
  "https://nimo.tokyo/api/v1/x/check-interact-post";
console.log("TARGET_URL: ", TARGET_URL);

// Đọc danh sách proxy từ file proxy.txt cùng cấp
let proxies = [];
try {
  proxies = fs
    .readFileSync(__dirname + "/proxy.txt", "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
} catch (e) {
  console.warn(
    "Không tìm thấy file proxy.txt hoặc file rỗng, sẽ không dùng proxy."
  );
}

function getProxyAgent(proxyRaw) {
  const [host, port, username, password] = proxyRaw.split(":");
  if (!host || !port) return undefined;
  let proxyUrl = `http://${host}:${port}`;
  if (username && password)
    proxyUrl = `http://${username}:${password}@${host}:${port}`;
  return new HttpsProxyAgent(proxyUrl);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postWithRetry(
  body,
  proxyRaw,
  index,
  maxRetry = 0,
  delayMs = 1000
) {
  let attempt = 0;
  const agent = getProxyAgent(proxyRaw);
  while (attempt <= maxRetry) {
    try {
      const res = await axios.post(
        TARGET_URL,
        body,
        agent ? { httpsAgent: agent, proxy: false } : {}
      );
      return { status: res.status, data: res.data };
    } catch (err) {
      const code = err.code;
      const status = err.response?.status;
      const message = err.message;
      if (
        (code === "ECONNABORTED" ||
          code === "ERR_BAD_RESPONSE" ||
          status === 522 ||
          message?.includes("timeout")) &&
        attempt < maxRetry
      ) {
        console.log(
          `Proxy #${index} retrying (attempt ${attempt + 2}/${
            maxRetry + 1
          }) after error: [${code || status}] ${message}`
        );
        await sleep(delayMs);
        attempt++;
        continue;
      }
      return {
        error: true,
        code,
        status,
        message,
      };
    }
  }
}

async function runAllProxies() {
  const body = {
    authorUsername: "allisjoann49623",
    targetUsername: "scarlette_si",
  };
  // Mỗi proxy chỉ chạy 1 request đồng thời
  return Promise.all(
    proxies.map((proxyRaw, idx) => postWithRetry(body, proxyRaw, idx + 1))
  );
}

(async () => {
  if (!proxies.length) {
    console.error("Không có proxy để chạy!");
    return;
  }
  console.log(
    `Số proxy: ${proxies.length}. Mỗi proxy sẽ chạy 1 request đồng thời.`
  );
  const results = await runAllProxies();
  results.forEach((res, idx) => {
    if (res.error) {
      console.log(
        `Proxy #${idx + 1} ❌ [${res.code || res.status || ""}] ${res.message}`
      );
    } else {
      console.log(`Proxy #${idx + 1} ✅ [${res.status}]`);
    }
  });
  console.log("\nAll requests sent!");
})();
