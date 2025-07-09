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

async function fetchAI(apiKey: string, body: IBodyChatRespDeepseek) {
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "Application/json",
      },
      body: JSON.stringify(body),
    });
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
    console.log("error when fetching AI:", error);
    if (error?.response) {
      console.log("error.response:", error.response);
    }
    throw new Error(error?.message || "Đã có lỗi xảy ra gọi AI catch!");
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
          data: respAi,
        });
        return;
      } catch (err: any) {
        console.error("Error:", err.message);
        res.status(500).json({
          ok: false,
          error: err.message,
        });
        return;
      }
    };
}

export default AiHandler;
