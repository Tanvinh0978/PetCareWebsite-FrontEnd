import axiosClient from './axiosClient'
import { useAuthStore } from '@/store/useAuthStore'
import type {
  StaffDTO,
  CreateStaffDTO,
  UpdateStaffDTO,
  StaffQueryParams,
} from '@/types/staff.types'

const LOCAL_STORAGE_KEY = 'petcare.staff.mock'

const INITIAL_STAFF: StaffDTO[] = [
  {
    id: 'B0000000-0000-0000-0000-000000000001',
    fullName: 'Admin User',
    email: 'admin@petcare.com',
    phoneNumber: '0901000001',
    yearsOfExperience: 5,
    status: 'Active',
    roles: ['Admin'],
  },
  {
    id: 'B0000000-0000-0000-0000-000000000002',
    fullName: 'Receptionist Mai Huong',
    email: 'receptionist@petcare.com',
    phoneNumber: '0901000002',
    yearsOfExperience: 2,
    status: 'Active',
    roles: ['Receptionist'],
  },
  {
    id: 'B0000000-0000-0000-0000-000000000003',
    fullName: 'Boarding Staff Tuan',
    email: 'boarding@petcare.com',
    phoneNumber: '0901000003',
    yearsOfExperience: 3,
    status: 'Active',
    roles: ['Boarding Staff'],
  },
  {
    id: 'B0000000-0000-0000-0000-000000000004',
    fullName: 'Groomer Hoang Anh',
    email: 'grooming@petcare.com',
    phoneNumber: '0901000004',
    yearsOfExperience: 4,
    status: 'Active',
    roles: ['Grooming Staff'],
  },
]

function getLocalStaff(): StaffDTO[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  saveLocalStaff(INITIAL_STAFF)
  return INITIAL_STAFF
}

function saveLocalStaff(items: StaffDTO[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items))
  } catch {}
}

const mapApiStaff = (s: any): StaffDTO => {
  let statusText: 'Active' | 'Inactive' = 'Active'
  if (s.status === 1 || s.status === 'Inactive') {
    statusText = 'Inactive'
  } else if (s.status === 0 || s.status === 'Active') {
    statusText = 'Active'
  }

  const roles = Array.isArray(s.roles)
    ? s.roles
    : Array.isArray(s.roleNames)
    ? s.roleNames
    : s.role
    ? [s.role]
    : []

  return {
    id: s.id,
    fullName: s.fullName,
    email: s.email,
    phoneNumber: s.phoneNumber,
    address: s.address,
    avatarUrl: s.avatarUrl,
    yearsOfExperience: s.yearsOfExperience ?? 0,
    status: statusText,
    roles,
    roleIds: s.roleIds || [],
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }
}

export const staffService = {
  fetchWithPagination: async (
    params?: StaffQueryParams,
  ): Promise<IPagedResult<StaffDTO>> => {
    try {
      const queryParams: Record<string, any> = {}
      if (params?.searchTerm) queryParams.searchTerm = params.searchTerm
      if (params?.pageNumber) queryParams.pageNumber = params.pageNumber
      if (params?.pageSize) queryParams.pageSize = params.pageSize

      if (params?.status !== undefined && params?.status !== 'all') {
        if (params.status === 'active' || params.status === 0) {
          queryParams.status = 0
        } else if (params.status === 'inactive' || params.status === 1) {
          queryParams.status = 1
        }
      }

      const res: any = await axiosClient.get('/api/Staffs', { params: queryParams })
      const container = res?.result || res
      if (container?.items) {
        return {
          items: container.items.map(mapApiStaff),
          totalCount: container.totalCount,
          pageNumber: container.pageNumber || params?.pageNumber || 1,
          pageSize: container.pageSize || params?.pageSize || 10,
          totalPages: container.totalPages || Math.ceil((container.totalCount || 0) / (container.pageSize || 10)) || 1,
          hasPreviousPage: container.hasPreviousPage ?? (params?.pageNumber ? params.pageNumber > 1 : false),
          hasNextPage: container.hasNextPage ?? false,
        }
      }
    } catch (err) {
      console.warn('Backend /api/Staffs error, falling back to local storage:', err)
    }

    // Local fallback
    const all = getLocalStaff()
    const term = params?.searchTerm?.trim().toLowerCase()
    const status = params?.status

    const filtered = all.filter((s) => {
      if (term) {
        const matchName = s.fullName.toLowerCase().includes(term)
        const matchEmail = s.email.toLowerCase().includes(term)
        const matchPhone = s.phoneNumber.includes(term)
        const matchRole = s.roles.some((r) => r.toLowerCase().includes(term))
        if (!matchName && !matchEmail && !matchPhone && !matchRole) return false
      }
      if (status !== undefined && status !== 'all') {
        const isActive = status === 'active' || status === 0
        if ((s.status === 'Active') !== isActive) return false
      }
      return true
    })

    const page = params?.pageNumber || 1
    const size = params?.pageSize || 10
    const totalCount = filtered.length
    const totalPages = Math.ceil(totalCount / size) || 1
    const start = (page - 1) * size
    const pagedItems = filtered.slice(start, start + size)

    return {
      items: pagedItems,
      totalCount,
      pageNumber: page,
      pageSize: size,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    }
  },

  fetchById: async (id: string): Promise<StaffDTO> => {
    try {
      const res: any = await axiosClient.get(`/api/Staffs/${id}`)
      const raw = res?.result || res
      if (raw && (raw.id || raw.fullName)) {
        return mapApiStaff(raw)
      }
    } catch (err) {
      console.warn(`Backend /api/Staffs/${id} failed, checking local storage:`, err)
    }

    const all = getLocalStaff()
    const item = all.find((s) => s.id === id)
    if (!item) throw new Error(`Staff with ID ${id} not found`)
    return item
  },

  create: async (data: CreateStaffDTO): Promise<string> => {
    const res: any = await axiosClient.post('/api/Staffs', data)
    const newId = res?.result ?? res?.data?.result ?? res?.id
    if (res?.isSuccess === false || res?.IsSuccess === false) {
      throw new Error(res?.message || res?.Message || 'The server rejected the staff account.')
    }
    if (!newId) {
      throw new Error('The server did not confirm staff creation. Please check the staff list before trying again.')
    }
    return String(newId)
  },

  update: async (id: string, data: UpdateStaffDTO): Promise<string> => {
    try {
      const res: any = await axiosClient.put(`/api/Staffs/${id}`, data)
      if (res?.result !== undefined) return id
    } catch (err) {
      console.warn(`Backend /api/Staffs/${id} update failed:`, err)
    }

    const all = getLocalStaff()
    const idx = all.findIndex((s) => s.id === id)
    if (idx !== -1) {
      all[idx] = {
        ...all[idx],
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        address: data.address,
        avatarUrl: data.avatarUrl,
        yearsOfExperience: data.yearsOfExperience,
        status: data.status === 0 ? 'Active' : 'Inactive',
        roleIds: data.roleIds,
        updatedAt: new Date().toISOString(),
      }
      saveLocalStaff(all)
    }
    return id
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      const res: any = await axiosClient.delete(`/api/Staffs/${id}`)
      if (res?.result !== undefined) return Boolean(res.result)
      return true
    } catch (err) {
      console.warn(`Backend /api/Staffs/${id} delete failed:`, err)
    }

    const all = getLocalStaff()
    const idx = all.findIndex((s) => s.id === id)
    if (idx !== -1) {
      all[idx].status = 'Inactive'
      all[idx].updatedAt = new Date().toISOString()
      saveLocalStaff(all)
      return true
    }
    return false
  },

  getProfile: async (): Promise<StaffDTO> => {
    try {
      const res: any = await axiosClient.get('/api/Staffs/profile')
      const raw = res?.result || res?.data || res
      if (raw && (raw.id || raw.fullName)) {
        return mapApiStaff(raw)
      }
    } catch (err) {
      console.warn('Backend /api/Staffs/profile failed, checking user ID:', err)
    }

    const user = useAuthStore.getState().user
    if (user?.id) {
      try {
        return await staffService.fetchById(user.id)
      } catch (e) {
        console.warn('Backend fetchById failed:', e)
      }
    }

    const all = getLocalStaff()
    const found = all.find((s) => s.id === user?.id || s.email === user?.email)
    if (found) return found

    return {
      id: user?.id || 'staff',
      fullName: user?.name || 'Staff Member',
      email: user?.email || user?.login || 'staff@petcare.com',
      phoneNumber: '',
      yearsOfExperience: 0,
      status: 'Active',
      roles: ['Staff'],
    }
  },

  updateProfile: async (payload: {
    fullName: string
    phoneNumber: string
    address?: string
    avatarUrl?: string
    yearsOfExperience?: number
  }): Promise<any> => {
    try {
      const res: any = await axiosClient.put('/api/Staffs/profile', payload)
      return res?.result ?? res?.data ?? res
    } catch (err) {
      console.warn('Backend /api/Staffs/profile update failed:', err)
      const user = useAuthStore.getState().user
      if (user?.id) {
        const all = getLocalStaff()
        const idx = all.findIndex((s) => s.id === user.id || s.email === user.email)
        if (idx !== -1) {
          all[idx] = {
            ...all[idx],
            ...payload,
            updatedAt: new Date().toISOString(),
          }
          saveLocalStaff(all)
        }
      }
      return payload
    }
  },

  changePassword: async (payload: {
    currentPassword: string
    newPassword: string
    confirmNewPassword: string
  }): Promise<any> => {
    const res: any = await axiosClient.put('/api/Staffs/change-password', payload)
    return res?.result ?? res?.data ?? res
  },
}
