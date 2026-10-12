import axiosClient from './axiosClient'
import { useAuthStore } from '@/store/useAuthStore'
import type {
  GroomingTaskResponseDTO,
  GetGroomingTasksParams,
  UpdateGroomingTaskStatusPayload,
} from '@/types/groomingTask.types'

export interface PagedGroomingTasks {
  items: GroomingTaskResponseDTO[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

export const groomingTaskService = {
  /**
   * GET /api/bookings/my-grooming-tasks
   * Lấy danh sách ca làm việc Grooming của chính nhân viên đang đăng nhập.
   * Có fallback sang /api/bookings/staff/{staffId}/grooming-tasks nếu endpoint chưa sẵn sàng.
   */
  getMyTasks: async (params?: GetGroomingTasksParams): Promise<PagedGroomingTasks> => {
    try {
      const res: any = await axiosClient.get('/api/bookings/my-grooming-tasks', { params })
      const result = res?.result ?? res?.data ?? res
      return {
        items: result?.items ?? [],
        totalCount: result?.totalCount ?? 0,
        pageNumber: result?.pageNumber ?? 1,
        pageSize: result?.pageSize ?? 10,
      }
    } catch (err: any) {
      // Fallback: nếu /api/bookings/my-grooming-tasks trả 404 (do backend cũ chưa reload route), gọi qua staffId
      if (err?.response?.status === 404) {
        const staffId = useAuthStore.getState().user?.id
        if (staffId) {
          const fallbackRes: any = await axiosClient.get(
            `/api/bookings/staff/${staffId}/grooming-tasks`,
            { params }
          )
          const result = fallbackRes?.result ?? fallbackRes?.data ?? fallbackRes
          return {
            items: result?.items ?? [],
            totalCount: result?.totalCount ?? 0,
            pageNumber: result?.pageNumber ?? 1,
            pageSize: result?.pageSize ?? 10,
          }
        }
      }
      throw err
    }
  },

  /**
   * PUT /api/bookings/{bookingId}/items/{itemId}/status
   * Cập nhật trạng thái ca làm việc (bắt đầu In_Progress = 3, hoàn tất Completed = 4 kèm ảnh & ghi chú)
   */
  updateTaskStatus: async (
    bookingId: string,
    itemId: string,
    payload: UpdateGroomingTaskStatusPayload
  ): Promise<any> => {
    return axiosClient.put(`/api/bookings/${bookingId}/items/${itemId}/status`, payload)
  },
}

export default groomingTaskService
