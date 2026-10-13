import axiosClient from './axiosClient'
import type { CareRecordResponseDTO, CreateCareRecordPayload } from '@/types/boardingTask.types'

function unwrap(value: any): any {
  return value?.result ?? value?.data?.result ?? value?.data ?? value
}

export const careRecordService = {
  getByBookingItem: async (bookingItemId: string): Promise<CareRecordResponseDTO[]> => {
    const raw: any = await axiosClient.get(`/api/carerecords/booking-item/${bookingItemId}`)
    const data = unwrap(raw)
    return Array.isArray(data) ? data : data?.items ?? []
  },

  create: (payload: CreateCareRecordPayload) =>
    axiosClient.post('/api/carerecords', payload),
}

export default careRecordService
