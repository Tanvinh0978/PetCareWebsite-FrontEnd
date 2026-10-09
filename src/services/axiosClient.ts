import axios from 'axios'
import { useAuthStore } from '@/store/useAuthStore'

// Để trống = gọi qua proxy của Vite. Khi deploy đặt VITE_API_URL.
export const baseURL: string = import.meta.env.VITE_API_URL ?? '/api'

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
// TODO: thêm xử lý 401 / refresh token khi backend có API đăng nhập.
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error),
)

export default axiosClient
