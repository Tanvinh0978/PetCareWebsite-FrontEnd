import React, { useEffect, useState, useMemo } from 'react'
import { App, Spin, Tag, Tooltip, Input, Card } from 'antd'
import { roleService } from '@/services/role.service'
import type { RoleDTO, RolePermissionDetailDTO, PermissionDTO } from '@/types/role.types'
import { getApiErrorMessage } from '@/utils/apiError'
import { useAuthStore } from '@/store/useAuthStore'

const getRoleBadgeColor = (roleName: string) => {
  const lower = roleName.toLowerCase()
  if (lower.includes('admin')) return 'red'
  if (lower.includes('receptionist')) return 'blue'
  if (lower.includes('boarding')) return 'green'
  if (lower.includes('grooming')) return 'purple'
  return 'default'
}

export default function RolePermissionPage() {
  const { message } = App.useApp()

  const [roles, setRoles] = useState<RoleDTO[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  
  const [roleDetail, setRoleDetail] = useState<RolePermissionDetailDTO | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [filterModule, setFilterModule] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // 1. Fetch Role List
  useEffect(() => {
    let cancelled = false
    setLoadingRoles(true)
    roleService
      .getRoles()
      .then((data) => {
        if (!cancelled) {
          setRoles(data)
          if (data.length > 0 && !selectedRoleId) {
            setSelectedRoleId(data[0].id)
          }
        }
      })
      .catch((err) => {
        console.warn('Backend roles error, using defaults:', err)
        if (!cancelled) {
          const fallback = [
            { id: 'A0000000-0000-0000-0000-000000000001', roleName: 'Admin', description: 'System Administrator', totalPermissions: 24 },
            { id: 'A0000000-0000-0000-0000-000000000002', roleName: 'Receptionist', description: 'Front desk intake, scheduling & billing', totalPermissions: 14 },
            { id: 'A0000000-0000-0000-0000-000000000003', roleName: 'Boarding Staff', description: 'Hotel facility & daily care log', totalPermissions: 9 },
            { id: 'A0000000-0000-0000-0000-000000000004', roleName: 'Grooming Staff', description: 'Spa styling & grooming task updates', totalPermissions: 4 },
          ]
          setRoles(fallback)
          setSelectedRoleId(fallback[0].id)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRoles(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // 2. Fetch Selected Role Permissions
  useEffect(() => {
    if (!selectedRoleId) return
    let cancelled = false
    setLoadingDetail(true)

    roleService
      .getRolePermissions(selectedRoleId)
      .then((detail) => {
        if (!cancelled) {
          setRoleDetail(detail)
          setSelectedPermIds(detail.assignedPermissions.map((p) => p.id))
        }
      })
      .catch((err) => {
        if (!cancelled) {
          message.error(getApiErrorMessage(err))
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedRoleId])

  // Group all available permissions by module
  const { modules, groupedPermissions } = useMemo(() => {
    if (!roleDetail?.allAvailablePermissions) {
      return { modules: [], groupedPermissions: {} as Record<string, PermissionDTO[]> }
    }

    const groups: Record<string, PermissionDTO[]> = {}
    roleDetail.allAvailablePermissions.forEach((p) => {
      const mod = p.moduleName || 'General'
      if (!groups[mod]) groups[mod] = []
      groups[mod].push(p)
    })

    const mods = Object.keys(groups).sort()
    return { modules: mods, groupedPermissions: groups }
  }, [roleDetail])

  // Toggle single permission
  const handleTogglePerm = (permId: string) => {
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    )
  }

  // Toggle whole module
  const handleToggleModule = (moduleName: string) => {
    const permsInMod = groupedPermissions[moduleName] || []
    const permIdsInMod = permsInMod.map((p) => p.id)
    const allChecked = permIdsInMod.every((id) => selectedPermIds.includes(id))

    if (allChecked) {
      // Uncheck all in module
      setSelectedPermIds((prev) => prev.filter((id) => !permIdsInMod.includes(id)))
    } else {
      // Check all in module
      setSelectedPermIds((prev) => Array.from(new Set([...prev, ...permIdsInMod])))
    }
  }

  // Select all or deselect all
  const handleSelectAll = () => {
    if (!roleDetail) return
    if (selectedPermIds.length === roleDetail.allAvailablePermissions.length) {
      setSelectedPermIds([])
    } else {
      setSelectedPermIds(roleDetail.allAvailablePermissions.map((p) => p.id))
    }
  }

  // Save changes
  const handleSave = async () => {
    if (!selectedRoleId) return
    setSaving(true)
    try {
      await roleService.updateRolePermissions({
        roleId: selectedRoleId,
        permissionIds: selectedPermIds,
      })

      if (roleDetail) {
        const assignedCodes = roleDetail.allAvailablePermissions
          .filter((p) => selectedPermIds.includes(p.id))
          .map((p) => p.permissionCode)
        localStorage.setItem(`petcare.role_perms.${roleDetail.roleName}`, JSON.stringify(assignedCodes))
        localStorage.setItem(`petcare.role_perms.${selectedRoleId}`, JSON.stringify(assignedCodes))

        const currentUser = useAuthStore.getState().user
        if (currentUser?.roles?.includes(roleDetail.roleName)) {
          useAuthStore.getState().setPermissions(assignedCodes)
        }
      }

      message.success(`Permissions for "${roleDetail?.roleName || 'Role'}" saved successfully!`)
      // Refresh role list summary
      const updatedRoles = await roleService.getRoles()
      setRoles(updatedRoles)
    } catch (err) {
      message.error(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  // Filter grouped permissions by search term & module filter
  const filteredModules = useMemo(() => {
    const s = searchTerm.trim().toLowerCase()
    return modules.filter((mod) => {
      if (filterModule !== 'all' && mod !== filterModule) return false
      if (!s) return true
      const perms = groupedPermissions[mod] || []
      return (
        mod.toLowerCase().includes(s) ||
        perms.some(
          (p) =>
            p.permissionName.toLowerCase().includes(s) ||
            p.permissionCode.toLowerCase().includes(s)
        )
      )
    })
  }, [modules, groupedPermissions, filterModule, searchTerm])

  const selectedRoleObj = roles.find((r) => r.id === selectedRoleId)

  return (
    <section className="page wide">
      <div className="page-head">
        <div>
          <h1>Role & Permission Matrix</h1>
          <p className="page-subtitle">
            Configure system authorization, staff access levels, and functional permissions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSelectAll}
            disabled={loadingDetail || !roleDetail}
          >
            {roleDetail && selectedPermIds.length === roleDetail.allAvailablePermissions.length
              ? 'Deselect All'
              : 'Select All Permissions'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleSave}
            disabled={loadingDetail || saving || !roleDetail}
          >
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* LEFT COLUMN: Role Tabs / Selector */}
        <div className="table-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#0f172a' }}>
            System Roles
          </h3>

          {loadingRoles ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Spin />
              <p style={{ marginTop: '0.5rem', color: '#64748b' }}>Loading roles...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {roles.map((r) => {
                const isSelected = r.id === selectedRoleId
                const badgeColor = getRoleBadgeColor(r.roleName)

                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRoleId(r.id)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      border: `1.5px solid ${isSelected ? 'var(--primary)' : '#e2e8f0'}`,
                      background: isSelected ? '#ecfdf5' : '#ffffff',
                      boxShadow: isSelected ? '0 2px 8px rgba(5, 150, 105, 0.15)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.95rem', color: isSelected ? '#047857' : '#0f172a' }}>
                        {r.roleName}
                      </strong>
                      <Tag color={badgeColor} style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600 }}>
                        {r.totalPermissions ?? 0} perms
                      </Tag>
                    </div>
                    {r.description && (
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.35 }}>
                        {r.description}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Permission Assignment Matrix */}
        <div>
          {/* Top Filter Bar */}
          <div className="admin-toolbar-panel" style={{ marginBottom: '1.25rem' }}>
            <div className="admin-toolbar-row">
              <div className="search-wrapper" style={{ maxWidth: '380px' }}>
                <span className="search-icon-prefix" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Filter permissions by keyword or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button type="button" className="search-clear-btn" onClick={() => setSearchTerm('')}>
                    ✕
                  </button>
                )}
              </div>

              <div className="filter-dropdowns">
                <select
                  value={filterModule}
                  onChange={(e) => setFilterModule(e.target.value)}
                  aria-label="Filter by module"
                >
                  <option value="all">All Modules ({modules.length})</option>
                  {modules.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>

                <div style={{ padding: '0.4rem 0.8rem', background: '#f1f5f9', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                  {selectedPermIds.length} / {roleDetail?.allAvailablePermissions?.length || 0} Enabled
                </div>
              </div>
            </div>
          </div>

          {/* Permissions Matrix */}
          {loadingDetail ? (
            <div className="table-card" style={{ padding: '4rem', textAlign: 'center' }}>
              <Spin size="large" />
              <p style={{ marginTop: '1rem', color: '#64748b' }}>
                Loading permissions for {selectedRoleObj?.roleName || 'selected role'}...
              </p>
            </div>
          ) : !roleDetail || filteredModules.length === 0 ? (
            <div className="table-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ color: '#64748b', margin: 0 }}>
                No permissions matching your search or module filter.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {filteredModules.map((moduleName) => {
                const permsInMod = groupedPermissions[moduleName] || []
                const s = searchTerm.trim().toLowerCase()
                const visiblePerms = s
                  ? permsInMod.filter(
                      (p) =>
                        p.permissionName.toLowerCase().includes(s) ||
                        p.permissionCode.toLowerCase().includes(s)
                    )
                  : permsInMod

                if (visiblePerms.length === 0) return null

                const checkedCount = visiblePerms.filter((p) =>
                  selectedPermIds.includes(p.id)
                ).length
                const isAllModuleChecked = checkedCount === visiblePerms.length

                return (
                  <div
                    key={moduleName}
                    className="table-card"
                    style={{ padding: '1.25rem', overflow: 'hidden' }}
                  >
                    {/* Module Header */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                        paddingBottom: '0.75rem',
                        borderBottom: '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>📦</span>
                        <div>
                          <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>
                            {moduleName} Module
                          </strong>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem' }}>
                            ({checkedCount}/{visiblePerms.length} assigned)
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleModule(moduleName)}
                        style={{
                          background: isAllModuleChecked ? '#f1f5f9' : '#ecfdf5',
                          border: `1px solid ${isAllModuleChecked ? '#cbd5e1' : '#a7f3d0'}`,
                          color: isAllModuleChecked ? '#475569' : '#047857',
                          padding: '0.3rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {isAllModuleChecked ? 'Deselect Module' : 'Select All in Module'}
                      </button>
                    </div>

                    {/* Permissions Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '0.75rem',
                      }}
                    >
                      {visiblePerms.map((perm) => {
                        const isChecked = selectedPermIds.includes(perm.id)

                        return (
                          <div
                            key={perm.id}
                            onClick={() => handleTogglePerm(perm.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.65rem',
                              padding: '0.75rem',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              border: `1px solid ${isChecked ? '#059669' : '#e2e8f0'}`,
                              background: isChecked ? '#f0fdf4' : '#ffffff',
                              transition: 'all 0.12s ease',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by parent div onClick
                              style={{
                                marginTop: '3px',
                                accentColor: '#059669',
                                width: '16px',
                                height: '16px',
                                cursor: 'pointer',
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: isChecked ? '#047857' : '#0f172a' }}>
                                {perm.permissionName}
                              </div>
                              <code
                                style={{
                                  fontSize: '0.72rem',
                                  color: '#64748b',
                                  background: '#f1f5f9',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  display: 'inline-block',
                                  marginTop: '2px',
                                }}
                              >
                                {perm.permissionCode}
                              </code>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
