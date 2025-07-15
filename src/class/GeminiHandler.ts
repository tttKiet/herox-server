import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../utils/logger";

class GeminiAI {
  private genAI: GoogleGenerativeAI;
  private defaultModel: string = "gemini-2.5-flash-preview-05-20";

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Gemini API key is required");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async chat(userMessage: string, systemMessage?: string): Promise<string> {
    try {
      if (!userMessage || userMessage.trim() === "") {
        throw new Error("User message is required");
      }

      // Khởi tạo model với system instruction
      const geminiModel = this.genAI.getGenerativeModel({
        model: this.defaultModel,
        systemInstruction: systemMessage,
      });

      // Gửi request
      const result = await geminiModel.generateContent(userMessage);
      const response = result.response;
      const text = response.text();

      if (!text || text.trim() === "") {
        throw new Error("Empty response from Gemini API");
      }

      return text;
    } catch (error: any) {
      const errorMessage = error?.message || "Gemini chat failed";
      logger.error("Gemini chat error:", errorMessage);
      throw new Error(`Gemini API Error: ${errorMessage}`);
    }
  }

  async chatStream(
    userMessage: string,
    systemMessage: string | undefined,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    try {
      if (!userMessage || userMessage.trim() === "") {
        throw new Error("User message is required");
      }

      const geminiModel = this.genAI.getGenerativeModel({
        model: this.defaultModel,
        systemInstruction: systemMessage,
      });

      const result = await geminiModel.generateContentStream(userMessage);
      let fullText = "";

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        onChunk(chunkText);
      }

      if (!fullText || fullText.trim() === "") {
        throw new Error("Empty stream response from Gemini API");
      }

      logger.info(`Gemini stream successful for model: ${this.defaultModel}`);
      return fullText;
    } catch (error: any) {
      const errorMessage = error?.message || "Gemini stream failed";
      logger.error("Gemini stream error:", errorMessage);
      throw new Error(`Gemini Stream Error: ${errorMessage}`);
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.chat("Hello");
      return true;
    } catch (error: any) {
      logger.error(
        "API key validation failed:",
        error?.message || "Unknown error"
      );
      return false;
    }
  }

  /**
   * Lấy danh sách models có sẵn
   * @returns Promise<string[]> - Danh sách models
   */
  async listModels(): Promise<string[]> {
    try {
      // Note: listModels không có sẵn trong SDK, trả về danh sách models phổ biến
      return [
        "gemini-2.5-flash-lite-preview-06-17",
        "gemini-2.5-flash-preview-05-20",
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
      ];
    } catch (error: any) {
      logger.error("Failed to list models:", error?.message || "Unknown error");
      return [];
    }
  }

  /**
   * Set model mặc định
   */
  setDefaultModel(model: string): void {
    if (!model || model.trim() === "") {
      throw new Error("Model name cannot be empty");
    }
    this.defaultModel = model;
    logger.info(`Default model changed to: ${model}`);
  }

  /**
   * Get model mặc định
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }
}

export default GeminiAI;
