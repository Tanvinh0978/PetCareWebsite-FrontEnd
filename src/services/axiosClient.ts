import axios from 'axios'
import { useAuthStore } from '@/store/useAuthStore'

// Để trống = gọi qua proxy của Vite. Khi deploy đặt VITE_API_URL.
export const baseURL: string = import.meta.env.VITE_API_URL ?? ''

const axiosClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Trả thẳng body (IBackendRes<T>) thay vì AxiosResponse.
// Xử lý 401 (hết hạn token): tự động dọn sạch token cũ và điều hướng về trang đăng nhập
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error?.response?.status === 401) {
      const isLoginPage = window.location.pathname.includes('/login');
      if (!isLoginPage) {
        useAuthStore.getState().logout();
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  },
)

export default axiosClient
