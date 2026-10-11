import axiosClient from './axiosClient'
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
    const res: any = await axiosClient.get('/api/customers/profile');
    return res?.result ?? res?.data ?? res;
  },

  updateProfile: async (payload: { fullName: string; phoneNumber: string; address?: string; avatarUrl?: string }) => {
    const res: any = await axiosClient.put('/api/customers/profile', payload);
    return res?.result ?? res?.data ?? res;
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string; confirmNewPassword: string }) => {
    const res: any = await axiosClient.put('/api/customers/change-password', payload);
    return res?.result ?? res?.data ?? res;
  },
}
