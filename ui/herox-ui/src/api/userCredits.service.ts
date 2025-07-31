import { baseApi, handleFetchErrors } from "./base";
import { IFilterUserCredits, IUserCreditsResponse } from "./userCredits";
import { USER_CREDITS_API } from "./endpoints";

type GetUserCreditsParams = {
  apiKey: string;
  filter?: IFilterUserCredits;
  page?: number;
  limit?: number;
};

export const userCreditsService = {
  async getUserCredits({
    apiKey,
    filter,
    page = 1,
    limit = 10,
  }: GetUserCreditsParams): Promise<IUserCreditsResponse> {
    try {
      // Build query params
      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      // Add filter params if provided
      if (filter?.telegramUserId) {
        queryParams.append("telegramUserId", filter.telegramUserId);
      }
      if (filter?.xUsername) {
        queryParams.append("xUsername", filter.xUsername);
      }

      // Make the request
      const response = await baseApi.get<IUserCreditsResponse>(
        `${USER_CREDITS_API}?${queryParams.toString()}`,
        {
          headers: { "x-api-key": apiKey },
        }
      );

      return response.data;
    } catch (error) {
      return handleFetchErrors(error, "Failed to fetch user credits");
    }
  },
};
