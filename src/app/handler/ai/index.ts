import axios from "axios";
import { RequestHandler } from "express";
import GeminiAI from "../../../class/GeminiHandler";
import N8nHelper from "../../../class/N8nHelper";
import PromptService from "../../../class/PromptService";
import { isDeepSeekAPIKey, isGeminiAPIKey } from "../../../utils/functions";
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
        let respAi: string;
        if (isDeepSeekAPIKey(chatKey)) {
          // DeepSeek
          const promptCmtPicked = await promptService.pickPrompt({
            type: "PROMPT_CMT",
            memberId: apiKey,
          });
          const promptCmt = promptCmtPicked.context;
          respAi = await fetchAIDeepseek(chatKey, {
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
        } else if (isGeminiAPIKey(chatKey)) {
          // Gemini
          const gemini = new GeminiAI(chatKey);
          // Có thể dùng promptCmt nếu muốn, hoặc chỉ systemMessage
          const promptCmtPicked = await promptService.pickPrompt({
            type: "PROMPT_CMT",
            memberId: apiKey,
          });
          const promptCmt = promptCmtPicked.context;
          const sysMsg = promptCmt + "\n" + (systemMessage || "");
          respAi = await gemini.chat(userMessage, sysMsg);
        } else if (!chatKey || chatKey == "" || chatKey == "nimo-ai-server") {
          const resp = await n8nHelper.chatReplyWithAgent(
            { userMessage },
            apiKey
          );
          const messageAi = resp?.data;
          console.log("messageAi: ", messageAi);

          if (!messageAi) {
            res.status(500).json({
              ok: false,
              message: "No response received from N8n AI server!",
            });
            return;
          }

          respAi = messageAi;
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
}

export default AiHandler;
