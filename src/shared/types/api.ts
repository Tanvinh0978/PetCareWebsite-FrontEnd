// Bao bọc mọi response của API (ApiResponse<T> ở backend, JSON camelCase).
export interface ApiResponse<T> {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  result: T | null;
}
