import apiClient from "../axios-config";
import { INTERACT_POSTS_API } from "../endpoints";

export interface IInteractPost {
  _id: string;
  authorUsername: string;
  action: string | null;
  targetUsername: string;
  postId: string;
  commentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IFilterInteractPost {
  search?: string; // Search by postId, commentId or URL
  authorUsername?: string; // Filter by author
  targetUsername?: string; // Filter by target
  authorUsernames?: string; // Filter by list of authors (newline separated)
  targetUsernames?: string; // Filter by list of targets (newline separated)
  fromDate?: string; // Filter posts from this date/time
}

export interface IPaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IInteractPostResponse {
  ok: boolean;
  message: string;
  data: IInteractPost[];
  pagination?: IPaginationResponse;
}

class InteractPostService {
  async getInteractPosts({
    apiKey,
    filter,
    page = 1,
    limit = 10,
  }: {
    apiKey?: string;
    filter?: IFilterInteractPost;
    page?: number;
    limit?: number;
  }): Promise<IInteractPostResponse> {
    // Build query parameters
    const params: Record<string, string | number> = apiKey ? { apiKey } : {};

    // Add filter parameters if provided
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params[key] = value.toString();
        }
      });
    }

    // Add pagination parameters
    params.page = page;
    params.limit = limit;

    const response = await apiClient.get(INTERACT_POSTS_API, { params });
    return response.data;
  }
}

export const interactPostService = new InteractPostService();
