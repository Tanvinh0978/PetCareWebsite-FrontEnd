
import { http } from './client';
import type { ApiResponse, CreateServicePayload, Service } from '../types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

const mockServices: Service[] = [
  { id: 'm1', name: 'Bath & Blow-Dry', description: 'Gentle shampoo bath, blow-dry, and brushing.', serviceType: 'Grooming', isActive: true,
    prices: [{ minWeight: 0, maxWeight: 5, price: 120000, pricingUnit: 'Per_Turn' }, { minWeight: 5, maxWeight: 15, price: 180000, pricingUnit: 'Per_Turn' }] },
  { id: 'm2', name: 'Breed Styling', description: 'Breed-specific haircut, ear cleaning, and nail trimming.', serviceType: 'Grooming', isActive: true,
    prices: [{ minWeight: null, maxWeight: null, price: 250000, pricingUnit: 'Per_Turn' }] },
  { id: 'm3', name: 'Standard Boarding Room', description: 'Private room with camera monitoring and two daily walks.', serviceType: 'Boarding', isActive: true,
    prices: [{ minWeight: null, maxWeight: null, price: 200000, pricingUnit: 'Per_Day' }] },
  { id: 'm4', name: 'Fresh Meal Plan', description: 'Fresh meals tailored to your pet’s weight and health needs.', serviceType: 'Diet', isActive: true,
    prices: [{ minWeight: null, maxWeight: null, price: 60000, pricingUnit: 'Item' }] },
  { id: 'm5', name: 'Wellness Check', description: 'Weight checks, health tracking, and updates for pet owners.', serviceType: 'Care', isActive: true,
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
