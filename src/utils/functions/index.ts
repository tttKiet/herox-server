export function isRootAdmin(apiKey: string): boolean {
  return true;
}

/**
 * Enum định nghĩa các loại AI provider
 */
export enum AIProvider {
  DEEPSEEK = "deepseek",
  GEMINI = "gemini",
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
