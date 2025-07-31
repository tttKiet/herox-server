// task-links/index.ts
export interface IInteractXTaskLink {
  _id?: string;
  taskId: string;
  postId: string;
  postUrl: string;
  type: "admin" | "member";
  interactionCount: number;
  requiredInteractions: number | null;
  status: "pending" | "completed";
  createdAt?: Date;
  updatedAt?: Date;
}

// API response interfaces
export interface ITaskLinksResponse {
  ok: boolean;
  message: string;
  data: IInteractXTaskLink[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter interface
export interface IFilterTaskLinks {
  taskId?: string;
  postId?: string;
  type?: string;
  status?: string;
  taskDate?: string; // Add taskDate parameter for backward compatibility
  fromDate?: string;
  toDate?: string;
}
