import { http } from '../../shared/api/client';
import type { ApiResponse } from '../../shared/types/api';
import type {
  CreateServicePayload, PagedResult, ServiceDetail, ServiceListItem, ServiceType, UpdateServicePayload,
} from './types';

export interface ServiceFilter {
  keyword?: string;
  serviceType?: ServiceType;
  isActive?: boolean;
  pageNumber: number;
  pageSize: number;
}

// GET /api/services/admin/search (gồm cả dịch vụ đã ngừng hoạt động)
export async function searchServices(filter: ServiceFilter): Promise<PagedResult<ServiceListItem>> {
  const res = await http.get<ApiResponse<PagedResult<ServiceListItem>>>('/services/admin/search', { params: filter });
  return res.data.result!;
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
