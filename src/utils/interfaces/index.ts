import { ObjectId } from "mongodb";

export interface IPostReg {
  tagName: string;
  projectName: string;
}

export interface IPost {
  _id?: ObjectId;
  memberId: string | ObjectId;
  status: "pending" | "error" | "success";
  message?: string;
  content: string;
  localPath?: string | null;
  imageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChat {
  _id?: ObjectId;
  memberId: string | ObjectId;
  status: "pending" | "error" | "success";
  userMessage: string;
  aiContent?: string;
  promptId?: string;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserInteractPost {
  _id?: ObjectId;
  action?: "commented" | "liked" | null | undefined;
  authorUsername: string;
  targetUsername: string;
  postId?: string;
  commentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdmin {
  _id?: ObjectId;
  fullName: string;
  type: "admin" | "member";
  permisson?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayment {
  _id?: ObjectId;
  memberId: string | ObjectId;
  postId: string | ObjectId;
  status: "pending" | "error" | "success";
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPrompt {
  _id?: ObjectId;
  name: string;
  memberId: string | ObjectId;
  context: string | ObjectId;
  type: "PROMPT_CMT" | "PROMPT_POST" | "PROMPT_IMG";
  status: "production" | "test";
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITopic {
  _id?: ObjectId;
  topicName: string;
  projectName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProject {
  _id?: ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
