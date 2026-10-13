import type { NavItem } from '@/routes/nav'
import { roleService } from '@/services/role.service'
import { useAuthStore } from '@/store/useAuthStore'

export const PERMISSIONS = {
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
} as const

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  Admin: Object.values(PERMISSIONS),
  Receptionist: [
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
    PERMISSIONS.VOUCHER_MANAGE,
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.BOOKING_VIEW,
    PERMISSIONS.BOOKING_MANAGE,
  ],
  'Boarding Staff': [
    PERMISSIONS.ROOM_VIEW,
    PERMISSIONS.ROOM_MANAGE,
    PERMISSIONS.ROOM_CHECK_AVAILABILITY,
    PERMISSIONS.PET_VIEW,
    PERMISSIONS.PET_MANAGE,
  ],
  'Grooming Staff': [
    PERMISSIONS.SERVICE_VIEW,
    PERMISSIONS.PET_VIEW,
    PERMISSIONS.PET_MANAGE,
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

  // 1. Direct permissions on user if already loaded
  if (user.permissions && user.permissions.length > 0) {
    return user.permissions
  }

  // 2. Check cached permissions per role in localStorage
  const userRoles =
    user.roles && user.roles.length > 0
      ? user.roles
      : [guessRoleFromUser(user)]

  const aggregated = new Set<string>()

  for (const roleName of userRoles) {
    let loadedFromCache = false
    try {
      const cached = localStorage.getItem(`petcare.role_perms.${roleName}`)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((p) => aggregated.add(p))
          loadedFromCache = true
        }
      }
    } catch {}

    if (!loadedFromCache) {
      const defaults = DEFAULT_ROLE_PERMISSIONS[roleName]
      if (defaults) {
        defaults.forEach((p) => aggregated.add(p))
      }
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

  // Room Types & Rooms
  if (
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

  // Grooming Tasks
  items.push({ label: 'Grooming Tasks', to: 'grooming-tasks' })

  // Bookings
  if (can([PERMISSIONS.BOOKING_VIEW, PERMISSIONS.BOOKING_MANAGE])) {
    items.push({ label: 'Bookings', to: 'bookings' })
  }

  // Reviews
  items.push({ label: 'Reviews', to: 'reviews' })

  return items
}

/**
 * Async sync user permissions from backend /api/Roles
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

  // Nếu user đã có permissions từ lúc đăng nhập, dùng luôn mà không cần gọi /api/Roles
  if (user.permissions && user.permissions.length > 0) {
    return user.permissions
  }

  const roleName = user.roles?.[0] || guessRoleFromUser(user)

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
    // Không ném lỗi hay cảnh báo console nếu backend từ chối (401/403)
  }

  // Fallback to local
  const effective = getUserEffectivePermissions(user)
  useAuthStore.getState().setPermissions(effective)
  if (!user.roles || user.roles.length === 0) {
    useAuthStore.getState().setRoles([roleName])
  }
  return effective
}
