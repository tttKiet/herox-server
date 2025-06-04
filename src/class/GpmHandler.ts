import axios from "axios";
import { IResApiGpm, IResStartProfileGpm } from "../utils";
import { logger } from "../utils/logger";
import "dotenv/config";

const apiGpmuUrl = process.env.API_GPM_URL;

class GpmHandler {
  constructor() {}

  async startProfile(
    id: string,
    params: string = `win_scale=0.8&win_pos=300,300`
  ) {
    const apiUrl = apiGpmuUrl + `/api/v3/profiles/start/${id}?${params}`;
    try {
      const resp = await fetch(apiUrl);

      const res: IResApiGpm<IResStartProfileGpm> = await resp.json();
      return res.data;
    } catch (error: any) {
      logger.error(error?.message);
      return null;
    }
  }

  async waitForJsonVersion(address: string, retries = 5) {
    const url = `http://${address}/json/version`;
    for (let i = 0; i < retries; i++) {
      try {
        await axios.get(url, { timeout: 2000 });
        return;
      } catch (e) {
        console.log(
          `Chờ Chrome remote debugging ở ${address} (${i + 1}/${retries})`
        );
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    throw new Error(
      `Chrome remote debugging không phản hồi sau ${retries} lần thử`
    );
  }
}

export default GpmHandler;
