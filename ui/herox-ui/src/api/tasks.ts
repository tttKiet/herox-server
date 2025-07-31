// tasks.ts
export interface IInteractXTask {
  _id?: string;
  telegramUserId: string;
  xUsername: string;
  taskNumber: number;
  minimumLinksForTask: number;
  totalLinks: number;
  completedLinks: number;
  status: "pending" | "in_progress" | "done" | "failed";
  createdAt?: Date;
  updatedAt?: Date;
}

// API response interfaces
export interface ITasksResponse {
  ok: boolean;
  message: string;
  data: IInteractXTask[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter interface
export interface IFilterTasks {
  telegramUserId?: string;
  xUsername?: string;
  status?: string;
  taskNumber?: number;
  taskDate?: string;
}
