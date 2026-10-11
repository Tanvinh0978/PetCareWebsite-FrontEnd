export interface StaffDTO {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  address?: string
  avatarUrl?: string
  yearsOfExperience: number
  status: 'Active' | 'Inactive'
  roles: string[]
  roleIds?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface CreateStaffDTO {
  fullName: string
  email: string
  phoneNumber: string
  password: string
  address?: string
  avatarUrl?: string
  yearsOfExperience: number
  roleIds: string[]
}

export interface UpdateStaffDTO {
  fullName: string
  phoneNumber: string
  address?: string
  avatarUrl?: string
  yearsOfExperience: number
  status: number // 0: Active, 1: Inactive
  roleIds: string[]
}

export interface StaffQueryParams {
  searchTerm?: string
  status?: 'all' | 'active' | 'inactive' | number
  pageNumber?: number
  pageSize?: number
}
