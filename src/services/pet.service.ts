import axiosClient from './axiosClient'
import type { PetDTO, CreatePetDTO, UpdatePetDTO, PetQueryParams } from '@/types/pet.types'

export const petService = {
  /**
   * GET /api/Pets/search — [Admin/Staff]
   * Backend: SearchPetsQuery → trả PagedResult<PetListResponseDTO> trực tiếp (Ok(response))
   * JSON: { items, totalCount, pageNumber, pageSize, totalPages, hasPreviousPage, hasNextPage }
   */
  fetchWithPagination: async (params?: PetQueryParams): Promise<IPagedResult<PetDTO>> => {
    const queryParams: Record<string, any> = {}
    if (params?.keyword) queryParams.keyword = params.keyword.trim()
    if (params?.species !== undefined && params?.species !== null) queryParams.species = params.species
    if (params?.pageIndex) queryParams.pageIndex = params.pageIndex
    if (params?.pageSize) queryParams.pageSize = params.pageSize
    if (params?.isActive !== undefined) queryParams.isActive = params.isActive

    // Use /api/Pets (not /search) when no keyword/species filter — both work identically
    const hasSearchParams = params?.keyword || params?.species !== undefined
    const endpoint = hasSearchParams ? '/api/Pets/search' : '/api/Pets'
    const res: any = await axiosClient.get(endpoint, { params: queryParams })

    // Backend returns PagedResult<T> directly via Ok() — no IBackendRes wrapper
    // JSON fields are camelCased by .NET default serializer:
    //   { items, totalCount, pageNumber, pageSize, totalPages, hasPreviousPage, hasNextPage }
    if (res && Array.isArray(res.items)) {
      return {
        items: res.items as PetDTO[],
        totalCount: res.totalCount ?? res.items.length,
        pageNumber: res.pageNumber ?? 1,
        pageSize: res.pageSize ?? 10,
        totalPages: res.totalPages ?? 1,
        hasPreviousPage: res.hasPreviousPage ?? false,
        hasNextPage: res.hasNextPage ?? false,
      }
    }

    // Fallback: wrapped in IBackendRes
    if (res?.result && Array.isArray(res.result.items)) {
      const r = res.result
      return {
        items: r.items as PetDTO[],
        totalCount: r.totalCount ?? r.items.length,
        pageNumber: r.pageNumber ?? 1,
        pageSize: r.pageSize ?? 10,
        totalPages: r.totalPages ?? 1,
        hasPreviousPage: r.hasPreviousPage ?? false,
        hasNextPage: r.hasNextPage ?? false,
      }
    }

    return {
      items: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: params?.pageSize ?? 10,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    }
  },

  /**
   * GET /api/Pets/{id} — [Authorize]
   * Backend: ApiResponse<PetResponseDTO>
   */
  fetchById: async (id: string): Promise<PetDTO> => {
    const res: any = await axiosClient.get(`/api/Pets/${id}`)
    return res?.result ?? res
  },

  /**
   * GET /api/Pets/customer/{customerId} — [Authorize]
   * Backend: ApiResponse<List<PetResponseDTO>>
   * Customer chỉ xem được pet của chính mình (kiểm tra qua JWT claims)
   */
  fetchByCustomerId: async (customerId: string): Promise<PetDTO[]> => {
    try {
      const res: any = await axiosClient.get(`/api/Pets/customer/${customerId}`)
      const pets = res?.result ?? res
      if (Array.isArray(pets)) return pets as PetDTO[]
    } catch {
      // Fallback to general search filtered by customerId
      try {
        const paged = await petService.fetchWithPagination({ pageSize: 100 })
        return paged.items.filter((p) => p.customerId === customerId)
      } catch {
        return []
      }
    }
    return []
  },

  /**
   * GET /api/Pets/my-pets — [Authorize]
   * Backend: ApiResponse<List<PetResponseDTO>> — pets của customer đang đăng nhập (từ JWT)
   */
  fetchMyPets: async (isActive?: boolean): Promise<PetDTO[]> => {
    const params: Record<string, any> = {}
    if (isActive !== undefined) params.isActive = isActive
    const res: any = await axiosClient.get('/api/Pets/my-pets', { params })
    const pets = res?.result ?? res
    if (Array.isArray(pets)) return pets as PetDTO[]
    return []
  },

  /**
   * POST /api/Pets — [Authorize]
   */
  create: async (payload: CreatePetDTO): Promise<string> => {
    const res: any = await axiosClient.post('/api/Pets', payload)
    return res?.result ?? res
  },

  /**
   * PUT /api/Pets/{id} — [Authorize]
   */
  update: async (id: string, payload: UpdatePetDTO): Promise<string> => {
    const res: any = await axiosClient.put(`/api/Pets/${id}`, payload)
    return res?.result ?? res
  },

  /**
   * DELETE /api/Pets/{id} — [Authorize] — Soft delete (isActive = false)
   */
  delete: async (id: string): Promise<boolean> => {
    const res: any = await axiosClient.delete(`/api/Pets/${id}`)
    return res?.result ?? res?.isSuccess ?? true
  },
}
