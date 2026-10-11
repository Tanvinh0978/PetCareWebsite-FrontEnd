export interface PermissionDTO {
  id: string
  permissionCode: string
  permissionName: string
  moduleName: string
}

export interface RoleDTO {
  id: string
  roleName: string
  description?: string
  totalPermissions: number
}

export interface RolePermissionDetailDTO {
  roleId: string
  roleName: string
  description?: string
  assignedPermissions: PermissionDTO[]
  allAvailablePermissions: PermissionDTO[]
}

export interface UpdateRolePermissionsPayload {
  roleId: string
  permissionIds: string[]
}
