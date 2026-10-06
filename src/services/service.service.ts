import axiosClient from './axiosClient'
import type {
  CreateServicePayload, ServiceDTO, ServiceDetailDTO, UpdateServicePayload,
} from '@/types/service.types'

const get = <T>(url: string, params?: object) =>
  axiosClient.get<IBackendRes<T>, IBackendRes<T>>(url, { params })

// Lấy mọi trang của một endpoint danh sách (backend giới hạn 100 mục mỗi trang).
const fetchAllPages = async (url: string): Promise<ServiceDTO[]> => {
  const all: ServiceDTO[] = []
  for (let page = 1; ; page++) {
    const res = await get<IPagedResult<ServiceDTO>>(url, { pageNumber: page, pageSize: 100 })
    all.push(...res.result.items)
    if (!res.result.hasNextPage) return all
  }
}

export const serviceService = {
  /** GET /api/services: chỉ dịch vụ đang hoạt động (guest, customer). */
  fetchActive: () => fetchAllPages('/api/services'),

  /**
   * GET /api/services/admin: mọi dịch vụ, gồm cả đã ngừng hoạt động.
   * Lọc và phân trang làm ở frontend, vì GET /api/services/admin/search
   * của backend đang trả 500 khi bộ lọc để trống. Khi backend sửa xong,
   * có thể chuyển sang gọi admin/search.
   */
  fetchAllForAdmin: () => fetchAllPages('/api/services/admin'),

  fetchById: (id: string) => get<ServiceDetailDTO>(`/api/services/${id}`),

  create: (payload: CreateServicePayload) =>
    axiosClient.post<IBackendRes<string>, IBackendRes<string>>('/api/services', payload),

  update: (id: string, payload: UpdateServicePayload) =>
    axiosClient.put<IBackendRes<string>, IBackendRes<string>>(`/api/services/${id}`, payload),

  /** Xóa mềm: backend đặt isActive = false. */
  remove: (id: string) =>
    axiosClient.delete<IBackendRes<string>, IBackendRes<string>>(`/api/services/${id}`),
}
