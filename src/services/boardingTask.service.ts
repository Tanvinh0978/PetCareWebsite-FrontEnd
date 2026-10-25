import axiosClient from './axiosClient'
import { useAuthStore } from '@/store/useAuthStore'
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

function getStaffId(): string | undefined {
  const user = useAuthStore.getState().user
  if (user?.id) return user.id

  const token = useAuthStore.getState().accessToken
  if (token) {
    try {
      const payloadBase64 = token.split('.')[1]
      if (payloadBase64) {
        const decoded = JSON.parse(atob(payloadBase64))
        return (
          decoded.nameid ||
          decoded.sub ||
          decoded.UserId ||
          decoded.StaffId ||
          decoded.id ||
          decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
        )
      }
    } catch {}
  }
  return undefined
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

  updateItemStatus: (
    bookingId: string,
    itemId: string,
    status: number,
    resultNote?: string,
    staffId?: string,
    roomId?: string
  ) => {
    const effectiveStaffId = staffId || getStaffId()
    const body: any = {
      status,
      ...(effectiveStaffId ? { staffId: effectiveStaffId } : {}),
      ...(roomId ? { roomId } : {}),
      ...(resultNote ? { resultNote } : {}),
    }
    return axiosClient.put(`/api/bookings/${bookingId}/items/${itemId}/status`, body)
  },
}

export default boardingTaskService
