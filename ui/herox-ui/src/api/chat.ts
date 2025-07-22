import apiClient from "./axios-config";

// Add endpoint to endpoints.ts
export const CHAT_API = "/api/v1/ai/chats";

export interface IAdmin {
  _id: string;
  fullName: string;
  type: "admin" | "member";
  permisson?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IChat {
  _id: string;
  memberId: string;
  status: "pending" | "error" | "success";
  userMessage: string;
  aiContent?: string;
  promptId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IChatWithAdmin extends IChat {
  admin: IAdmin | null;
}

export interface IFilterChat {
  memberId?: string;
  userMessage?: string;
  status?: "pending" | "error" | "success";
  startDate?: string;
  endDate?: string;
}

export interface IPaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IChatResponse {
  ok: boolean;
  message: string;
  data: IChatWithAdmin[];
  pagination?: IPaginationResponse;
}

class ChatService {
  async getChats({
    apiKey,
    filter,
    page = 1,
    limit = 10,
  }: {
    apiKey?: string;
    filter?: Partial<IFilterChat>;
    page?: number;
    limit?: number;
  }): Promise<IChatResponse> {
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

    const response = await apiClient.get(CHAT_API, { params });
    return response.data;
  }
}

export const chatService = new ChatService();
