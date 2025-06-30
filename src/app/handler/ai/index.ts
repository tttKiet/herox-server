import { RequestHandler } from "express";
import { logger } from "../../../utils/logger";
import { systemMessage as initSystemMessage } from "./message";

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
      const chatResp = resp?.choices[0]?.message?.content;
      // console.log({ resp: res.status, chatResp });
      return chatResp;
    } else {
      console.log("Error: ", resp.error);
      throw new Error(resp?.error?.message || "Đã có lỗi xảy ra gọi AI!");
    }
  } catch (error: any) {
    console.log(error);
    throw new Error(error?.message || "Đã có lỗi xảy ra gọi AI catch!");
  }
}

class AiHandler {
  constructor() {}

  public chatResp: RequestHandler<Partial<IBodyChatRespDeepseek>> =
    async function (req, res) {
      const { apiKey, userMessage, systemMessage } = req.body;

      if (!apiKey || !userMessage) {
        logger.error("Missing input!");
        res.status(400).json({ ok: false, message: "Missing input!" });
        return;
      }

      try {
        const respAi = await fetchAI(apiKey, {
          messages: [
            {
              role: "system",
              content: initSystemMessage + "\n" + systemMessage,
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
