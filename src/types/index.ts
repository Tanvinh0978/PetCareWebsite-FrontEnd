
// Khớp với enum/DTO của backend (JsonStringEnumConverter => enum là chuỗi).
export type ServiceType = 'Grooming' | 'Boarding' | 'Diet' | 'Care';
export type PricingUnit = 'Per_Turn' | 'Per_Day' | 'Item';

export const SERVICE_TYPE_LABEL: Record<ServiceType, string> = {
  Grooming: 'Grooming',
  Boarding: 'Boarding',
  Diet: 'Nutrition',
  Care: 'Care',
};

export const PRICING_UNIT_LABEL: Record<PricingUnit, string> = {
  Per_Turn: 'session',
  Per_Day: 'day',
  Item: 'item',
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
  imageUrl?: string;
  isActive: boolean;
  prices: ServicePrice[];
}

export interface CreateServicePayload {
  name: string;
  description: string;
  serviceType: ServiceType;
  imageUrl?: string;
  prices: ServicePrice[];
}
