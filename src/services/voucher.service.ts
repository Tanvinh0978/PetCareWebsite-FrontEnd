import axiosClient from './axiosClient'
import type { CreateVoucherDTO, UpdateVoucherDTO, VoucherDTO } from '@/types/voucher.types'

const BASE = '/api/Vouchers'

export const voucherService = {
  /**
   * GET /api/Vouchers?pageIndex=&pageSize=
   * Trả về danh sách có phân trang (không filter).
   */
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

  /**
   * GET /api/Vouchers/search?keyword=&isValidOnly=&pageIndex=&pageSize=
   * Tìm kiếm theo mã voucher và lọc theo trạng thái hiệu lực.
   */
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

  /**
   * GET /api/Vouchers/{id}
   */
  fetchById: (id: string) =>
    axiosClient.get<IBackendRes<VoucherDTO>, IBackendRes<VoucherDTO>>(`${BASE}/${id}`),

  /**
   * POST /api/Vouchers
   */
  create: (payload: CreateVoucherDTO) =>
    axiosClient.post<IBackendRes<string>, IBackendRes<string>>(BASE, payload),

  /**
   * PUT /api/Vouchers/{id}
   */
  update: (id: string, payload: UpdateVoucherDTO) =>
    axiosClient.put<IBackendRes<string>, IBackendRes<string>>(`${BASE}/${id}`, payload),

  /**
   * DELETE /api/Vouchers/{id}
   * Backend hard-delete nếu chưa được dùng (currentUsage == 0),
   * hoặc soft-delete nếu đã có usage.
   */
  remove: (id: string) =>
    axiosClient.delete<IBackendRes<string>, IBackendRes<string>>(`${BASE}/${id}`),
}
