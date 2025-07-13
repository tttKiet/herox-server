
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