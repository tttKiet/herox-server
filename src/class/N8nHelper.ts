import "dotenv/config";
import { IPostReg } from "../utils/interfaces";
import { logger } from "../utils/logger";
import PromptService from "./PromptService";
import axios from "axios";

const API_N8N_CREATE_POST_AGENT = process.env.API_N8N_HELPER_REUP_POST_IMG_PRO;

const promptService = new PromptService();

export interface IResN8nPost {
  ok: boolean;
  data: {
    post: string;
    imageUrl: string;
  };
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
}

export default N8nHelper;
