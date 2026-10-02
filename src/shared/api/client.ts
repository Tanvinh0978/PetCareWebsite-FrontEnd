import axios from 'axios';
import type { ApiResponse } from '../types/api';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
});

// Lấy thông báo lỗi từ ApiResponse.message của backend.
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Partial<ApiResponse<unknown>> | undefined;
    if (data?.message) return data.message;
    if (error.code === 'ERR_NETWORK') return 'Không kết nối được tới máy chủ. Hãy kiểm tra backend đã chạy chưa.';
  }
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
}
