import axios from "axios";
import { RequestHandler } from "express";
import GeminiAI from "../../../class/GeminiHandler";
import N8nHelper from "../../../class/N8nHelper";
import PromptService from "../../../class/PromptService";
import { isDeepSeekAPIKey, isGeminiAPIKey } from "../../../utils/functions";
import { IChat } from "src/utils/interfaces";
import { getCollection } from "../../../utils/mongoDb";
import { logger } from "../../../utils/logger";
import { ObjectId } from "mongodb";
const promptService = new PromptService();
const n8nHelper = new N8nHelper();

export interface IBodyChatRespDeepseek {
  messages: [
    { role: "system"; content: string },
    { role: "user"; content: string }
  ];
  stream: false;
  model: "deepseek-chat";
}

async function fetchAIDeepseek(
  apiKey: string,
  body: IBodyChatRespDeepseek,
  retryCount = 0
): Promise<string> {
  const maxRetries = 2;
  const timeoutMs = 60000; // 60 seconds

  try {
    const res = await axios.post(
      "https://api.deepseek.com/chat/completions",
      body,
      {
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
        },
        timeout: timeoutMs,
      }
    );

    const resp = res.data;

    if (res.status >= 200 && res.status < 300) {
      const chatResp = resp?.choices?.[0]?.message?.content;
      return chatResp;
    } else {
      console.log("Error ----------------------------------:");
      console.log("Body: ", { apiKey, body });

      console.log("resp ---------------------------- :", resp);
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
        `Retrying in ${delay}ms... (${retryCount + 1}/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchAIDeepseek(apiKey, body, retryCount + 1);
    }

    // Nếu đã retry hết hoặc không phải timeout error
    const errorMessage = isTimeoutError
      ? `Timeout kết nối tới DeepSeek API sau ${
          maxRetries + 1
        } lần thử. Vui lòng kiểm tra kết nối mạng.`
      : error.response?.data?.error?.message ||
        error?.message ||
        "Đã có lỗi xảy ra gọi AI catch!";

    throw new Error(errorMessage);
  }
}

class AiHandler {
  constructor() {}

  public chatResp: RequestHandler<Partial<IBodyChatRespDeepseek>> =
    async function (req, res) {
      const { apiKey, userMessage, systemMessage, chatKey } = req.body;

      if (!apiKey || !userMessage) {
        res.status(400).json({ ok: false, message: "Missing input!" });
        return;
      }

      try {
        // Chọn provider dựa vào chatKey
        if (isDeepSeekAPIKey(chatKey)) {
          // DeepSeek - xử lý đồng bộ
          const promptCmtPicked = await promptService.pickPrompt({
            type: "PROMPT_CMT",
            memberId: apiKey,
          });
          const promptCmt = promptCmtPicked.context;
          const respAi = await fetchAIDeepseek(chatKey, {
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

          // Trả về phản hồi đồng bộ
          res.status(200).json({
            ok: true,
            message: "Chat response received successfully!",
            data: respAi,
          });
          return;
        } else if (isGeminiAPIKey(chatKey)) {
          // Gemini - xử lý đồng bộ
          const gemini = new GeminiAI(chatKey);
          // Có thể dùng promptCmt nếu muốn, hoặc chỉ systemMessage
          const promptCmtPicked = await promptService.pickPrompt({
            type: "PROMPT_CMT",
            memberId: apiKey,
          });
          const promptCmt = promptCmtPicked.context;
          const sysMsg = promptCmt + "\n" + (systemMessage || "");
          const respAi = await gemini.chat(userMessage, sysMsg);

          // Trả về phản hồi đồng bộ
          res.status(200).json({
            ok: true,
            message: "Chat response received successfully!",
            data: respAi,
          });
          return;
        } else if (!chatKey || chatKey == "" || chatKey == "nimo-ai-server") {
          // Xử lý bất đồng bộ - tạo document chat mới với trạng thái pending
          const chatDoc = await createChatHistory({ userMessage }, apiKey);

          // Trả về document với trạng thái pending cho client
          res.status(200).json({
            ok: true,
            message: "Chat request queued successfully!",
            data: chatDoc,
          });

          // Xử lý bất đồng bộ sau khi đã trả response cho client
          processChatRequest(chatDoc, apiKey).catch((err) => {
            logger.error(
              `Error processing chat request ${chatDoc._id}: ${err.message}`
            );
          });

          return;
        } else {
          res.status(400).json({
            ok: false,
            message: "Invalid API key or unknown provider!",
          });
          return;
        }
      } catch (err: any) {
        console.log("Error: ", err);
        res.status(500).json({
          ok: false,
          message: err.message,
        });
        return;
      }
    };

  /**
   * Kiểm tra trạng thái của chat request
   */
  public getChat: RequestHandler = async function (req, res) {
    const { chatId } = req.params;

    if (!chatId) {
      res.status(400).json({ ok: false, message: "Chat ID is required" });
      return;
    }

    try {
      // Kiểm tra ID hợp lệ
      let objectId;
      try {
        objectId = new ObjectId(chatId);
      } catch (error) {
        res.status(400).json({ ok: false, message: "Invalid chat ID format" });
        return;
      }

      const chatCollection = getCollection<IChat>("chats");
      const chat = await chatCollection.findOne({ _id: objectId });

      if (!chat) {
        res.status(404).json({ ok: false, message: "Chat request not found" });
        return;
      }

      // Trả về trạng thái hiện tại của chat
      res.status(200).json({
        ok: true,
        data: chat,
      });
    } catch (err: any) {
      console.error("Error checking chat status:", err);
      res.status(500).json({
        ok: false,
        message: err.message || "Error checking chat status",
      });
    }
  };
}

/**
 * Tạo document chat history với trạng thái pending
 */
async function createChatHistory(
  { userMessage, promptId }: { userMessage: string; promptId?: string },
  apiKey: string
): Promise<IChat> {
  const chatCollection = getCollection<IChat>("chats");

  const now = new Date();
  const chatDoc: IChat = {
    memberId: apiKey,
    status: "pending",
    userMessage,
    promptId: promptId || "",
    createdAt: now,
    updatedAt: now,
  };

  const result = await chatCollection.insertOne(chatDoc as any);

  // Gán ID sau khi insert
  return {
    ...chatDoc,
    _id: result.insertedId,
  };
}

/**
 * Xử lý yêu cầu chat bất đồng bộ
 */
async function processChatRequest(chat: IChat, apiKey: string): Promise<void> {
  try {
    logger.info(`Processing chat request ${chat._id} for user ${apiKey}`);

    // Gọi API của n8n để xử lý
    const resp = await n8nHelper.chatReplyWithAgent(
      { userMessage: chat.userMessage },
      apiKey
    );

    if (resp && resp.ok && resp.data) {
      // Cập nhật document với kết quả thành công
      const chatCollection = getCollection<IChat>("chats");
      await chatCollection.updateOne(
        { _id: chat._id },
        {
          $set: {
            status: "success",
            aiContent: resp.data,
            updatedAt: new Date(),
          },
        }
      );
      logger.info(`Chat request ${chat._id} processed successfully`);
    } else {
      console.log("Response from n8n:", resp);

      // Cập nhật document với trạng thái lỗi
      const chatCollection = getCollection<IChat>("chats");
      await chatCollection.updateOne(
        { _id: chat._id },
        {
          $set: {
            status: "error",
            message: "Failed to get AI response",
            updatedAt: new Date(),
          },
        }
      );
      logger.error(
        `Chat request ${chat._id} failed: No valid response from n8n`
      );
    }
  } catch (error: any) {
    // Cập nhật document với trạng thái lỗi
    const chatCollection = getCollection<IChat>("chats");
    await chatCollection.updateOne(
      { _id: chat._id },
      {
        $set: {
          status: "error",
          message: error.message || "Unknown error occurred",
          updatedAt: new Date(),
        },
      }
    );
    logger.error(`Error processing chat request ${chat._id}: ${error.message}`);
  }
}

export default AiHandler;
