// Khớp với enum/DTO của backend (JsonStringEnumConverter => enum là chuỗi).
export type ServiceType = 'Grooming' | 'Boarding' | 'Diet' | 'Care';
export type PricingUnit = 'Per_Turn' | 'Per_Day' | 'Item';

export const SERVICE_TYPE_LABEL: Record<ServiceType, string> = {
  Grooming: 'Spa & tỉa lông',
  Boarding: 'Lưu trú',
  Diet: 'Dinh dưỡng',
  Care: 'Chăm sóc',
};

export const PRICING_UNIT_LABEL: Record<PricingUnit, string> = {
  Per_Turn: 'lượt',
  Per_Day: 'ngày',
  Item: 'món',
};

// Bao bọc mọi response của API (ApiResponse<T> ở backend, JSON camelCase).
export interface ApiResponse<T> {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  result: T | null;
}

export interface ServicePrice {
  minWeight: number | null;
  maxWeight: number | null;
  price: number;
  pricingUnit: PricingUnit;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  serviceType: ServiceType;
  isActive: boolean;
  prices: ServicePrice[];
}

export interface CreateServicePayload {
  name: string;
  description: string;
  serviceType: ServiceType;
  prices: ServicePrice[];
}
