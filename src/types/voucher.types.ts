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

export interface VoucherDTO {
  id: string
  code: string
  discountType: DiscountType | string
  discountValue: number
  startDate: string
  endDate: string
  maxUsage: number | null
  currentUsage: number
  isValid: boolean
  createdAt?: string
  updatedAt?: string | null
}

export interface CreateVoucherDTO {
  code: string
  discountType: DiscountType | string
  discountValue: number
  startDate: string
  endDate: string
  maxUsage?: number | null
}

export interface UpdateVoucherDTO {
  code: string
  discountType: DiscountType | string
  discountValue: number
  startDate: string
  endDate: string
  maxUsage?: number | null
}
