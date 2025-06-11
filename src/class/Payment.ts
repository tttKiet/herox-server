import "dotenv/config";
import { IPayment, IPostImgReg } from "../utils/interfaces";
import { logger } from "../utils/logger";
import { ObjectId } from "mongodb";
import { getCollection } from "../utils/mongoDb";

export interface IUseCreateImg {
  memberId: string | ObjectId;
  postId: string | ObjectId;
}

class Payment {
  constructor() {}

  async useCreateImg({ memberId, postId }: IUseCreateImg) {
    try {
      const paymentDocument: IPayment = {
        status: "success",
        description: "",
        memberId,
        postId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const repoCol = getCollection<IPayment>("payments");
      const paymentedDoc = await repoCol.findOne({ memberId, postId });
      logger.success("Billing create sucessfully!");
      if (paymentedDoc) return true;
      else {
        // create
        await repoCol.insertOne(paymentDocument);
        return true;
      }
    } catch (error: any) {
      logger.error(error?.message);
      return false;
    }
  }
}

export default Payment;
