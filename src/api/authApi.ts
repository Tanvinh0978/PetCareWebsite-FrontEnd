import { http } from './client';
import type { ApiResponse } from '@/types/api';

export const registerCustomer = async (data: any) => {
  const response = await http.post<ApiResponse<string>>('/auth/register', data);
  return response.data;
};

export const loginCustomer = async (data: any) => {
  const response = await http.post<ApiResponse<any>>('/auth/login', data);
  return response.data;
};
export const verifyOtp = async (data: any) => { const response = await http.post<ApiResponse<any>>('/auth/verify-otp', data); return response.data; };
export const resendOtp = async (data: any) => { const response = await http.post<ApiResponse<any>>('/auth/resend-otp', data); return response.data; };
