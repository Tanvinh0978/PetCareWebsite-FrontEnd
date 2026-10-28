// Khớp với enum/DTO của backend (JsonStringEnumConverter => enum là chuỗi).
export type ServiceType = 'Grooming' | 'Boarding' | 'Diet' | 'Care';
export type PricingUnit = 'Per_Turn' | 'Per_Day' | 'Item';

export const SERVICE_TYPE_LABEL: Record<ServiceType, string> = {
  Grooming: 'Grooming',
  Boarding: 'Boarding',
  Diet: 'Diet',
  Care: 'Care',
};

export const SERVICE_TYPE_BADGE_CONFIG: Record<
  ServiceType,
  { label: string; bg: string; color: string; border: string }
> = {
  Grooming: {
    label: 'Grooming & Spa',
    bg: '#faf5ff',
    color: '#7e22ce',
    border: '#e9d5ff',
  },
  Boarding: {
    label: 'Hotel Boarding',
    bg: '#fffbeb',
    color: '#b45309',
    border: '#fde68a',
  },
  Diet: {
    label: 'Tailored Diet',
    bg: '#fff7ed',
    color: '#c2410c',
    border: '#ffedd5',
  },
  Care: {
    label: 'Wellness & Care',
    bg: '#f0fdfa',
    color: '#0f766e',
    border: '#ccfbf1',
  },
};

export const PRICING_UNIT_LABEL: Record<PricingUnit, string> = {
  Per_Turn: 'session',
  Per_Day: 'day',
  Item: 'item',
};

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Dòng trong danh sách (backend không trả bảng giá ở danh sách).
export interface ServiceListItem {
  id: string;
  name: string;
  description?: string;
  serviceType: ServiceType;
  imageUrl?: string;
  isActive: boolean;
  roomTypeId?: string;
  roomTypeName?: string;
}

export interface ServicePrice {
  minWeight: number | null;
  maxWeight: number | null;
  price: number;
  pricingUnit: PricingUnit;
}

export interface ServiceDetail extends ServiceListItem {
  prices: (ServicePrice & { id: string })[];
}

export interface CreateServicePayload {
  name: string;
  description: string;
  serviceType: ServiceType;
  imageUrl?: string;
  roomTypeId?: string;
  prices: ServicePrice[];
}

export interface UpdateServicePayload extends CreateServicePayload {
  isActive: boolean;
}
