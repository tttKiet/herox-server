import { ObjectId } from "mongodb";

export interface IPostImgReg {
  postContent: string;
  isCreateImg: boolean;
  folderName: string;
  accountVerified: string;
}

export interface IPost {
  _id?: ObjectId;
  status: "pending" | "error" | "success";
  content: string;
  localPath?: string | null;
  imageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserInteractPost {
  _id?: ObjectId;
  action?: "commented" | "liked" | null | undefined;
  authorUsername: string;
  targetUsername: string;
  postId?: string;
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
