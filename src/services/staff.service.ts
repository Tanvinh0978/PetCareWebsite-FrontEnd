import axiosClient from './axiosClient'
import type {
  StaffDTO,
  CreateStaffDTO,
  UpdateStaffDTO,
  StaffQueryParams,
} from '@/types/staff.types'

const LOCAL_STORAGE_KEY = 'petcare.staff.mock'

const INITIAL_STAFF: StaffDTO[] = [
  {
    id: 's101-vet-thao',
    fullName: 'Dr. Nguyen Thu Thao',
    email: 'thao.nguyen@petcare.com',
    phoneNumber: '0903 112 334',
    yearsOfExperience: 6,
    role: 'Veterinarian',
    status: 'Active',
    createdAt: '2024-01-15T08:00:00Z',
  },
  {
    id: 's102-groom-quang',
    fullName: 'Le Minh Quang',
    email: 'quang.le@petcare.com',
    phoneNumber: '0918 223 445',
    yearsOfExperience: 4,
    role: 'Pet Groomer',
    status: 'Active',
    createdAt: '2024-02-10T09:30:00Z',
  },
  {
    id: 's103-care-anh',
    fullName: 'Tran Mai Anh',
    email: 'anh.tran@petcare.com',
    phoneNumber: '0937 445 667',
    yearsOfExperience: 3,
    role: 'Care Specialist',
    status: 'Active',
    createdAt: '2024-03-01T10:00:00Z',
  },
  {
    id: 's104-rec-hoang',
    fullName: 'Pham Huy Hoang',
    email: 'hoang.pham@petcare.com',
    phoneNumber: '0982 778 899',
    yearsOfExperience: 2,
    role: 'Receptionist',
    status: 'Active',
    createdAt: '2024-04-12T11:15:00Z',
  },
  {
    id: 's105-mgr-dung',
    fullName: 'Do Tuan Dung',
    email: 'dung.do@petcare.com',
    phoneNumber: '0908 990 011',
    yearsOfExperience: 8,
    role: 'Facility Manager',
    status: 'Active',
    createdAt: '2023-11-20T07:45:00Z',
  },
  {
    id: 's106-care-lan',
    fullName: 'Vu Thi Ngoc Lan',
    email: 'lan.vu@petcare.com',
    phoneNumber: '0945 334 556',
    yearsOfExperience: 1,
    role: 'Care Specialist',
    status: 'Inactive',
    createdAt: '2024-05-18T14:20:00Z',
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

export const staffService = {
  fetchWithPagination: async (
    params?: StaffQueryParams,
  ): Promise<IPagedResult<StaffDTO>> => {
    try {
      const res: any = await axiosClient.get('/api/staff', { params })
      if (res?.result?.items) return res.result
      if (res?.items) return res
    } catch {
      // Graceful fallback to mock data when /api/staff is not available
    }

    const all = getLocalStaff()
    const term = params?.searchTerm?.trim().toLowerCase()
    const role = params?.role
    const status = params?.status

    let filtered = all.filter((s) => {
      if (term) {
        const matchName = s.fullName.toLowerCase().includes(term)
        const matchEmail = s.email.toLowerCase().includes(term)
        const matchPhone = s.phoneNumber.includes(term)
        if (!matchName && !matchEmail && !matchPhone) return false
      }
      if (role && role !== 'all' && s.role !== role) {
        return false
      }
      if (status && status !== 'all') {
        const isActive = status === 'active'
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
      const res: any = await axiosClient.get(`/api/staff/${id}`)
      if (res?.result) return res.result
      if (res?.id) return res
    } catch {
      // Fallback
    }

    const all = getLocalStaff()
    const item = all.find((s) => s.id === id)
    if (!item) throw new Error(`Staff with ID ${id} not found`)
    return item
  },

  create: async (data: CreateStaffDTO): Promise<string> => {
    try {
      const res: any = await axiosClient.post('/api/staff', data)
      if (res?.result) return res.result
    } catch {
      // Fallback
    }

    const all = getLocalStaff()
    const newId = `s-${Date.now().toString(36)}`
    const newStaff: StaffDTO = {
      id: newId,
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      yearsOfExperience: Number(data.yearsOfExperience) || 0,
      role: data.role,
      status: data.status || 'Active',
      createdAt: new Date().toISOString(),
    }
    saveLocalStaff([newStaff, ...all])
    return newId
  },

  update: async (id: string, data: UpdateStaffDTO): Promise<string> => {
    try {
      const res: any = await axiosClient.put(`/api/staff/${id}`, data)
      if (res?.result) return res.result
    } catch {
      // Fallback
    }

    const all = getLocalStaff()
    const idx = all.findIndex((s) => s.id === id)
    if (idx !== -1) {
      all[idx] = {
        ...all[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      }
      saveLocalStaff(all)
    }
    return id
  },

  toggleStatus: async (id: string): Promise<boolean> => {
    try {
      const res: any = await axiosClient.patch(`/api/staff/${id}/toggle-status`)
      if (res?.result !== undefined) return res.result
    } catch {
      // Fallback
    }

    const all = getLocalStaff()
    const idx = all.findIndex((s) => s.id === id)
    if (idx !== -1) {
      all[idx].status = all[idx].status === 'Active' ? 'Inactive' : 'Active'
      all[idx].updatedAt = new Date().toISOString()
      saveLocalStaff(all)
      return true
    }
    return false
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      const res: any = await axiosClient.delete(`/api/staff/${id}`)
      if (res?.result !== undefined) return res.result
    } catch {
      // Fallback
    }

    const all = getLocalStaff()
    const updated = all.filter((s) => s.id !== id)
    saveLocalStaff(updated)
    return true
  },
}
