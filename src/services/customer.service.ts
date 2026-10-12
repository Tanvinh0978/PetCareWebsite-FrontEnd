import axiosClient from './axiosClient'
import { useAuthStore } from '@/store/useAuthStore'
import type { CustomerDTO, CustomerDetailDTO, CreateCustomerDTO, UpdateCustomerDTO } from '@/types/customer.types'

const get = <T>(url: string, params?: object) =>
  axiosClient.get<IBackendRes<T>, IBackendRes<T>>(url, { params })

export const customerService = {
  fetchWithPagination: (params: { pageNumber?: number; pageSize?: number; searchTerm?: string; isActive?: boolean }) => 
    get<IPagedResult<CustomerDTO>>('/api/customers', params),

  fetchById: (id: string) => get<CustomerDetailDTO>(`/api/customers/${id}`),

  create: (payload: CreateCustomerDTO) =>
    axiosClient.post<IBackendRes<string>, IBackendRes<string>>('/api/customers', payload),

  update: (id: string, payload: UpdateCustomerDTO) =>
    axiosClient.put<IBackendRes<string>, IBackendRes<string>>(`/api/customers/${id}`, payload),

  remove: (id: string) =>
    axiosClient.delete<IBackendRes<string>, IBackendRes<string>>(`/api/customers/${id}`),

  toggleStatus: (id: string) =>
    axiosClient.patch<IBackendRes<string>, IBackendRes<string>>(`/api/customers/${id}/toggle-status`),

  getProfile: async () => {
    // 1. Try /api/Customers/profile and /api/customers/profile
    try {
      const res: any = await axiosClient.get('/api/Customers/profile');
      const data = res?.result ?? res?.data ?? res;
      if (data && (data.id || data.fullName || data.email)) return data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        try {
          const res: any = await axiosClient.get('/api/customers/profile');
          const data = res?.result ?? res?.data ?? res;
          if (data && (data.id || data.fullName || data.email)) return data;
        } catch (subErr) {
          console.warn('[customerService] Both profile endpoints 404:', subErr);
        }
      } else {
        console.warn('[customerService] getProfile error:', err?.response?.data?.message || err?.message);
      }
    }

    // 2. Fallback: try by stored customer ID
    const customerId = localStorage.getItem('petcare.customerId') || useAuthStore.getState().user?.id;
    if (customerId) {
      try {
        const res: any = await axiosClient.get(`/api/Customers/${customerId}`);
        const data = res?.result ?? res?.data ?? res;
        if (data && (data.id || data.fullName || data.email)) return data;
      } catch {
        try {
          const res: any = await axiosClient.get(`/api/customers/${customerId}`);
          const data = res?.result ?? res?.data ?? res;
          if (data && (data.id || data.fullName || data.email)) return data;
        } catch {}
      }
    }

    // 3. Fallback: current logged in user from auth store
    const user = useAuthStore.getState().user;
    if (user) {
      return {
        id: user.id,
        fullName: user.name || '',
        email: user.email || user.login || '',
        phoneNumber: '',
        address: '',
        avatarUrl: user.avatarUrl || '',
      };
    }

    return null;
  },

  updateProfile: async (payload: { fullName: string; phoneNumber: string; address?: string; avatarUrl?: string }) => {
    try {
      const res: any = await axiosClient.put('/api/Customers/profile', payload);
      return res?.result ?? res?.data ?? res;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const res: any = await axiosClient.put('/api/customers/profile', payload);
        return res?.result ?? res?.data ?? res;
      }
      throw err;
    }
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string; confirmNewPassword: string }) => {
    try {
      const res: any = await axiosClient.put('/api/Customers/change-password', payload);
      return res?.result ?? res?.data ?? res;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const res: any = await axiosClient.put('/api/customers/change-password', payload);
        return res?.result ?? res?.data ?? res;
      }
      throw err;
    }
  },
}
