import apiClient from "../axios-config";
import { TOPIC_API, TOPIC_GENERATOR_API } from "../endpoints";

export interface ITopic {
  _id: string;
  topicName: string;
  projectName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IFilterTopic {
  topicName?: string;
  projectName?: string;
}

export interface IPaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ITopicResponse {
  ok: boolean;
  message: string;
  data: ITopic[];
  pagination?: IPaginationResponse;
}

export interface IGenerateTopicRequest {
  apiKey: string;
  projectName: string;
  count: number;
}

class TopicService {
  async getTopics({
    apiKey,
    filter,
    page = 1,
    limit = 10,
  }: {
    apiKey?: string;
    filter?: IFilterTopic;
    page?: number;
    limit?: number;
  }): Promise<ITopicResponse> {
    const params: Record<string, string | number> = apiKey ? { apiKey } : {};
    if (filter) {
      if (filter.topicName) params.topicName = filter.topicName;
      if (filter.projectName) params.projectName = filter.projectName;
    }
    params.page = page;
    params.limit = limit;

    const res = await apiClient.get(TOPIC_API, { params });
    return res.data;
  }

  async createTopics({
    apiKey,
    topics,
  }: {
    apiKey: string;
    topics: { topicName: string; projectName: string }[];
  }) {
    const body = {
      apiKey,
      topics,
    };
    const res = await apiClient.post(TOPIC_API, body);
    return res.data;
  }

  async deleteTopics({
    apiKey,
    topicIds,
  }: {
    apiKey: string;
    topicIds: string[];
  }) {
    const res = await apiClient.delete(TOPIC_API, {
      data: {
        apiKey,
        topicIds,
      },
    });
    return res.data;
  }

  async generateTopics({ apiKey, projectName, count }: IGenerateTopicRequest) {
    const body = {
      apiKey,
      projectName,
      quantities: count,
    };
    // Use apiClient with extended timeout for this long-running operation
    const res = await apiClient.post(TOPIC_GENERATOR_API, body, {
      timeout: 180000, // 3 minutes in milliseconds
    });
    return res.data;
  }
}

export const topicService = new TopicService();
