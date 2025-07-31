// tg-posts.service.ts
import { baseApi } from "../base";
import { IFilterTgPosts, ITgPostsResponse } from "./index";
import { TG_POSTS_API } from "../endpoints";

export const tgPostsService = {
  getTgPosts: async ({
    apiKey,
    filter = {},
    page = 1,
    limit = 10,
  }: {
    apiKey: string;
    filter?: IFilterTgPosts;
    page?: number;
    limit?: number;
  }): Promise<ITgPostsResponse> => {
    try {
      // Set the API key in headers
      baseApi.defaults.headers.common["Authorization"] = `Bearer ${apiKey}`;
      const response = await baseApi.get(TG_POSTS_API, {
        params: {
          ...filter,
          page,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching Telegram posts:", error);
      return {
        ok: false,
        message: "Failed to fetch Telegram posts",
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

  createTgPost: async ({
    apiKey,
    postData,
  }: {
    apiKey: string;
    postData: {
      postId: string;
      postUrl: string;
      username: string;
      content?: string;
      type: "admin" | "member";
    };
  }) => {
    try {
      baseApi.defaults.headers.common["Authorization"] = `Bearer ${apiKey}`;
      const response = await baseApi.post(TG_POSTS_API, postData);
      return response.data;
    } catch (error) {
      console.error("Error creating Telegram post:", error);
      return {
        ok: false,
        message: "Failed to create Telegram post",
      };
    }
  },

  deleteTgPost: async ({
    apiKey,
    postId,
  }: {
    apiKey: string;
    postId: string;
  }) => {
    try {
      baseApi.defaults.headers.common["Authorization"] = `Bearer ${apiKey}`;
      const response = await baseApi.delete(`${TG_POSTS_API}/${postId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting Telegram post:", error);
      return {
        ok: false,
        message: "Failed to delete Telegram post",
      };
    }
  },
};
