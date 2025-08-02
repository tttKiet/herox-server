import apiClient from "../axios-config";
import { API_KEYS_API } from "../endpoints";

export interface IApiKey {
  _id: string;
  apiKey: string;
  name: string;
  description?: string;
  status: "active" | "inactive" | "rate_limited" | "expired" | "error";
  lastUsed?: string;
  usageThisMonth: number;
  totalUsageCount: number;
  monthlyUsage: Record<string, number>;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: string;
  };
}

export interface IFilterApiKey {
  search?: string;
  status?: "active" | "inactive" | "rate_limited" | "expired" | "error";
}

export interface IPaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IApiKeyResponse {
  ok: boolean;
  message: string;
  data: {
    keys: IApiKey[];
    pagination: IPaginationResponse;
  };
}

export interface IApiKeyCreateResponse {
  ok: boolean;
  message: string;
  data: {
    successful: Array<{ id: string; name: string }>;
    failed: Array<{ line: string; error: string }>;
  };
}

export interface IApiKeyDeleteResponse {
  ok: boolean;
  message: string;
  data: {
    deleted: string[];
    failed: Array<{ id: string; error: string }>;
  };
}

class ApiKeyService {
  async getApiKeys({
    filter,
    page = 1,
    limit = 10,
  }: {
    filter?: IFilterApiKey;
    page?: number;
    limit?: number;
  }): Promise<IApiKeyResponse> {
    // Build query parameters
    const params: Record<string, string | number> = {};

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

    const response = await apiClient.get(API_KEYS_API, { params });
    return response.data;
  }

  async createApiKeys(apiKeys: string): Promise<IApiKeyCreateResponse> {
    const response = await apiClient.post(API_KEYS_API, { apiKeys });
    return response.data;
  }

  async createApiKeysArray(
    apiKeys: Array<{ apiKey: string; name?: string }>
  ): Promise<IApiKeyCreateResponse> {
    const response = await apiClient.post(API_KEYS_API, { apiKeys });
    return response.data;
  }

  async deleteApiKeys(ids: string[]): Promise<IApiKeyDeleteResponse> {
    const response = await apiClient.delete(API_KEYS_API, { data: { ids } });
    return response.data;
  }
}

export const apiKeyService = new ApiKeyService();
