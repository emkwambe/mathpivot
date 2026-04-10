export * from "./database";
export * from "./views";

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  role: import("./database").UserRole;
  fullName: string;
  avatarUrl?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Form state
export interface FormState {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}
