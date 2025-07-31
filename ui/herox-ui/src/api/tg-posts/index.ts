// tg-posts/index.ts
export interface IInteractXTgPost {
  _id?: string;
  postId: string; // X post ID
  postUrl: string; // X post URL
  username: string; // X username that posted
  type: "member" | "admin"; // Type of post: member or admin
  interactionCount: number; // Number of times this post has been interacted with
  requiredInteractionCount?: number | null; // yêu cầu tương tác
  pendingTaskCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// API response interfaces
export interface ITgPostsResponse {
  ok: boolean;
  message: string;
  data: IInteractXTgPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter interface
export interface IFilterTgPosts {
  postId?: string;
  username?: string;
  type?: string;
  taskDate?: string;
}
