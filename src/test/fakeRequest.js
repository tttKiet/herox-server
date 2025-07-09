// Fake concurrent requests for debugging
const axios = require("axios");

const TARGET_URL =
  process.env.FAKE_REQUEST_URL ||
  "http://127.0.0.1:3000/api/v1/x/check-interact-post";
const TOTAL_REQUESTS = parseInt(process.env.FAKE_REQUEST_TOTAL || "7000", 10); // tổng số request
const CONCURRENCY = parseInt(
  process.env.FAKE_REQUEST_CONCURRENCY || "7000",
  10
); // số request đồng thời
console.log("TARGET_URL: ", TARGET_URL);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postWithRetry(body, index, maxRetry = 0, delayMs = 1000) {
  let attempt = 0;
  while (attempt <= maxRetry) {
    console.log("index: ", index);

    try {
      const res = await axios.post(TARGET_URL, body);

      return { status: res.status, data: res.data };
    } catch (err) {
      const code = err.code;
      const status = err.response?.status;
      const message = err.message;
      // Retry nếu lỗi mạng hoặc 522 hoặc timeout
      if (
        (code === "ECONNABORTED" ||
          code === "ERR_BAD_RESPONSE" ||
          status === 522 ||
          message?.includes("timeout")) &&
        attempt < maxRetry
      ) {
        console.log(
          `Retrying request (attempt ${attempt + 2}/${
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

async function runBatch(batch) {
  const body = {
    authorUsername: "allisjoann49623",
    targetUsername: "scarlette_si",
  };
  return Promise.all(batch.map((i) => postWithRetry(body, i + 1)));
}

(async () => {
  let sent = 0;
  let batchNum = 1;
  while (sent < TOTAL_REQUESTS) {
    const batchSize = Math.min(CONCURRENCY, TOTAL_REQUESTS - sent);
    const batch = Array.from({ length: batchSize }, (_, i) => sent + i + 1);
    console.log(`\nBatch ${batchNum}: Sending ${batchSize} requests...`);
    const results = await runBatch(batch);
    results.forEach((res, idx) => {
      if (res.error) {
        console.log(
          `Request #${sent + idx + 1} ❌ [${res.code || res.status || ""}] ${
            res.message
          }`
        );
      } else {
        console.log(`Request #${sent + idx + 1} ✅ [${res.status}]`);
      }
    });
    sent += batchSize;
    batchNum++;
    if (sent < TOTAL_REQUESTS) await sleep(500); // nghỉ 0.5s giữa các batch
  }
  console.log("\nAll requests sent!");
})();
