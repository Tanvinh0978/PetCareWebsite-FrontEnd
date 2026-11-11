import axiosClient from './axiosClient'
import type { CreateVoucherDTO, UpdateVoucherDTO, VoucherDTO } from '@/types/voucher.types'

const BASE = '/api/Vouchers'

export const voucherService = {
  fetchWithPagination: (params: {
    pageIndex?: number
    pageSize?: number
  }) =>
    axiosClient.get<IBackendRes<IPagedResult<VoucherDTO>>, IBackendRes<IPagedResult<VoucherDTO>>>(BASE, {
      params: {
        pageIndex: params.pageIndex ?? 1,
        pageSize: params.pageSize ?? 10,
      },
    }),

  search: (params: {
    keyword?: string
    isValidOnly?: boolean
    pageIndex?: number
    pageSize?: number
  }) =>
    axiosClient.get<IBackendRes<IPagedResult<VoucherDTO>>, IBackendRes<IPagedResult<VoucherDTO>>>(`${BASE}/search`, {
      params: {
        keyword: params.keyword || undefined,
        isValidOnly: params.isValidOnly,
        pageIndex: params.pageIndex ?? 1,
        pageSize: params.pageSize ?? 10,
      },
    }),

  fetchById: (id: string) =>
    axiosClient.get<IBackendRes<VoucherDTO>, IBackendRes<VoucherDTO>>(`${BASE}/${id}`),

  create: (payload: CreateVoucherDTO) =>
    axiosClient.post<IBackendRes<string>, IBackendRes<string>>(BASE, payload),

  update: (id: string, payload: UpdateVoucherDTO) =>
    axiosClient.put<IBackendRes<string>, IBackendRes<string>>(`${BASE}/${id}`, payload),

  remove: (id: string) =>
    axiosClient.delete<IBackendRes<string>, IBackendRes<string>>(`${BASE}/${id}`),
}
