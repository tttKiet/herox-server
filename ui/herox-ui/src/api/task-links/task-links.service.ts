// task-links.service.ts
import { baseApi } from "../base";
import { IFilterTaskLinks, ITaskLinksResponse } from "./index";
import { TASK_LINKS_API } from "../endpoints";

export const taskLinksService = {
  getTaskLinks: async ({
    apiKey,
    filter = {},
    page = 1,
    limit = 10,
  }: {
    apiKey: string;
    filter?: IFilterTaskLinks;
    page?: number;
    limit?: number;
  }): Promise<ITaskLinksResponse> => {
    try {
      // Set the API key in headers
      baseApi.defaults.headers.common["Authorization"] = `Bearer ${apiKey}`;

      const response = await baseApi.get(TASK_LINKS_API, {
        params: {
          ...filter,
          page,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching task links:", error);
      return {
        ok: false,
        message: "Failed to fetch task links",
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
    }
  },

  updateTaskLinkStatus: async ({
    apiKey,
    linkId,
    status,
  }: {
    apiKey: string;
    linkId: string;
    status: string;
  }) => {
    try {
      baseApi.defaults.headers.common["Authorization"] = `Bearer ${apiKey}`;
      const response = await baseApi.post(`${TASK_LINKS_API}/update-status`, {
        linkId,
        status,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating task link status:", error);
      return {
        ok: false,
        message: "Failed to update task link status",
      };
    }
  },
};
