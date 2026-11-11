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
  getReviews: (params?: GetReviewsParams) =>
    get<IPagedResult<ReviewListItem>>('/api/Reviews', params),

  getById: (id: string) =>
    get<ReviewDetail>(`/api/Reviews/${id}`),

  create: (payload: CreateReviewPayload) =>
    axiosClient.post<IBackendRes<string>, IBackendRes<string>>('/api/Reviews', payload),

  update: (id: string, payload: UpdateReviewPayload) =>
    axiosClient.put<IBackendRes<boolean>, IBackendRes<boolean>>(`/api/Reviews/${id}`, payload),

  delete: (id: string) =>
    axiosClient.delete<IBackendRes<boolean>, IBackendRes<boolean>>(`/api/Reviews/${id}`),
}
