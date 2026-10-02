import { http } from '../../shared/api/client';
import type { ApiResponse } from '../../shared/types/api';
import type { CreateServicePayload, Service } from './types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

const mockServices: Service[] = [
  { id: 'm1', name: 'Tắm & sấy khô', description: 'Tắm sữa tắm dịu nhẹ, sấy khô và chải lông.', serviceType: 'Grooming', isActive: true,
    prices: [{ minWeight: 0, maxWeight: 5, price: 120000, pricingUnit: 'Per_Turn' }, { minWeight: 5, maxWeight: 15, price: 180000, pricingUnit: 'Per_Turn' }] },
  { id: 'm2', name: 'Tỉa lông tạo kiểu', description: 'Cắt tỉa theo giống, vệ sinh tai và cắt móng.', serviceType: 'Grooming', isActive: true,
    prices: [{ minWeight: null, maxWeight: null, price: 250000, pricingUnit: 'Per_Turn' }] },
  { id: 'm3', name: 'Phòng lưu trú tiêu chuẩn', description: 'Phòng riêng có camera, đi dạo hai lần mỗi ngày.', serviceType: 'Boarding', isActive: true,
    prices: [{ minWeight: null, maxWeight: null, price: 200000, pricingUnit: 'Per_Day' }] },
  { id: 'm4', name: 'Thực đơn eat-clean', description: 'Khẩu phần tươi nấu theo cân nặng và tình trạng sức khỏe.', serviceType: 'Diet', isActive: true,
    prices: [{ minWeight: null, maxWeight: null, price: 60000, pricingUnit: 'Item' }] },
  { id: 'm5', name: 'Chăm sóc theo dõi sức khỏe', description: 'Kiểm tra cân nặng, ghi nhận tình trạng và báo cáo cho chủ nuôi.', serviceType: 'Care', isActive: true,
    prices: [{ minWeight: null, maxWeight: null, price: 90000, pricingUnit: 'Per_Day' }] },
];

// Dịch vụ tạo mới trong phiên làm việc (chỉ hiển thị khi USE_MOCK, để thấy ngay trong danh sách).
const createdThisSession: Service[] = [];

export async function getServices(): Promise<Service[]> {
  if (USE_MOCK) return [...mockServices, ...createdThisSession];
  const res = await http.get<ApiResponse<Service[]>>('/services');
  return res.data.result ?? [];
}

// Endpoint thật: POST /api/services -> ApiResponse<Guid>
export async function createService(payload: CreateServicePayload): Promise<string> {
  const res = await http.post<ApiResponse<string>>('/services', payload);
  const id = res.data.result ?? '';
  createdThisSession.push({ ...payload, id, isActive: true });
  return id;
}
