// tasks.service.ts
import { baseApi, handleFetchErrors } from "./base";
import { IFilterTasks, ITasksResponse } from "./tasks";
import { TASKS_API } from "./endpoints";

export const tasksService = {
  getTasks: async ({
    apiKey,
    filter = {},
    page = 1,
    limit = 10,
  }: {
    apiKey: string;
    filter?: IFilterTasks;
    page?: number;
    limit?: number;
  }): Promise<ITasksResponse> => {
    try {
      // Set the API key in headers
      baseApi.defaults.headers.common["Authorization"] = `Bearer ${apiKey}`;
      const response = await baseApi.get(TASKS_API, {
        params: {
          ...filter,
          page,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return {
        ok: false,
        message: "Failed to fetch tasks",
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

  updateTaskStatus: async ({
    apiKey,
    taskId,
    status,
  }: {
    apiKey: string;
    taskId: string;
    status: string;
  }) => {
    try {
      // Set the API key in headers
      baseApi.defaults.headers.common["Authorization"] = `Bearer ${apiKey}`;
      const response = await baseApi.patch(`${TASKS_API}/${taskId}`, {
        status,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating task status:", error);
      return {
        ok: false,
        message: "Failed to update task status",
      };
    }
  },
};
