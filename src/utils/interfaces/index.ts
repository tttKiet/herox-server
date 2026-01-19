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

export interface ITelegramUser {
  _id?: ObjectId;
  userId: string; // Telegram user ID
  username: string; // Telegram username
  chatId: string; // Telegram chat ID
  registeredUsernames: string[]; // List of X usernames registered by this user
  detectedLinks?: string[]; // Detected X/Twitter links
  detectedAt?: Date; // When links were detected
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

// bot telegram
export interface IXPost {
  _id?: ObjectId;
  postId: string; // X post ID
  postUrl: string; // X post URL
  username: string; // X username that posted
  type?: "member" | "admin"; // Type of post: member or admin
  interactionCount: number; // Number of times this post has been interacted with
  telegramUserId: string | null; // Telegram user ID who created this post
  requiredInteractionCount?: number | null; // yêu cầu tương tác
  pendingTaskCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInteraction {
  _id?: ObjectId;
  telegramUserId: string; // Reference to Telegram user
  xUsername: string; // X username making the interaction
  targetPostId: string; // Reference to target X post
  targetPostUrl: string; // URL of the target post
  status: "todo" | "done" | "failed"; // Status of interaction
  commentId?: string; // If the interaction was a comment, the comment ID
  interactionType: "comment" | "like" | "retweet"; // Type of interaction
  createdAt: Date;
  updatedAt: Date;
}

export interface IInteractXSettings {
  _id?: ObjectId;
  minimumLinksForTask: number; // Số link thấp nhất để hoàn thành nhiệm vụ (n)
  minimumLinkForAdmin: number; // Số link cần thiết cho admin
  additionalLinks: number; // Số link thêm vào (t)
  selectionMethod: "newest" | "oldest" | "random" | "least-interactions"; // Cách lấy bài đăng: mới nhất, cũ nhất, ngẫu nhiên
  additionalLinkSource: "member" | "admin"; // Nguồn link bổ sung: từ thành viên hoặc admin
  updatedAt: Date;
  updatedBy: string; // ID của admin đã cập nhật cấu hình
}

/**
 * Quản lý nhiệm vụ tương tác được giao cho người dùng
 */
export interface ITask {
  _id?: ObjectId;
  telegramUserId: string; // ID người dùng Telegram được giao nhiệm vụ
  xUsername: string; // Tên người dùng X sẽ thực hiện nhiệm vụ
  taskNumber: number; // Số thứ tự nhiệm vụ (để phân biệt các nhiệm vụ khác nhau)
  minimumLinksForTask: number; // Số link tối thiểu cần hoàn thành (n)
  totalLinks: number; // Tổng số link được giao (n+t)
  completedLinks: number; // Số link đã hoàn thành
  status: "todo" | "done"; // Trạng thái nhiệm vụ
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Quản lý các link thuộc về nhiệm vụ nào
 */
export interface ITaskLink {
  _id?: ObjectId;
  taskId: ObjectId; // ID của nhiệm vụ mà link này thuộc về
  postId: string; // ID của bài đăng X
  postUrl: string; // URL của bài đăng
  tgPostId?: ObjectId; // ID của document trong interactXTgPosts
  type: "member" | "admin"; // Loại link: thành viên hoặc admin
  status: "pending" | "completed" | "canceled"; // Trạng thái: đang chờ, đã hoàn thành, hoặc đã hủy
  createdAt: Date;
  updatedAt: Date;
  canceledAt?: Date; // Thời gian hủy link (nếu có)
}

/**
 * Quản lý credits của người dùng để đăng bài
 */
export interface IUserCredit {
  _id?: ObjectId;
  telegramUserId: string; // ID người dùng Telegram
  xUsername: string; // Tên người dùng X
  availableCredits: number; // Số credits có sẵn để sử dụng
  totalEarnedCredits: number; // Tổng số credits đã kiếm được
  totalUsedCredits: number; // Tổng số credits đã sử dụng
  lastTaskId?: ObjectId; // ID của task gần nhất đã hoàn thành
  lastMinimumLinksForTask: number; // Số minimumLinksForTask gần nhất, dùng cho maxInteractionCount
  createdAt: Date;
  updatedAt: Date;
}

export interface IGetTgPostsQuery {
  postId?: string;
  username?: string;
  type?: string;
  taskDate?: string;
  page?: string;
  limit?: string;
}

export interface IGetTaskLinksQuery {
  taskId?: string;
  postId?: string;
  type?: string;
  status?: string;
  taskDate?: string;
  fromDate?: string;
  toDate?: string;
  page?: string;
  limit?: string;
}

// InteractX API request interfaces
export interface IInteractXAuthor {
  rest_id: string;
  name: string;
  screen_name: string;
}

export interface IInteractXApiRequest {
  likes: string; // ID của bài đăng X
  text: string; // Hành động tương tác
  retweets: string; // Văn bản retweet (nếu hành động là retweet)
  quotes: string; // ID người dùng Telegram thực hiện hành động
  replies: string; // ID người dùng Telegram thực hiện hành động (nếu có)
}

// api key

export interface IApiKeyTwitter {
  _id?: string | ObjectId;
  apiKey: string;
  name: string;
  description?: string;
  status: "active" | "inactive" | "rate_limited" | "expired" | "error";
  lastUsed?: Date;
  usageThisMonth: number;
  totalUsageCount: number;
  monthlyUsage: Record<string, number>;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: Date;
  };
}

export interface IBodyV98 {
  model: string;
  systemMessage: string;
  userMessage: string;
}
