export interface ApiResponse<T> {
  code?: number;
  status?: number;
  message: string;
  data: T;
  timestamp?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNo: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export type PaginatedResponse<T> = PageResponse<T>;
