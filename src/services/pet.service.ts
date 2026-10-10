import axiosClient from './axiosClient'
import type { PetDTO, CreatePetDTO, UpdatePetDTO, PetQueryParams } from '@/types/pet.types'

export const petService = {
  fetchWithPagination: async (params?: PetQueryParams): Promise<IPagedResult<PetDTO>> => {
    const queryParams: Record<string, any> = {}
    if (params?.keyword) queryParams.keyword = params.keyword.trim()
    if (params?.species !== undefined && params?.species !== null) queryParams.species = params.species
    if (params?.pageIndex) queryParams.pageIndex = params.pageIndex
    if (params?.pageSize) queryParams.pageSize = params.pageSize
    if (params?.isActive !== undefined) queryParams.isActive = params.isActive

    const res: any = await axiosClient.get('/api/Pets/search', { params: queryParams })

    // Normalize response shape: backend returns PagedResult directly or wrapped in IBackendRes
    if (res && Array.isArray(res.items)) {
      return res as IPagedResult<PetDTO>
    }
    if (res?.result && Array.isArray(res.result.items)) {
      return res.result as IPagedResult<PetDTO>
    }

    const items = res?.result ?? res?.items ?? []
    return {
      items: Array.isArray(items) ? items : [],
      totalCount: (Array.isArray(items) ? items.length : 0),
      pageNumber: params?.pageIndex ?? 1,
      pageSize: params?.pageSize ?? 10,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    }
  },

  getMyPets: async (): Promise<PetDTO[]> => {
    const res: any = await axiosClient.get('/api/Pets/my-pets')
    return res?.result ?? res ?? []
  },

  fetchById: async (id: string): Promise<PetDTO> => {
    const res: any = await axiosClient.get(`/api/Pets/${id}`)
    return res?.result ?? res
  },

  fetchByCustomerId: async (customerId: string): Promise<PetDTO[]> => {
    try {
      const res: any = await axiosClient.get(`/api/customers/${customerId}`)
      const customer = res?.result ?? res
      if (customer && Array.isArray(customer.pets)) {
        return customer.pets.map((p: any) => ({
          ...p,
          customerId,
          ownerName: customer.fullName,
        }))
      }
    } catch {
      // Fallback: search all and filter by customerId
      try {
        const paged = await petService.fetchWithPagination({ pageSize: 100 })
        return paged.items.filter((p) => p.customerId === customerId)
      } catch {
        return []
      }
    }
    return []
  },

  create: async (payload: CreatePetDTO): Promise<string> => {
    const res: any = await axiosClient.post('/api/Pets', payload)
    return res?.result ?? res
  },

  update: async (id: string, payload: UpdatePetDTO): Promise<string> => {
    const res: any = await axiosClient.put(`/api/Pets/${id}`, payload)
    return res?.result ?? res
  },

  delete: async (id: string): Promise<boolean> => {
    const res: any = await axiosClient.delete(`/api/Pets/${id}`)
    return res?.result ?? res?.isSuccess ?? true
  },
}
