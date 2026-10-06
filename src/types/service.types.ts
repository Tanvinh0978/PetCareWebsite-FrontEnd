// ====== Enums: phải khớp đúng giá trị enum của backend ======
export const ServiceType = {
  Grooming: 'Grooming',
  Boarding: 'Boarding',
  Diet: 'Diet',
  Care: 'Care',
} as const
export type ServiceTypeType = keyof typeof ServiceType

export const PricingUnit = {
  Per_Turn: 'Per_Turn',
  Per_Day: 'Per_Day',
  Item: 'Item',
} as const
export type PricingUnitType = keyof typeof PricingUnit

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  Grooming: 'Grooming',
  Boarding: 'Boarding',
  Diet: 'Diet',
  Care: 'Care',
}

export const PRICING_UNIT_LABELS: Record<string, string> = {
  Per_Turn: 'session',
  Per_Day: 'day',
  Item: 'item',
}

// ====== DTOs ======
export interface ServiceDTO {
  id: string
  name: string
  description?: string
  serviceType: ServiceTypeType | string
  isActive: boolean
}

export interface ServicePriceDTO {
  id?: string
  minWeight: number | null
  maxWeight: number | null
  price: number
  pricingUnit: PricingUnitType | string
}

export interface ServiceDetailDTO extends ServiceDTO {
  prices: ServicePriceDTO[]
}

export interface CreateServicePayload {
  name: string
  description: string
  serviceType: ServiceTypeType | string
  prices: ServicePriceDTO[]
}

export interface UpdateServicePayload extends CreateServicePayload {
  isActive: boolean
}
