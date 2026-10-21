import type { NavItem } from '@/routes/nav'
import { roleService } from '@/services/role.service'
import { getMyPermissions } from '@/api/authApi'
import { useAuthStore } from '@/store/useAuthStore'

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'DASHBOARD_VIEW',
  // Service
  SERVICE_VIEW: 'SERVICE_VIEW',
  SERVICE_MANAGE: 'SERVICE_MANAGE',
  // Room
  ROOM_VIEW: 'ROOM_VIEW',
  ROOM_MANAGE: 'ROOM_MANAGE',
  ROOM_CHECK_AVAILABILITY: 'ROOM_CHECK_AVAILABILITY',
  // Staff
  STAFF_VIEW: 'STAFF_VIEW',
  STAFF_MANAGE: 'STAFF_MANAGE',
  // Voucher
  VOUCHER_VIEW: 'VOUCHER_VIEW',
  VOUCHER_MANAGE: 'VOUCHER_MANAGE',
  // Customer
  CUSTOMER_VIEW: 'CUSTOMER_VIEW',
  CUSTOMER_MANAGE: 'CUSTOMER_MANAGE',
  // Pet
  PET_VIEW: 'PET_VIEW',
  PET_MANAGE: 'PET_MANAGE',
  // Role
  ROLE_VIEW: 'ROLE_VIEW',
  ROLE_MANAGE: 'ROLE_MANAGE',
  // Booking
  BOOKING_VIEW: 'BOOKING_VIEW',
  BOOKING_MANAGE: 'BOOKING_MANAGE',
  BOOKING_CREATE: 'BOOKING_CREATE',
  BOOKING_CHECKIN: 'BOOKING_CHECKIN',
  BOOKING_CANCEL: 'BOOKING_CANCEL',
  BOOKING_UPDATE_STATUS: 'BOOKING_UPDATE_STATUS',
  BOOKING_ASSIGN_STAFF: 'BOOKING_ASSIGN_STAFF',
  // Grooming
  GROOMING_TASK_VIEW: 'GROOMING_TASK_VIEW',
  GROOMING_TASK_UPDATE: 'GROOMING_TASK_UPDATE',
  // Care Record
  CARE_RECORD_VIEW: 'CARE_RECORD_VIEW',
  CARE_RECORD_CREATE: 'CARE_RECORD_CREATE',
  CARE_RECORD_MANAGE: 'CARE_RECORD_MANAGE',
} as const

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  Admin: Object.values(PERMISSIONS),
  Receptionist: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.SERVICE_VIEW,
    PERMISSIONS.SERVICE_MANAGE,
    PERMISSIONS.ROOM_VIEW,
    PERMISSIONS.ROOM_MANAGE,
    PERMISSIONS.ROOM_CHECK_AVAILABILITY,
    PERMISSIONS.PET_VIEW,
    PERMISSIONS.PET_MANAGE,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_MANAGE,
    PERMISSIONS.VOUCHER_VIEW,
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.BOOKING_VIEW,
    PERMISSIONS.BOOKING_MANAGE,
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_CHECKIN,
    PERMISSIONS.BOOKING_CANCEL,
    PERMISSIONS.BOOKING_UPDATE_STATUS,
    PERMISSIONS.BOOKING_ASSIGN_STAFF,
    PERMISSIONS.CARE_RECORD_VIEW,
  ],
  'Boarding Staff': [
    PERMISSIONS.ROOM_VIEW,
    PERMISSIONS.ROOM_MANAGE,
    PERMISSIONS.ROOM_CHECK_AVAILABILITY,
    PERMISSIONS.PET_VIEW,
    PERMISSIONS.PET_MANAGE,
    PERMISSIONS.CARE_RECORD_VIEW,
    PERMISSIONS.CARE_RECORD_CREATE,
    PERMISSIONS.CARE_RECORD_MANAGE,
  ],
  'Grooming Staff': [
    PERMISSIONS.SERVICE_VIEW,
    PERMISSIONS.PET_VIEW,
    PERMISSIONS.PET_MANAGE,
    PERMISSIONS.GROOMING_TASK_VIEW,
    PERMISSIONS.GROOMING_TASK_UPDATE,
  ],
}

/**
 * Parses JWT token payload claims (role, roles, permissions)
 */
export function parseJwtClaims(token: string): any {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

/**
 * Returns effective permission codes for the given user.
 */
export function getUserEffectivePermissions(user: IUser | null): string[] {
  if (!user) return []

  const isAdmin =
    user.role === 'admin' ||
    (user.roles && user.roles.some((r) => r.toLowerCase() === 'admin'))
  if (isAdmin) {
    return Object.values(PERMISSIONS)
  }

  const userRoles =
    user.roles && user.roles.length > 0
      ? user.roles
      : [guessRoleFromUser(user)]

  // 1. Prioritize real-time / custom permissions cached per role in localStorage
  let hasRolePermInCache = false
  const aggregated = new Set<string>()

  for (const roleName of userRoles) {
    try {
      const cached = localStorage.getItem(`petcare.role_perms.${roleName}`)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed)) {
          parsed.forEach((p) => aggregated.add(p))
          hasRolePermInCache = true
        }
      }
    } catch {}
  }

  if (hasRolePermInCache) {
    return Array.from(aggregated)
  }

  // 2. Direct permissions on user if already loaded (e.g. from token)
  if (user.permissions && user.permissions.length > 0) {
    return user.permissions
  }

  // 3. Fallback to default role permissions
  for (const roleName of userRoles) {
    const defaults = DEFAULT_ROLE_PERMISSIONS[roleName]
    if (defaults) {
      defaults.forEach((p) => aggregated.add(p))
    }
  }

  return Array.from(aggregated)
}

/**
 * Guess role name if not explicitly set (e.g. from email or login)
 */
export function guessRoleFromUser(user: IUser | null): string {
  if (!user) return 'Staff'
  const email = (user.email || user.login || '').toLowerCase()
  const name = (user.name || '').toLowerCase()
  if (email.includes('receptionist') || name.includes('lễ tân') || name.includes('receptionist')) {
    return 'Receptionist'
  }
  if (email.includes('boarding') || name.includes('trực phòng') || name.includes('boarding')) {
    return 'Boarding Staff'
  }
  if (email.includes('grooming') || name.includes('cắt tỉa') || name.includes('grooming')) {
    return 'Grooming Staff'
  }
  return 'Receptionist'
}

/**
 * Checks whether user has permission code(s).
 */
export function hasPermission(
  user: IUser | null,
  requiredPerm: string | string[]
): boolean {
  if (!user) return false
  if (
    user.role === 'admin' ||
    (user.roles && user.roles.some((r) => r.toLowerCase() === 'admin'))
  ) {
    return true
  }

  const effective = getUserEffectivePermissions(user)
  if (Array.isArray(requiredPerm)) {
    return requiredPerm.some((p) => effective.includes(p))
  }
  return effective.includes(requiredPerm)
}

/**
 * Build dynamic navigation menu for staff based on permissions.
 */
export function getStaffNavItems(user: IUser | null): NavItem[] {
  const items: NavItem[] = []
  const effective = getUserEffectivePermissions(user)
  const roleNames = user?.roles?.length ? user.roles : [guessRoleFromUser(user)]
  const normalizedRoles = roleNames.map((role) => role.toLowerCase())
  const isAdmin = user?.role === 'admin' || normalizedRoles.includes('admin')
  const isReceptionist = normalizedRoles.includes('receptionist')
  const isBoardingStaff = normalizedRoles.includes('boarding staff')
  const isGroomingStaff = normalizedRoles.includes('grooming staff')

  const can = (codes: string[]) =>
    user?.role === 'admin' || codes.some((c) => effective.includes(c))

  // Services
  if (can([PERMISSIONS.SERVICE_VIEW, PERMISSIONS.SERVICE_MANAGE])) {
    items.push({ label: 'Services', to: 'services' })
  }

  // Customers
  if (can([PERMISSIONS.CUSTOMER_VIEW, PERMISSIONS.CUSTOMER_MANAGE])) {
    items.push({ label: 'Customers', to: 'customers' })
  }

  // Receptionists and admins manage room inventory. Boarding staff work from
  // assigned room cards and should not see inventory pages they cannot access.
  if (
    (isAdmin || isReceptionist) &&
    can([
      PERMISSIONS.ROOM_VIEW,
      PERMISSIONS.ROOM_MANAGE,
      PERMISSIONS.ROOM_CHECK_AVAILABILITY,
    ])
  ) {
    items.push({ label: 'Room Types', to: 'room-types' })
    items.push({ label: 'Rooms', to: 'rooms' })
  }

  // Pets
  if (can([PERMISSIONS.PET_VIEW, PERMISSIONS.PET_MANAGE]) || items.length === 0) {
    items.push({ label: 'Pets', to: 'pets' })
  }

  // Staff
  if (can([PERMISSIONS.STAFF_VIEW, PERMISSIONS.STAFF_MANAGE])) {
    items.push({ label: 'Staff', to: 'staff' })
  }

  // Roles & Permissions (only if granted)
  if (can([PERMISSIONS.ROLE_VIEW, PERMISSIONS.ROLE_MANAGE])) {
    items.push({ label: 'Roles & Permissions', to: 'roles' })
  }

  // Vouchers
  if (can([PERMISSIONS.VOUCHER_VIEW, PERMISSIONS.VOUCHER_MANAGE])) {
    items.push({ label: 'Vouchers', to: 'vouchers' })
  }

  // Keep role-specific task views out of other staff workspaces.
  if (isAdmin || isReceptionist || isGroomingStaff) {
    items.push({ label: 'Grooming Tasks', to: 'grooming-tasks' })
  }

  // Boarding Tasks
  if (isAdmin || isReceptionist || isBoardingStaff) {
    items.push({ label: 'Boarding Tasks', to: 'manage-boarding' })
  }

  // Bookings
  if (can([PERMISSIONS.BOOKING_VIEW, PERMISSIONS.BOOKING_MANAGE])) {
    items.push({ label: 'Bookings', to: 'bookings' })
  }

  // Reviews
  items.push({ label: 'Reviews', to: 'reviews' })

  // Deduplicate items by route path
  return items.filter((item, index, self) => index === self.findIndex((t) => t.to === item.to))
}

/**
 * Async sync user permissions from backend /api/auth/my-permissions or /api/Roles
 */
export async function syncUserPermissions(): Promise<string[]> {
  const user = useAuthStore.getState().user
  if (!user || user.role === 'customer' || user.role === 'guest') return []

  if (
    user.role === 'admin' ||
    (user.roles && user.roles.some((r) => r.toLowerCase() === 'admin'))
  ) {
    const all = Object.values(PERMISSIONS)
    useAuthStore.getState().setPermissions(all)
    return all
  }

  const roleName = user.roles?.[0] || guessRoleFromUser(user)

  // 1. Try fetching real-time permissions directly from backend for authenticated user
  try {
    const res = await getMyPermissions()
    if (res?.isSuccess && Array.isArray(res.result)) {
      const codes = res.result
      localStorage.setItem(`petcare.role_perms.${roleName}`, JSON.stringify(codes))
      useAuthStore.getState().setPermissions(codes)
      if (!user.roles || user.roles.length === 0) {
        useAuthStore.getState().setRoles([roleName])
      }
      return codes
    }
  } catch (err) {
    // If endpoint fails, continue fallback
  }

  // 2. Fallback to /api/Roles if Admin or allowed
  try {
    const roles = await roleService.getRoles()
    const matched = roles.find(
      (r) => r.roleName.toLowerCase() === roleName.toLowerCase()
    )
    if (matched) {
      const detail = await roleService.getRolePermissions(matched.id)
      if (detail?.assignedPermissions) {
        const codes = detail.assignedPermissions.map((p) => p.permissionCode)
        localStorage.setItem(`petcare.role_perms.${roleName}`, JSON.stringify(codes))
        localStorage.setItem(`petcare.role_perms.${matched.id}`, JSON.stringify(codes))
        useAuthStore.getState().setPermissions(codes)
        if (!user.roles || user.roles.length === 0) {
          useAuthStore.getState().setRoles([roleName])
        }
        return codes
      }
    }
  } catch (err) {
    // Ignore 401/403
  }

  // 3. Fallback to local / cached
  const effective = getUserEffectivePermissions(user)
  useAuthStore.getState().setPermissions(effective)
  if (!user.roles || user.roles.length === 0) {
    useAuthStore.getState().setRoles([roleName])
  }
  return effective
}
