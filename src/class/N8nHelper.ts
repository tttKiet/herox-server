import "dotenv/config";
import { IPostReg } from "../utils/interfaces";
import { logger } from "../utils/logger";
import PromptService from "./PromptService";
import axios from "axios";

const API_N8N_CREATE_POST_AGENT = process.env.API_N8N_HELPER_REUP_POST_IMG_PRO;
const API_N8N_CHAT_REPLY_WITH_AGENT =
  process.env.API_N8N_HELPER_CHAT_REPLY_WITH_AGENT;

const API_N8N_GENERATOR_TOPIC = process.env.API_N8N_HELPER_GENERATOR_TOPIC;

if (!API_N8N_CREATE_POST_AGENT) {
  logger.error("API_N8N_CREATE_POST_AGENT is not defined in .env");
  throw new Error("API_N8N_CREATE_POST_AGENT is not defined in .env");
}

if (!API_N8N_CHAT_REPLY_WITH_AGENT) {
  logger.error("API_N8N_CHAT_REPLY_WITH_AGENT is not defined in .env");
  throw new Error("API_N8N_CHAT_REPLY_WITH_AGENT is not defined in .env");
}

if (!API_N8N_GENERATOR_TOPIC) {
  logger.error("API_N8N_GENERATOR_TOPIC is not defined in .env");
  throw new Error("API_N8N_GENERATOR_TOPIC is not defined in .env");
}

const promptService = new PromptService();

export interface IResN8nPost {
  ok: boolean;
  data: {
    post: string;
    imageUrl: string;
  };
}

export interface IRespN8nAi {
  ok: boolean;
  data: string;
}

export interface IRespN8nChatReply {
  userMessage: string;
}

export interface IRespN8nGeneratorTopic {
  projectName: string;
  quantities: number;
  existingTopics: string[];
}

class N8nHelper {
  constructor() {}

  async startRepostImage(
    { userMessage, folderName }: Partial<IPostReg>,
    apiKey: string
  ) {
    try {
      const promptPostPicked = await promptService.pickPrompt({
        type: "PROMPT_POST",
        memberId: apiKey,
      });

      const resp = await axios.post(
        API_N8N_CREATE_POST_AGENT!,
        {
          userMessage: userMessage,
          folderName,
          prompt: {
            post: promptPostPicked.context,
            image: "",
          },
        },
        {
          headers: {
            "Content-Type": "Application/json",
          },
        }
      );
      const res: IResN8nPost = resp.data;
      return res;
    } catch (error: any) {
      console.log(error);
      logger.error(error?.message);
      return null;
    }
  }

  async chatReplyWithAgent({ userMessage }: IRespN8nChatReply, apiKey: string) {
    try {
      const resp = await axios.post(
        API_N8N_CHAT_REPLY_WITH_AGENT!,
        {
          userMessage: userMessage,
        },
        {
          headers: {
            "Content-Type": "Application/json",
          },
        }
      );
      const resData: IRespN8nAi = resp.data;

      return resData;
    } catch (error: any) {
      console.log(error);
      logger.error(error?.message);
      return null;
    }
  }

  async generatorTopic(data: IRespN8nGeneratorTopic, apiKey: string) {
    try {
      const resp = await axios.post(API_N8N_GENERATOR_TOPIC!, data, {
        headers: {
          "Content-Type": "Application/json",
        },
        // Increase timeout to 5 minutes since AI generation can take longer
        timeout: 300000, // 5 minutes in milliseconds
      });
      const resData: {
        ok: boolean;
        data: string[];
      } = resp.data;

      return resData;
    } catch (error: any) {
      console.log(error);
      logger.error("Topic generator error:", error?.message);
      return null;
    }
  }
}

export default N8nHelper;
