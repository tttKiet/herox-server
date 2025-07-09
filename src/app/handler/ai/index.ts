import { RequestHandler } from "express";
import PromptService from "../../../class/PromptService";
const promptService = new PromptService();

export interface IBodyChatRespDeepseek {
  messages: [
    { role: "system"; content: string },
    { role: "user"; content: string }
  ];
  stream: false;
  model: "deepseek-chat";
}

async function fetchAI(
  apiKey: string,
  body: IBodyChatRespDeepseek,
  retryCount = 0
): Promise<string> {
  const maxRetries = 2;
  const timeoutMs = 60000; // 60 seconds
  console.log("[fetchAI] Starting request with body:", { apiKey, body });

  try {
    console.log(
      `[fetchAI] Attempt ${retryCount + 1}/${
        maxRetries + 1
      } - Calling DeepSeek API...`
    );

    // Tạo AbortController để timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "Application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const resp = await res.json();

    if (res.ok) {
      const chatResp = resp?.choices?.[0]?.message?.content;
      return chatResp;
    } else {
      console.log("resp:", resp);
      console.log("res.status:", res.status);
      console.log("res.statusText:", res.statusText);
      // In chi tiết lỗi nếu có
      if (resp?.error) {
        console.log("error message:", resp.error.message);
        console.log("error type:", resp.error.type);
        console.log("error code:", resp.error.code);
      }
      throw new Error(
        resp?.error?.message || `Đã có lỗi xảy ra gọi AI! Status: ${res.status}`
      );
    }
  } catch (error: any) {
    console.log(`[fetchAI] Error on attempt ${retryCount + 1}:`, error.message);

    // Log chi tiết các loại lỗi
    if (error.name === "AbortError") {
      console.log(`[fetchAI] Request timeout after ${timeoutMs}ms`);
    }
    if (error.cause?.code === "UND_ERR_CONNECT_TIMEOUT") {
      console.log(
        "[fetchAI] Connect timeout error - Network/DNS/Firewall issue"
      );
    }
    if (error.code === "UND_ERR_CONNECT_TIMEOUT") {
      console.log(
        "[fetchAI] Connect timeout error (legacy) - Network/DNS/Firewall issue"
      );
    }
    if (error?.response) {
      console.log("error.response:", error.response);
    }

    // Log thêm thông tin debug
    console.log("[fetchAI] Error details:", {
      name: error.name,
      code: error.code,
      message: error.message,
      cause: error.cause,
    });

    // Retry logic cho timeout errors
    const isTimeoutError =
      error.name === "AbortError" ||
      error.code === "UND_ERR_CONNECT_TIMEOUT" ||
      error.cause?.code === "UND_ERR_CONNECT_TIMEOUT" ||
      error.message?.includes("fetch failed");

    if (isTimeoutError && retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
      console.log(
        `-------------> [fetchAI] Retrying in ${delay}ms... (${
          retryCount + 1
        }/${maxRetries})`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchAI(apiKey, body, retryCount + 1);
    }

    // Nếu đã retry hết hoặc không phải timeout error
    const errorMessage = isTimeoutError
      ? `Timeout kết nối tới DeepSeek API sau ${
          maxRetries + 1
        } lần thử. Vui lòng kiểm tra kết nối mạng.`
      : error?.message || "Đã có lỗi xảy ra gọi AI catch!";

    throw new Error(errorMessage);
  }
}

class AiHandler {
  constructor() {}

  public chatResp: RequestHandler<Partial<IBodyChatRespDeepseek>> =
    async function (req, res) {
      const { apiKey, userMessage, systemMessage, chatKey } = req.body;
      console.log("\n[AiHandler] chatResp called with body:", req.body);

      if (!apiKey || !userMessage || !chatKey) {
        res.status(400).json({ ok: false, message: "Missing input!" });
        return;
      }

      try {
        const promptCmtPicked = await promptService.pickPrompt({
          type: "PROMPT_CMT",
          memberId: apiKey,
        });

        const promptCmt = promptCmtPicked.context;
        const respAi = await fetchAI(chatKey, {
          messages: [
            {
              role: "system",
              content: promptCmt + "\n" + systemMessage,
            },
            { role: "user", content: userMessage },
          ],
          stream: false,
          model: "deepseek-chat",
        });

        res.status(200).json({
          ok: true,
          message: "Chat response received successfully!",
          data: respAi,
        });
        return;
      } catch (err: any) {
        console.error("Error:", err.message);
        res.status(500).json({
          ok: false,
          message: err.message,
        });
        return;
      }
    };
}

export default AiHandler;
