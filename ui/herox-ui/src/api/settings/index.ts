// File: settings/index.ts
import { ObjectId } from "mongodb";

// Interface for the bot settings
export interface ISettings {
  _id?: string | ObjectId;
  minimumLinksForTask: number; // Số link thấp nhất để hoàn thành nhiệm vụ (n)
  minimumLinkForAdmin: number; // Số link cần thiết cho admin
  additionalLinks: number; // Số link thêm vào (t)
  selectionMethod: "newest" | "oldest" | "random" | "least-interactions";
  additionalLinkSource: "member" | "admin";
  updatedAt: Date;
  updatedBy: string;
}

// Interface for API response
export interface ISettingsResponse {
  ok: boolean;
  data?: ISettings;
  message?: string;
}

// Interface for update settings request
export interface IUpdateSettingsRequest {
  minimumLinksForTask?: number;
  minimumLinkForAdmin?: number;
  additionalLinks?: number;
  selectionMethod?: "newest" | "oldest" | "random" | "least-interactions";
  additionalLinkSource?: "member" | "admin";
  userId?: string;
}
