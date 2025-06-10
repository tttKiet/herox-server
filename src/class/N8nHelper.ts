import "dotenv/config";
import { IPostImgReg } from "../utils/interfaces";
import { logger } from "../utils/logger";

const API_N8N_HELPER_REUP_POST_IMG =
  process.env.API_N8N_HELPER_REUP_POST_IMG_PRO;

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

  async startRepostImage({
    postContent,
    imgRootBase64,
    isCreateImg,
    accountVerified,
  }: Partial<IPostImgRegN8n>) {
    try {
      const resp = await fetch(API_N8N_HELPER_REUP_POST_IMG!, {
        method: "POST",
        headers: {
          "Content-Type": "Application/json",
        },
        body: JSON.stringify({
          data: postContent?.split("||"),
          imgRootBase64,
          isCreateImg,
          accountVerified,
        }),
      });

      const res: IResN8nPostImage = await resp.json();
      return res;
    } catch (error: any) {
      logger.error(error?.message);
      return null;
    }
  }
}

export default N8nHelper;
