import "dotenv/config";
import { ObjectId } from "mongodb";
import { getCollection } from "../utils/mongoDb";
import { logger } from "../utils/logger";
import { ITopic } from "../utils/interfaces";

export interface ITopicQuery {
  projectName: string;
  apiKey?: string;
  limit?: number;
  page?: number;
}

export interface IRandomTopicQuery {
  projectName: string;
}

class TopicManager {
  constructor() {}

  /**
   * Lấy tất cả các topic dựa vào project name
   * @param param0 Object chứa projectName, apiKey, limit, page
   * @returns Danh sách các topic và thông tin phân trang
   */
  async getTopicsByProject({
    projectName,
    apiKey,
    limit = 10,
    page = 1,
  }: ITopicQuery) {
    try {
      const skip = (page - 1) * limit;
      const topicCollection = getCollection<ITopic>("topics");

      // Query để lấy topics
      const query: Record<string, any> = { project: projectName };
      if (apiKey) {
        query.apiKey = apiKey;
      }

      // Thực hiện query để lấy dữ liệu và tổng số bản ghi
      const [topics, totalCount] = await Promise.all([
        topicCollection
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        topicCollection.countDocuments(query),
      ]);

      // Tính toán thông tin phân trang
      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: topics,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error: any) {
      logger.error(`Error getting topics: ${error?.message}`);
      throw new Error(`Failed to retrieve topics: ${error?.message}`);
    }
  }

  async getRandomTopicEfficient({ projectName }: IRandomTopicQuery) {
    try {
      const topicCollection = getCollection<ITopic>("topics");

      // Query để lấy topics
      const query: Record<string, any> = { projectName: projectName };

      // Sử dụng pipeline với $sample để lấy ngẫu nhiên 1 document
      const pipeline = [{ $match: query }, { $sample: { size: 1 } }];

      const randomTopic = await topicCollection.aggregate(pipeline).toArray();

      if (randomTopic.length === 0) {
        logger.info(`No topics found for project ${projectName}`);
        return null;
      }

      return randomTopic[0];
    } catch (error: any) {
      logger.error(`Error getting random topic: ${error?.message}`);
      throw new Error(`Failed to retrieve random topic: ${error?.message}`);
    }
  }
}

export default TopicManager;
