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
  if (token) {
    if (config.headers && typeof (config.headers as any).set === 'function') {
      ;(config.headers as any).set('Authorization', `Bearer ${token}`)
    } else {
      config.headers = config.headers || {}
      config.headers['Authorization'] = `Bearer ${token}`
    }
  }
  return config
})

// Trả thẳng body (IBackendRes<T>) thay vì AxiosResponse.
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error?.response?.status === 401) {
      console.warn('[axiosClient] 401 Unauthorized for URL:', error?.config?.url);
      const url = String(error?.config?.url || '');
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/staff/login') || url.includes('/auth/register');
      
      // If a protected API call got 401, check if user session expired
      if (!isAuthEndpoint && typeof window !== 'undefined') {
        const token = useAuthStore.getState().accessToken;
        // If there was a token but server rejected with 401, session has expired
        if (token && !window.location.pathname.includes('/login')) {
          console.warn('[axiosClient] Session expired. Redirecting to login.');
          useAuthStore.getState().logout();
          try {
            localStorage.removeItem('petcare.role');
            localStorage.removeItem('petcare.customerId');
          } catch {}
          window.location.href = '/login?expired=1';
        }
      }
    }
    return Promise.reject(error);
  },
)

export default axiosClient
