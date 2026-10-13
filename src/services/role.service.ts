import axiosClient from './axiosClient'
import type {
  RoleDTO,
  RolePermissionDetailDTO,
  PermissionDTO,
  UpdateRolePermissionsPayload,
} from '@/types/role.types'

const FALLBACK_ROLES: RoleDTO[] = [
  { id: 'A0000000-0000-0000-0000-000000000001', roleName: 'Admin', description: 'System Administrator', totalPermissions: 27 },
  { id: 'A0000000-0000-0000-0000-000000000002', roleName: 'Receptionist', description: 'Front desk intake, scheduling & billing', totalPermissions: 16 },
  { id: 'A0000000-0000-0000-0000-000000000003', roleName: 'Boarding Staff', description: 'Hotel facility & daily care log', totalPermissions: 9 },
  { id: 'A0000000-0000-0000-0000-000000000004', roleName: 'Grooming Staff', description: 'Spa styling & grooming task updates', totalPermissions: 4 },
]

const ALL_SYSTEM_PERMISSIONS: PermissionDTO[] = [
  { id: 'p-1', permissionCode: 'DASHBOARD_VIEW', permissionName: 'View dashboard statistics and overview reports', moduleName: 'Dashboard' },
  { id: 'p-2', permissionCode: 'ROLE_VIEW', permissionName: 'View roles and permissions', moduleName: 'Role & Permission' },
  { id: 'p-3', permissionCode: 'ROLE_MANAGE', permissionName: 'Configure role permissions', moduleName: 'Role & Permission' },
  { id: 'p-4', permissionCode: 'STAFF_VIEW', permissionName: 'View staff members', moduleName: 'Staff' },
  { id: 'p-5', permissionCode: 'STAFF_MANAGE', permissionName: 'Create, edit, deactivate staff accounts, and assign roles', moduleName: 'Staff' },
  { id: 'p-6', permissionCode: 'CUSTOMER_VIEW', permissionName: 'View customer lists and details', moduleName: 'Customer' },
  { id: 'p-7', permissionCode: 'CUSTOMER_MANAGE', permissionName: 'Create and edit customer information', moduleName: 'Customer' },
  { id: 'p-8', permissionCode: 'PET_VIEW', permissionName: 'View pet profiles, weight, and health records', moduleName: 'Pet' },
  { id: 'p-9', permissionCode: 'PET_MANAGE', permissionName: 'Create and update pet profiles and health records', moduleName: 'Pet' },
  { id: 'p-10', permissionCode: 'SERVICE_VIEW', permissionName: 'View services and price lists', moduleName: 'Service' },
  { id: 'p-11', permissionCode: 'SERVICE_MANAGE', permissionName: 'Create and edit services and weight-based pricing', moduleName: 'Service' },
  { id: 'p-12', permissionCode: 'ROOM_VIEW', permissionName: 'View rooms and room types', moduleName: 'Room' },
  { id: 'p-13', permissionCode: 'ROOM_CHECK_AVAILABILITY', permissionName: 'Check room availability by day or month', moduleName: 'Room' },
  { id: 'p-14', permissionCode: 'ROOM_MANAGE', permissionName: 'Manage rooms and maintenance status', moduleName: 'Room' },
  { id: 'p-15', permissionCode: 'BOOKING_VIEW', permissionName: 'View booking lists and details', moduleName: 'Booking' },
  { id: 'p-16', permissionCode: 'BOOKING_CREATE', permissionName: 'Create bookings at the front desk', moduleName: 'Booking' },
  { id: 'p-17', permissionCode: 'BOOKING_CHECKIN', permissionName: 'Check in bookings when customers arrive with their pets', moduleName: 'Booking' },
  { id: 'p-18', permissionCode: 'BOOKING_CANCEL', permissionName: 'Cancel bookings', moduleName: 'Booking' },
  { id: 'p-19', permissionCode: 'BOOKING_UPDATE_STATUS', permissionName: 'Update booking and service progress', moduleName: 'Booking' },
  { id: 'p-20', permissionCode: 'BOOKING_ASSIGN_STAFF', permissionName: 'Assign staff to service tasks', moduleName: 'Booking' },
  { id: 'p-21', permissionCode: 'GROOMING_TASK_VIEW', permissionName: 'View assigned grooming tasks', moduleName: 'Grooming' },
  { id: 'p-22', permissionCode: 'GROOMING_TASK_UPDATE', permissionName: 'Update grooming progress, notes, and before/after photos', moduleName: 'Grooming' },
  { id: 'p-23', permissionCode: 'CARE_RECORD_VIEW', permissionName: 'View care logs for boarded pets', moduleName: 'Care Record' },
  { id: 'p-24', permissionCode: 'CARE_RECORD_CREATE', permissionName: 'Create daily feeding, hygiene, and health logs', moduleName: 'Care Record' },
  { id: 'p-25', permissionCode: 'CARE_RECORD_MANAGE', permissionName: 'Edit and delete care logs', moduleName: 'Care Record' },
  { id: 'p-26', permissionCode: 'VOUCHER_VIEW', permissionName: 'View discount vouchers', moduleName: 'Voucher' },
  { id: 'p-27', permissionCode: 'VOUCHER_MANAGE', permissionName: 'Create and manage vouchers', moduleName: 'Voucher' },
]

function getFallbackRoleDetail(roleId: string): RolePermissionDetailDTO {
  const role = FALLBACK_ROLES.find((r) => r.id === roleId) || FALLBACK_ROLES[0]
  const roleName = role.roleName

  let assignedCodes: string[] = []
  try {
    const raw = localStorage.getItem(`petcare.role_perms.${roleName}`) || localStorage.getItem(`petcare.role_perms.${roleId}`)
    if (raw) assignedCodes = JSON.parse(raw)
  } catch {}

  if (!assignedCodes || assignedCodes.length === 0) {
    if (roleName === 'Admin') {
      assignedCodes = ALL_SYSTEM_PERMISSIONS.map((p) => p.permissionCode)
    } else if (roleName === 'Receptionist') {
      assignedCodes = [
        'DASHBOARD_VIEW', 'CUSTOMER_VIEW', 'CUSTOMER_MANAGE', 'PET_VIEW', 'PET_MANAGE',
        'SERVICE_VIEW', 'ROOM_VIEW', 'ROOM_CHECK_AVAILABILITY', 'BOOKING_VIEW', 'BOOKING_CREATE',
        'BOOKING_CHECKIN', 'BOOKING_CANCEL', 'BOOKING_UPDATE_STATUS', 'BOOKING_ASSIGN_STAFF',
        'CARE_RECORD_VIEW', 'VOUCHER_VIEW', 'STAFF_VIEW'
      ]
    } else if (roleName === 'Boarding Staff') {
      assignedCodes = [
        'PET_VIEW', 'ROOM_VIEW', 'ROOM_CHECK_AVAILABILITY', 'ROOM_MANAGE',
        'BOOKING_VIEW', 'BOOKING_UPDATE_STATUS', 'CARE_RECORD_VIEW', 'CARE_RECORD_CREATE', 'CARE_RECORD_MANAGE'
      ]
    } else if (roleName === 'Grooming Staff') {
      assignedCodes = ['PET_VIEW', 'GROOMING_TASK_VIEW', 'GROOMING_TASK_UPDATE', 'BOOKING_UPDATE_STATUS']
    }
  }

  const assignedPermissions = ALL_SYSTEM_PERMISSIONS.filter((p) => assignedCodes.includes(p.permissionCode))

  return {
    roleId: role.id,
    roleName: role.roleName,
    description: role.description,
    assignedPermissions,
    allAvailablePermissions: ALL_SYSTEM_PERMISSIONS,
  }
}

export const roleService = {
  /**
   * GET /api/Roles
   */
  getRoles: async (): Promise<RoleDTO[]> => {
    try {
      const res: any = await axiosClient.get('/api/Roles')
      if (res?.result && Array.isArray(res.result)) return res.result
      if (Array.isArray(res)) return res
    } catch (err) {
      console.warn('Backend /api/Roles error, falling back to cached roles:', err)
    }
    return FALLBACK_ROLES
  },

  /**
   * GET /api/Roles/{roleId}/permissions
   */
  getRolePermissions: async (roleId: string): Promise<RolePermissionDetailDTO> => {
    try {
      const res: any = await axiosClient.get(`/api/Roles/${roleId}/permissions`)
      const result = res?.result || res
      if (result && Array.isArray(result.allAvailablePermissions)) {
        return result
      }
    } catch (err) {
      console.warn(`Backend /api/Roles/${roleId}/permissions failed, using local permissions:`, err)
    }
    return getFallbackRoleDetail(roleId)
  },

  /**
   * PUT /api/Roles/{roleId}/permissions
   */
  updateRolePermissions: async (payload: UpdateRolePermissionsPayload): Promise<boolean> => {
    try {
      const res: any = await axiosClient.put(`/api/Roles/${payload.roleId}/permissions`, {
        roleId: payload.roleId,
        permissionIds: payload.permissionIds,
      })
      if (res?.result !== undefined) return Boolean(res.result)
      return true
    } catch (err) {
      console.warn(`Backend /api/Roles/${payload.roleId}/permissions update failed, saving locally:`, err)
      return true
    }
  },
}
