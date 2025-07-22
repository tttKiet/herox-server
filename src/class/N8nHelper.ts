import axios from "axios";
import "dotenv/config";
import { IPostReg } from "../utils/interfaces";
import { logger } from "../utils/logger";
import TopicManager from "./TopicManager";
// GeminiDirectApi được import động trong function để tránh circular dependency

const API_N8N_CREATE_POST_AGENT = process.env.API_N8N_HELPER_REUP_POST_IMG_PRO;
const API_N8N_CHAT_REPLY_WITH_AGENT =
  process.env.API_N8N_HELPER_CHAT_REPLY_WITH_AGENT;
// Thêm URL trực tiếp không qua Cloudflare nếu được cấu hình
const API_N8N_CHAT_REPLY_DIRECT = process.env.API_N8N_HELPER_CHAT_REPLY_DIRECT;

const API_N8N_GENERATOR_TOPIC = process.env.API_N8N_HELPER_GENERATOR_TOPIC;

const timeoutApi = Number.parseInt(process.env.TIMEOUT_API || "400000"); // Mặc định là 400 giây

if (!API_N8N_CREATE_POST_AGENT) {
  logger.error("API_N8N_CREATE_POST_AGENT is not defined in .env");
  throw new Error("API_N8N_CREATE_POST_AGENT is not defined in .env");
}

// Kiểm tra xem có ít nhất một trong hai URL N8N (qua Cloudflare hoặc trực tiếp)
if (!API_N8N_CHAT_REPLY_WITH_AGENT && !API_N8N_CHAT_REPLY_DIRECT) {
  logger.error(
    "Không có URL cho N8N API (cả Cloudflare và trực tiếp đều không được định nghĩa)"
  );
  throw new Error("Cần cấu hình ít nhất một URL N8N API trong .env");
}

if (!API_N8N_GENERATOR_TOPIC) {
  logger.error("API_N8N_GENERATOR_TOPIC is not defined in .env");
  throw new Error("API_N8N_GENERATOR_TOPIC is not defined in .env");
}

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
          timeout: timeoutApi,
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
    // Cấu hình options chung cho axios
    const axiosOptions = {
      headers: {
        "Content-Type": "Application/json",
      },
      timeout: timeoutApi,
    };

    // Dữ liệu gửi đi
    const requestData = {
      userMessage: userMessage,
    };

    try {
      const apiUrl = API_N8N_CHAT_REPLY_WITH_AGENT!;

      const resp = await axios.post(apiUrl, requestData, axiosOptions);

      const resData: IRespN8nAi = resp.data;

      if (!resData || !resData.data) {
        logger.warn(
          `N8N API returned empty response: ${JSON.stringify(resData)}`
        );
        throw new Error("Empty response from Cloudflare N8N API");
      }

      return resData;
    } catch (error: any) {
      // Log chi tiết lỗi
      logger.error(`N8N Chat Reply Error: ${error?.message}`);

      // Log thêm chi tiết lỗi để debug
      if (error.response) {
        // Lỗi với response từ server
        logger.error(`N8N API Error Status: ${error.response.status}`);
        logger.error(
          `N8N API Error Data: ${JSON.stringify(error.response.data)}`
        );
      } else if (error.request) {
        // Lỗi không nhận được response
        logger.error(
          `N8N API Timeout/Network Error: Request was made but no response was received`
        );

        // Log chi tiết timeout để biết thêm thông tin
        if (error.code === "ECONNABORTED") {
          logger.error("Connection aborted due to timeout");
        } else if (error.code === "ETIMEDOUT") {
          logger.error("Connection timed out");
        }
      } else {
        // Lỗi khác khi setup request
        logger.error(`N8N API Request Setup Error: ${error.message}`);
      }

      throw error;
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
            limit: 1000, // Lấy tối đa 1000 topic hiện có
          });

          if (topics && topics.data && topics.data.length > 0) {
            // Lấy tên các topic hiện có
            data.existingTopics = topics.data.map((topic) => topic.topicName);
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
        timeout: timeoutApi,
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
