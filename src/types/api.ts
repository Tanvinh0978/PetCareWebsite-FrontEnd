export interface ApiResponse<T> {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  result: T | null;
}
