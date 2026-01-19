import axios from "axios";
import { IBodyV98 } from "../interfaces";
import { text } from "telegraf/typings/button";

export function isRootAdmin(apiKey: string): boolean {
  return true;
}

/**
 * Enum định nghĩa các loại AI provider
 */
export enum AIProvider {
  DEEPSEEK = "deepseek",
  GEMINI = "gemini",
  V98 = "V98",
  UNKNOWN = "unknown",
}

/**
 * Interface cho kết quả kiểm tra API key
 */
export interface IAPIKeyCheck {
  isValid: boolean;
  provider: AIProvider;
  message: string;
}

/**
 * Kiểm tra API key thuộc về DeepSeek hay Gemini
 * @param apiKey - API key cần kiểm tra
 * @returns IAPIKeyCheck - Thông tin về API key
 */
export function checkAPIKeyProvider(apiKey: string): IAPIKeyCheck {
  if (!apiKey || typeof apiKey !== "string") {
    return {
      isValid: false,
      provider: AIProvider.UNKNOWN,
      message: "API key is required and must be a string",
    };
  }

  const trimmedKey = apiKey.trim();

  if (trimmedKey === "") {
    return {
      isValid: false,
      provider: AIProvider.UNKNOWN,
      message: "API key cannot be empty",
    };
  }

  // Format: v98|<model-name>|<api-key> (bắt đầu bằng "v98|")
  if (trimmedKey.startsWith("v98|")) {
    if (trimmedKey.length >= 10) {
      // Tối thiểu v98- + ít nhất 6 ký tự
      return {
        isValid: true,
        provider: AIProvider.V98,
        message: "Valid V98 API key",
      };
    } else {
      return {
        isValid: false,
        provider: AIProvider.V98,
        message: "V98 API key too short (should be v98-...)",
      };
    }
  }

  // Kiểm tra DeepSeek API key
  // Format: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (bắt đầu bằng "sk-")
  if (trimmedKey.startsWith("sk-")) {
    if (trimmedKey.length >= 10) {
      // Tối thiểu sk- + ít nhất 6 ký tự
      return {
        isValid: true,
        provider: AIProvider.DEEPSEEK,
        message: "Valid DeepSeek API key",
      };
    } else {
      return {
        isValid: false,
        provider: AIProvider.DEEPSEEK,
        message: "DeepSeek API key too short (should be sk-...)",
      };
    }
  }

  // Kiểm tra Gemini API key
  // Format: AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX (bắt đầu bằng "AIzaSy")
  if (trimmedKey.startsWith("AIzaSy")) {
    if (trimmedKey.length === 39) {
      // Gemini API key có độ dài cố định 39 ký tự
      return {
        isValid: true,
        provider: AIProvider.GEMINI,
        message: "Valid Gemini API key",
      };
    } else {
      return {
        isValid: false,
        provider: AIProvider.GEMINI,
        message: `Gemini API key should be 39 characters long (current: ${trimmedKey.length})`,
      };
    }
  }

  // Không khớp với format nào
  return {
    isValid: false,
    provider: AIProvider.UNKNOWN,
    message:
      "Unknown API key format. Expected DeepSeek (sk-...) or Gemini (AIzaSy...)",
  };
}

/**
 * Kiểm tra có phải DeepSeek API key không
 * @param apiKey - API key cần kiểm tra
 * @returns boolean - true nếu là DeepSeek key hợp lệ
 */
export function isDeepSeekAPIKey(apiKey: string): boolean {
  const check = checkAPIKeyProvider(apiKey);
  return check.isValid && check.provider === AIProvider.DEEPSEEK;
}

export function isV98APIKey(apiKey: string): boolean {
  const check = checkAPIKeyProvider(apiKey);
  return check.isValid && check.provider === AIProvider.V98;
}

/**
 * Kiểm tra có phải Gemini API key không
 * @param apiKey - API key cần kiểm tra
 * @returns boolean - true nếu là Gemini key hợp lệ
 */
export function isGeminiAPIKey(apiKey: string): boolean {
  const check = checkAPIKeyProvider(apiKey);
  return check.isValid && check.provider === AIProvider.GEMINI;
}

/**
 * Lấy provider name từ API key
 * @param apiKey - API key cần kiểm tra
 * @returns string - Tên provider ('deepseek', 'gemini', 'unknown')
 */
export function getAPIKeyProvider(apiKey: string): string {
  const check = checkAPIKeyProvider(apiKey);
  return check.provider;
}

/**
 * Xoá nội dung trong dấu ngoặc đơn từ một chuỗi
 * @param text - Chuỗi cần xử lý
 * @returns string - Chuỗi sau khi đã loại bỏ nội dung trong ngoặc đơn
 *
 * Ví dụ:
 * "abcs (sadsasacas)" -> "abcs "
 * "Hello world (note: example)" -> "Hello world "
 */
export function removeTextInParentheses(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  // Sử dụng regex để xoá tất cả nội dung trong dấu ngoặc đơn
  return text.replace(/\([^)]*\)/g, "");
}

export async function fetchAIV98(
  apiKey: string,
  body: IBodyV98,
  retryCount = 0,
): Promise<string> {
  const maxRetries = 2;
  const timeoutMs = 400000; // 400 seconds

  try {
    const rawBody = {
      model: body.model,
      input: [
        {
          role: "developer",
          content: body.systemMessage,
        },

        {
          role: "user",
          content: [{ type: "input_text", text: body.userMessage }],
        },
      ],
      tools: [],
      text: { format: { type: "text" }, verbosity: "medium" },
      reasoning: { effort: "medium", summary: "auto" },
      stream: false,
      store: true,
    };

    const res = await axios.post("https://v98store.com/v1/responses", rawBody, {
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      timeout: timeoutMs,
    });

    const resp = res.data;

    if (res.status >= 200 && res.status < 300) {
      const chatResp = resp.output
        ?.find((x) => x.type === "message")
        ?.content?.find((p) => p.type === "output_text")?.text;

      return chatResp;
    } else {
      console.log("Error ----------------------------------:");
      console.log("Body: ", { apiKey, body });

      if (resp?.error) {
        console.log("error message:", resp.error.message);
        console.log("error type:", resp.error.type);
        console.log("error code:", resp.error.code);
      }
      throw new Error(
        resp?.error?.message ||
          `Đã có lỗi xảy ra gọi AI! Status: ${res.status}`,
      );
    }
  } catch (error: any) {
    // Log chi tiết nội dung lỗi từ axios
    console.log("Error: ", error);
    // Retry logic cho timeout errors
    const isTimeoutError =
      error.code === "ECONNABORTED" ||
      error.code === "UND_ERR_CONNECT_TIMEOUT" ||
      error.message?.includes("timeout") ||
      error.message?.includes("Network Error");

    if (isTimeoutError && retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
      console.log(
        `Retrying in ${delay}ms... (${retryCount + 1}/${maxRetries})`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchAIV98(apiKey, body, retryCount + 1);
    }

    // Nếu đã retry hết hoặc không phải timeout error
    const errorMessage = isTimeoutError
      ? `Timeout kết nối tới V98 API sau ${
          maxRetries + 1
        } lần thử. Vui lòng kiểm tra kết nối mạng.`
      : error.response?.data?.error?.message ||
        error?.message ||
        "Đã có lỗi xảy ra gọi AI catch!";

    throw new Error(errorMessage);
  }
}
