import { http } from './client';
import type { ApiResponse } from '@/types/api';
import type {
  CreateServicePayload, PagedResult, ServiceDetail, ServiceListItem, ServiceType, UpdateServicePayload,
} from '@/types/service';

export interface ServiceFilter {
  keyword?: string;
  serviceType?: ServiceType;
  isActive?: boolean;
  pageNumber: number;
  pageSize: number;
}

// Lấy mọi trang của một endpoint danh sách (backend giới hạn 100 mục mỗi trang).
async function fetchAll(path: string): Promise<ServiceListItem[]> {
  const items: ServiceListItem[] = [];
  for (let page = 1; ; page++) {
    const res = await http.get<ApiResponse<PagedResult<ServiceListItem>>>(path, { params: { pageNumber: page, pageSize: 100 } });
    const data = res.data.result!;
    items.push(...data.items);
    if (!data.hasNextPage) break;
  }
  return items;
}

// Khách: GET /api/services (chỉ dịch vụ đang hoạt động).
export const listActiveServices = () => fetchAll('/services');

// Admin: GET /api/services/admin rồi lọc và phân trang ngay trên trình duyệt.
// Lý do: endpoint /admin/search ở backend hiện trả 500 khi để trống bộ lọc, và frontend không sửa được backend.
// Khi backend sửa xong, đổi hàm này về gọi GET /services/admin/search với params: filter.
export async function searchServices(filter: ServiceFilter): Promise<PagedResult<ServiceListItem>> {
  const all = await fetchAll('/services/admin');
  const kw = filter.keyword?.trim().toLowerCase();
  const filtered = all.filter((s) =>
    (filter.isActive === undefined || s.isActive === filter.isActive) &&
    (!filter.serviceType || s.serviceType === filter.serviceType) &&
    (!kw || s.name.toLowerCase().includes(kw) || (s.description ?? '').toLowerCase().includes(kw)));
  const totalPages = Math.max(1, Math.ceil(filtered.length / filter.pageSize));
  const start = (filter.pageNumber - 1) * filter.pageSize;
  return {
    items: filtered.slice(start, start + filter.pageSize),
    totalCount: filtered.length,
    pageNumber: filter.pageNumber,
    pageSize: filter.pageSize,
    totalPages,
    hasPreviousPage: filter.pageNumber > 1,
    hasNextPage: filter.pageNumber < totalPages,
  };
}

export async function getServiceById(id: string): Promise<ServiceDetail> {
  const res = await http.get<ApiResponse<ServiceDetail>>('/services/' + id);
  return res.data.result!;
}

export async function createService(payload: CreateServicePayload): Promise<string> {
  const res = await http.post<ApiResponse<string>>('/services', payload);
  return res.data.result ?? '';
}

// PUT thay toàn bộ bảng giá bằng danh sách gửi lên.
export async function updateService(id: string, payload: UpdateServicePayload): Promise<void> {
  await http.put<ApiResponse<string>>('/services/' + id, payload);
}

// DELETE là xóa mềm: backend đặt isActive = false.
export async function deleteService(id: string): Promise<void> {
  await http.delete<ApiResponse<string>>('/services/' + id);
}
