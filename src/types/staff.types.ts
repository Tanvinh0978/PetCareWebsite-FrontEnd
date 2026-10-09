export interface StaffDTO {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  yearsOfExperience: number
  role: string
  status: 'Active' | 'Inactive'
  createdAt: string
  updatedAt?: string
}

export interface CreateStaffDTO {
  fullName: string
  email: string
  phoneNumber: string
  password?: string
  yearsOfExperience: number
  role: string
  status?: 'Active' | 'Inactive'
}

export interface UpdateStaffDTO {
  fullName?: string
  phoneNumber?: string
  yearsOfExperience?: number
  role?: string
  status?: 'Active' | 'Inactive'
}

export interface StaffQueryParams {
  searchTerm?: string
  role?: string
  status?: 'all' | 'active' | 'inactive'
  pageNumber?: number
  pageSize?: number
}

export const STAFF_ROLES = [
  'Veterinarian',
  'Pet Groomer',
  'Care Specialist',
  'Receptionist',
  'Facility Manager',
] as const
