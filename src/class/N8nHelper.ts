import "dotenv/config";
import { IPostReg } from "../utils/interfaces";
import { logger } from "../utils/logger";
import PromptService from "./PromptService";
import TopicManager from "./TopicManager";
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
const topicManager = new TopicManager();

export interface IResN8nPost {
  ok: boolean;
  data: string;
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
  async startRepostImage({ projectName, tagName }: Partial<IPostReg>) {
    try {
      if (!projectName) {
        logger.error("Project name is required for reposting image");
        return null;
      }

      // Lấy random topic cho projectName
      const randomTopic = await topicManager.getRandomTopicEfficient({
        projectName: projectName,
      });

      if (!randomTopic) {
        logger.error(`No random topic found for project ${projectName}`);
        return null;
      }
      // Lấy tên của topic nếu có, nếu không thì sử dụng tagName
      const topicName = randomTopic.topicName;

      const userMessage = `${projectName}<>${topicName}<>${tagName}`;

      const resp = await axios.post(
        API_N8N_CREATE_POST_AGENT!,
        {
          userMessage: userMessage,
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
      // console.log(error);
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
      // Lấy danh sách topic hiện có từ database nếu existingTopics trống
      if (!data.existingTopics || data.existingTopics.length === 0) {
        try {
          const topics = await topicManager.getTopicsByProject({
            projectName: data.projectName,
            apiKey,
            limit: 100, // Lấy tối đa 100 topic hiện có
          });

          if (topics && topics.data && topics.data.length > 0) {
            // Lấy tên các topic hiện có
            data.existingTopics = topics.data.map((topic) => topic.topicName);
            logger.info(
              `Found ${data.existingTopics.length} existing topics for project: ${data.projectName}`
            );
          }
        } catch (err) {
          logger.error(`Error fetching existing topics: ${err}`);
          // Tiếp tục với mảng rỗng nếu có lỗi
          data.existingTopics = [];
        }
      }

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
