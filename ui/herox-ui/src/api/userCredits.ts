// userCredits.ts
export interface IInteractXUserCredit {
  _id?: string;
  telegramUserId: string;
  xUsername: string;
  availableCredits: number;
  totalEarnedCredits: number;
  totalUsedCredits: number;
  lastTaskId?: string;
  lastMinimumLinksForTask?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// API response interfaces
export interface IUserCreditsResponse {
  ok: boolean;
  message: string;
  data: IInteractXUserCredit[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter interface
export interface IFilterUserCredits {
  telegramUserId?: string;
  xUsername?: string;
}
