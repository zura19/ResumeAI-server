export interface ApiResponse<T> {
  statusCode?: number;
  success?: boolean;
  message?: string;
  errors?: any;
  data: T | T[] | null;
  metadata?: {
    total?: number;
    page?: number;
    size?: number;
    totalPages?: number;
    timestamp: number;
    requestId: string;
    version: string;
  };
}

export interface ApiResponseData<T> {
  message: string;
  data: T | null;
}
