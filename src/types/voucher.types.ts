// DiscountType khớp với backend enum (JsonStringEnumConverter đang bật)
export enum DiscountType {
  Percentage = 'Percentage',
  Fixed_Amount = 'Fixed_Amount',
}

export const DISCOUNT_TYPE_LABEL: Record<DiscountType, string> = {
  [DiscountType.Percentage]: 'Percentage (%)',
  [DiscountType.Fixed_Amount]: 'Fixed Amount (VND)',
}

export const DISCOUNT_TYPE_SHORT: Record<DiscountType, string> = {
  [DiscountType.Percentage]: '%',
  [DiscountType.Fixed_Amount]: '₫',
}

export function isDiscountTypeValid(val: unknown): val is DiscountType {
  return val === DiscountType.Percentage || val === DiscountType.Fixed_Amount
}

// DTO từ GET /api/Vouchers (list) & GET /api/Vouchers/{id}
export interface VoucherDTO {
  id: string
  code: string
  discountType: DiscountType | string
  discountValue: number
  startDate: string   // ISO 8601
  endDate: string     // ISO 8601
  maxUsage: number | null
  currentUsage: number
  isValid: boolean
  createdAt?: string
  updatedAt?: string | null
}

// Payload để POST /api/Vouchers
export interface CreateVoucherDTO {
  code: string
  discountType: DiscountType | string
  discountValue: number
  startDate: string
  endDate: string
  maxUsage?: number | null
}

// Payload để PUT /api/Vouchers/{id}
export interface UpdateVoucherDTO {
  code: string
  discountType: DiscountType | string
  discountValue: number
  startDate: string
  endDate: string
  maxUsage?: number | null
}
