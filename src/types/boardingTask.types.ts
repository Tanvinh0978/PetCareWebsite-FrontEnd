export interface BoardingTaskResponseDTO {
  bookingId: string
  itemId: string
  customerId?: string
  customerName: string
  customerPhone?: string | null
  petId?: string
  petName: string
  petSpecies: number | string
  petWeight?: number | null
  petBreed?: string | null
  petHealthNotes?: string | null
  serviceId?: string
  serviceName?: string
  serviceType?: number | string
  roomId?: string | null
  roomName?: string | null
  roomTypeName?: string | null
  scheduledStartAt: string
  scheduledEndAt?: string | null
  totalStayDays?: number | null
  daysRemaining?: number | null
  totalCareRecords?: number | null
  latestHealthStatus?: string | null
  status: number | string
}

export interface CareRecordResponseDTO {
  id: string
  bookingItemId: string
  staffName: string
  petName: string
  recordDate: string
  healthStatus: string
  note?: string | null
  imageUrl?: string | null
}

export interface CreateCareRecordPayload {
  bookingItemId: string
  healthStatus: string
  note: string
  imageUrl?: string | null
}
