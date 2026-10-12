import axiosClient from './axiosClient'
import type {
  CreateReviewPayload,
  GetReviewsParams,
  ReviewDetail,
  ReviewListItem,
  UpdateReviewPayload,
} from '@/types/review.types'

const get = <T>(url: string, params?: object) =>
  axiosClient.get<IBackendRes<T>, IBackendRes<T>>(url, { params })

export const reviewService = {
  /**
   * GET /api/Reviews
   * Lấy danh sách review có phân trang, hỗ trợ lọc theo serviceId và rating (1-5 sao)
   */
  getReviews: (params?: GetReviewsParams) =>
    get<IPagedResult<ReviewListItem>>('/api/Reviews', params),

  /**
   * GET /api/Reviews/{id}
   * Lấy thông tin chi tiết một review
   */
  getById: (id: string) =>
    get<ReviewDetail>(`/api/Reviews/${id}`),

  /**
   * POST /api/Reviews
   * Khách hàng tạo đánh giá cho một booking item đã hoàn thành
   */
  create: (payload: CreateReviewPayload) =>
    axiosClient.post<IBackendRes<string>, IBackendRes<string>>('/api/Reviews', payload),

  /**
   * PUT /api/Reviews/{id}
   * Cập nhật đánh giá (chủ review hoặc Admin/Staff)
   */
  update: (id: string, payload: UpdateReviewPayload) =>
    axiosClient.put<IBackendRes<boolean>, IBackendRes<boolean>>(`/api/Reviews/${id}`, payload),

  /**
   * DELETE /api/Reviews/{id}
   * Xóa đánh giá (chủ review hoặc Admin/Staff)
   */
  delete: (id: string) =>
    axiosClient.delete<IBackendRes<boolean>, IBackendRes<boolean>>(`/api/Reviews/${id}`),
}
