export interface ReviewListItem {
  id: string
  serviceId: string
  serviceName: string
  customerId: string
  customerName: string
  customerAvatarUrl?: string | null
  rating: number
  comment?: string | null
  createdAt: string
  updatedAt?: string | null
}

export interface ReviewDetail {
  id: string
  bookingItemId: string
  serviceId: string
  serviceName: string
  customerId: string
  customerName: string
  customerEmail: string
  rating: number
  comment?: string | null
  createdAt: string
}

export interface GetReviewsParams {
  serviceId?: string
  rating?: number
  pageNumber?: number
  pageSize?: number
}

export interface CreateReviewPayload {
  bookingItemId: string
  rating: number
  comment?: string | null
}

export interface UpdateReviewPayload {
  rating: number
  comment?: string | null
}

export interface ReviewStats {
  total: number
  average: number
  stars: Record<number, number>
}
