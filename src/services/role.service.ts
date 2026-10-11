import axiosClient from './axiosClient'
import type {
  RoleDTO,
  RolePermissionDetailDTO,
  UpdateRolePermissionsPayload,
} from '@/types/role.types'

export const roleService = {
  /**
   * GET /api/Roles
   * Returns list of roles with summary info
   */
  getRoles: async (): Promise<RoleDTO[]> => {
    const res: any = await axiosClient.get('/api/Roles')
    if (res?.result) return res.result
    if (Array.isArray(res)) return res
    return []
  },

  /**
   * GET /api/Roles/{roleId}/permissions
   * Returns assigned permissions and all available permissions for the specified role
   */
  getRolePermissions: async (roleId: string): Promise<RolePermissionDetailDTO> => {
    const res: any = await axiosClient.get(`/api/Roles/${roleId}/permissions`)
    if (res?.result) return res.result
    return res
  },

  /**
   * PUT /api/Roles/{roleId}/permissions
   * Updates assigned permissions for a role
   */
  updateRolePermissions: async (payload: UpdateRolePermissionsPayload): Promise<boolean> => {
    const res: any = await axiosClient.put(`/api/Roles/${payload.roleId}/permissions`, {
      roleId: payload.roleId,
      permissionIds: payload.permissionIds,
    })
    if (res?.result !== undefined) return res.result
    return true
  },
}
