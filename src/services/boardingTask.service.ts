import axiosClient from './axiosClient'
import type { BoardingTaskResponseDTO } from '@/types/boardingTask.types'

export interface PagedBoardingTasks {
  items: BoardingTaskResponseDTO[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

function unwrap(value: any): any {
  return value?.result ?? value?.data?.result ?? value?.data ?? value
}

export const boardingTaskService = {
  getMyTasks: async (params: { date: string; pageNumber: number; pageSize: number }): Promise<PagedBoardingTasks> => {
    const raw: any = await axiosClient.get('/api/bookings/my-boarding-tasks', { params })
    const data = unwrap(raw)
    return {
      items: data?.items ?? [],
      totalCount: data?.totalCount ?? data?.total ?? 0,
      pageNumber: data?.pageNumber ?? params.pageNumber,
      pageSize: data?.pageSize ?? params.pageSize,
    }
  },

  getActiveTasks: async (params: { date: string; pageNumber: number; pageSize: number }): Promise<PagedBoardingTasks> => {
    const raw: any = await axiosClient.get('/api/bookings/active-boarding-tasks', { params })
    const data = unwrap(raw)
    return {
      items: data?.items ?? [],
      totalCount: data?.totalCount ?? data?.total ?? 0,
      pageNumber: data?.pageNumber ?? params.pageNumber,
      pageSize: data?.pageSize ?? params.pageSize,
    }
  },

  updateItemStatus: (bookingId: string, itemId: string, status: number, resultNote?: string) =>
    axiosClient.put(`/api/bookings/${bookingId}/items/${itemId}/status`, {
      status,
      ...(resultNote ? { resultNote } : {}),
    }),
}

export default boardingTaskService
