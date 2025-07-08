import "dotenv/config";
import { IPostImgReg } from "../utils/interfaces";
import { logger } from "../utils/logger";
import PromptService from "./PromptService";

const API_N8N_HELPER_REUP_POST_IMG =
  process.env.API_N8N_HELPER_REUP_POST_IMG_PRO;

const promptService = new PromptService();

export interface IPostImgRegN8n extends IPostImgReg {
  imgRootBase64: string;
}

export interface IResN8nPostImage {
  ok: boolean;
  data: {
    post: string;
    imageUrl: string;
  };
}

class N8nHelper {
  constructor() {}

  async startRepostImage(
    {
      userMessage,
      imgRootBase64,
      isCreateImg,
      accountVerified,
      folderName,
    }: Partial<IPostImgRegN8n>,
    apiKey: string
  ) {
    try {
      const promptPostPicked = await promptService.pickPrompt({
        type: "PROMPT_POST",
        memberId: apiKey,
      });
      // let promptImg: any = "";

      // if (isCreateImg) {
      //   const promptImgPicked = await promptService.pickPrompt({
      //     type: "PROMPT_IMG",
      //     memberId: apiKey,
      //   });

      //   promptImg = promptImgPicked.context;
      // }

      const resp = await fetch(API_N8N_HELPER_REUP_POST_IMG!, {
        method: "POST",
        headers: {
          "Content-Type": "Application/json",
        },
        body: JSON.stringify({
          userMessage: userMessage,
          folderName,
          imgRootBase64,
          isCreateImg,
          accountVerified,
          prompt: {
            post: promptPostPicked.context,
            image: "",
          },
        }),
      });

      const res: IResN8nPostImage = await resp.json();
      return res;
    } catch (error: any) {
      console.log(error);
      logger.error(error?.message);
      return null;
    }
  }
}

export default N8nHelper;
