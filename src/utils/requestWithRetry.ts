// Hàm retry cho bất kỳ API call async nào (axios, fetch, ...)
export async function requestWithRetry<T>(
  fn: () => Promise<T>,
  maxRetry = 2,
  delayMs = 1000
): Promise<T> {
  let attempt = 0;
  while (attempt <= maxRetry) {
    try {
      return await fn();
    } catch (err: any) {
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
          `requestWithRetry: Retrying (attempt ${attempt + 2}/$${
            maxRetry + 1
          }) after error: [${code || status}] ${message}`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        attempt++;
        continue;
      }
      throw err;
    }
  }
  throw new Error("requestWithRetry: All retry attempts failed");
}
