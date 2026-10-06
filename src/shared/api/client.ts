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
    if (error.code === 'ERR_NETWORK') return 'Cannot reach the server. Check that the backend is running.';
    if (error.response) return 'Request failed (' + error.response.status + '): ' + (error.config?.method ?? '').toUpperCase() + ' ' + error.config?.baseURL + (error.config?.url ?? '');
  }
  return 'Something went wrong. Please try again.';
}
