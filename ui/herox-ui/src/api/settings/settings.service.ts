// File: settings.service.ts
import { baseApi } from "../base";
import { SETTINGS_API } from "../endpoints";
import { ISettingsResponse, IUpdateSettingsRequest } from "./index";

export const settingsService = {
  // Fetch settings from the API
  getSettings: async ({
    apiKey,
  }: {
    apiKey: string;
  }): Promise<ISettingsResponse> => {
    try {
      // Set the API key in headers
      baseApi.defaults.headers.common["Authorization"] = `Bearer ${apiKey}`;

      const response = await baseApi.get(SETTINGS_API);
      return response.data;
    } catch (error) {
      console.error("Error fetching settings:", error);
      return {
        ok: false,
        message: `Error fetching settings: ${error}`,
      };
    }
  },

  // Update settings
  updateSettings: async ({
    apiKey,
    settings,
  }: {
    apiKey: string;
    settings: IUpdateSettingsRequest;
  }): Promise<ISettingsResponse> => {
    try {
      // Set the API key in headers
      baseApi.defaults.headers.common["Authorization"] = `Bearer ${apiKey}`;

      const response = await baseApi.put(SETTINGS_API, settings);
      return response.data;
    } catch (error) {
      console.error("Error updating settings:", error);
      return {
        ok: false,
        message: `Error updating settings: ${error}`,
      };
    }
  },
};
