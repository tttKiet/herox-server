import "dotenv/config";
import { IAdmin, IPayment, IPrompt } from "../utils/interfaces";
import { logger } from "../utils/logger";
import { ObjectId } from "mongodb";
import { getCollection } from "../utils/mongoDb";

class PromptService {
  constructor() {}

  async createOrUpdatePrompt(data: Partial<IPrompt>) {
    try {
      const promptCol = getCollection<IPrompt>("prompts");

      // Nếu có _id => UPDATE
      if (data._id) {
        const _id =
          typeof data._id === "string" ? new ObjectId(data._id) : data._id;

        // Tạo object update **chỉ chứa những field được truyền**
        let updateData: Partial<IPrompt> = {};
        for (const key in data) {
          if (key !== "_id" && data[key as keyof IPrompt] !== undefined) {
            updateData[key] = data[key as keyof IPrompt];
          }
        }

        await promptCol.updateOne({ _id }, { $set: updateData });

        return true;
      }

      // CREATE
      if (data?.context) {
        const promptExisted = await promptCol.findOne({
          context: data.context,
        });
        if (promptExisted) throw new Error(`Prompt existed!`);
      }

      const newPrompt: IPrompt = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as IPrompt;

      const insertResult = await promptCol.insertOne(newPrompt);
      return insertResult;
    } catch (error: any) {
      throw new Error(error?.message || `Error to create | update prompt: `);
    }
  }

  async getPrompt(filter: {
    _id?: string;
    memberId?: string;
    type?: "PROMPT_CMT" | "PROMPT_POST" | "PROMPT_IMG";
    status?: "production" | "test";
  }) {
    try {
      const promptCol = getCollection<IPrompt>("prompts");
      const query: any = {};

      if (filter._id && ObjectId.isValid(filter._id)) {
        query._id = new ObjectId(filter._id);
      }

      if (filter.memberId && ObjectId.isValid(filter.memberId)) {
        query.memberId = new ObjectId(filter.memberId);
      }

      if (filter.type) {
        query.type = filter.type;
      }

      if (filter.status) {
        query.status = filter.status;
      }

      const prompts = await promptCol
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();

      logger.success(`Fetched ${prompts.length} prompt(s)`);
      return prompts;
    } catch (error: any) {
      logger.error("Failed to fetch prompts:", error?.message);
      throw new Error(error?.message || "Failed to fetch prompts");
    }
  }

  async deletePrompt(_id: string) {
    try {
      if (!ObjectId.isValid(_id)) {
        throw new Error("Invalid prompt _id");
      }
      const promptCol = getCollection<IPrompt>("prompts");
      const result = await promptCol.deleteOne({ _id: new ObjectId(_id) });

      if (result.deletedCount === 0) {
        throw new Error("Prompt not found or already deleted");
      }

      logger.success(`Prompt ${_id} deleted successfully`);
      return true;
    } catch (error: any) {
      throw new Error(error?.message || "Error deleting prompt");
    }
  }

  async pickPrompt(filter: {
    type: "PROMPT_CMT" | "PROMPT_POST" | "PROMPT_IMG";
    memberId: string;
  }) {
    try {
      const promptCol = getCollection<IPrompt>("prompts");
      const adminCol = getCollection<IAdmin>("admins");
      // Lấy list prompt của memberId truyền vào
      let list = await promptCol
        .find({
          type: filter.type,
          status: "production",
          memberId: filter.memberId,
        })
        .toArray();

      // console.log("list: ", list);
      // Nếu không có prompt nào, lấy _id của admin root (fullName: "Hero")
      if (!list.length) {
        const adminDoc = await adminCol.findOne({ fullName: "Hero" });
        // console.log("adminDoc: ", adminDoc);

        if (!adminDoc) {
          throw new Error(
            "No admin prompt found: missing admin with fullName 'Hero'"
          );
        }
        list = await promptCol
          .find({
            type: filter.type,
            status: "production",
            memberId: adminDoc._id.toString(),
          })
          .toArray();
        // console.log("list promptcol: ", list);
      }

      if (!list.length) {
        throw new Error("No prompt found with the specified type and status");
      }

      const randomIndex = Math.floor(Math.random() * list.length);
      return list[randomIndex];
    } catch (error: any) {
      throw new Error(error?.message || "Error picking prompt");
    }
  }
}

export default PromptService;
