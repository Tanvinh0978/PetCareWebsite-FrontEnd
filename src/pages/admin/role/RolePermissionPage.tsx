import React, { useEffect, useState, useMemo } from 'react';
import { Spin, message } from 'antd';
import {
  SaveOutlined,
  CheckOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { roleService } from '@/services/role.service';
import type { RoleDTO, RolePermissionDetailDTO, PermissionDTO } from '@/types/role.types';
import { getApiErrorMessage } from '@/utils/apiError';
import { useAuthStore } from '@/store/useAuthStore';

const getRoleBadgeStyle = (roleName: string) => {
  const lower = roleName.toLowerCase();
  if (lower.includes('admin')) {
    return { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' };
  }
  if (lower.includes('receptionist')) {
    return { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' };
  }
  if (lower.includes('boarding')) {
    return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
  }
  if (lower.includes('grooming')) {
    return { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' };
  }
  return { bg: '#faf6f0', color: '#785839', border: '#eeddc8' };
};

export default function RolePermissionPage() {
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  const [roleDetail, setRoleDetail] = useState<RolePermissionDetailDTO | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoadingRoles(true);
    roleService
      .getRoles()
      .then((data) => {
        if (!cancelled) {
          setRoles(data);
          if (data.length > 0 && !selectedRoleId) {
            setSelectedRoleId(data[0].id);
          }
        }
      })
      .catch((err) => {
        console.warn('Backend roles error, using defaults:', err);
        if (!cancelled) {
          const fallback = [
            { id: 'A0000000-0000-0000-0000-000000000001', roleName: 'Admin', description: 'System Administrator', totalPermissions: 24 },
            { id: 'A0000000-0000-0000-0000-000000000002', roleName: 'Receptionist', description: 'Front desk intake, scheduling & billing', totalPermissions: 14 },
            { id: 'A0000000-0000-0000-0000-000000000003', roleName: 'Boarding Staff', description: 'Hotel facility & daily care log', totalPermissions: 9 },
            { id: 'A0000000-0000-0000-0000-000000000004', roleName: 'Grooming Staff', description: 'Spa styling & grooming task updates', totalPermissions: 4 },
          ];
          setRoles(fallback);
          setSelectedRoleId(fallback[0].id);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRoles(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedRoleId) return;
    let cancelled = false;
    setLoadingDetail(true);

    roleService
      .getRolePermissions(selectedRoleId)
      .then((detail) => {
        if (!cancelled) {
          setRoleDetail(detail);
          setSelectedPermIds(detail.assignedPermissions.map((p) => p.id));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          message.error(getApiErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRoleId]);

  const { modules, groupedPermissions } = useMemo(() => {
    if (!roleDetail?.allAvailablePermissions) {
      return { modules: [], groupedPermissions: {} as Record<string, PermissionDTO[]> };
    }

    const groups: Record<string, PermissionDTO[]> = {};
    roleDetail.allAvailablePermissions.forEach((p) => {
      const mod = p.moduleName || 'General';
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(p);
    });

    const mods = Object.keys(groups).sort();
    return { modules: mods, groupedPermissions: groups };
  }, [roleDetail]);

  const handleTogglePerm = (permId: string) => {
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleToggleModule = (moduleName: string) => {
    const permsInMod = groupedPermissions[moduleName] || [];
    const permIdsInMod = permsInMod.map((p) => p.id);
    const allChecked = permIdsInMod.every((id) => selectedPermIds.includes(id));

    if (allChecked) {
      setSelectedPermIds((prev) => prev.filter((id) => !permIdsInMod.includes(id)));
    } else {
      setSelectedPermIds((prev) => Array.from(new Set([...prev, ...permIdsInMod])));
    }
  };

  const handleSelectAll = () => {
    if (!roleDetail) return;
    if (selectedPermIds.length === roleDetail.allAvailablePermissions.length) {
      setSelectedPermIds([]);
    } else {
      setSelectedPermIds(roleDetail.allAvailablePermissions.map((p) => p.id));
    }
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      await roleService.updateRolePermissions({
        roleId: selectedRoleId,
        permissionIds: selectedPermIds,
      });

      if (roleDetail) {
        const assignedCodes = roleDetail.allAvailablePermissions
          .filter((p) => selectedPermIds.includes(p.id))
          .map((p) => p.permissionCode);
        localStorage.setItem(`petcare.role_perms.${roleDetail.roleName}`, JSON.stringify(assignedCodes));
        localStorage.setItem(`petcare.role_perms.${selectedRoleId}`, JSON.stringify(assignedCodes));

        const currentUser = useAuthStore.getState().user;
        if (currentUser?.roles?.includes(roleDetail.roleName)) {
          useAuthStore.getState().setPermissions(assignedCodes);
        }
      }

      message.success(`Permissions for "${roleDetail?.roleName || 'Role'}" saved successfully!`);
      const updatedRoles = await roleService.getRoles();
      setRoles(updatedRoles);
    } catch (err) {
      message.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const filteredModules = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    if (!s) return modules;
    return modules.filter((mod) => {
      const perms = groupedPermissions[mod] || [];
      return (
        mod.toLowerCase().includes(s) ||
        perms.some(
          (p) =>
            p.permissionName.toLowerCase().includes(s) ||
            p.permissionCode.toLowerCase().includes(s)
        )
      );
    });
  }, [modules, groupedPermissions, searchTerm]);

  const selectedRoleObj = roles.find((r) => r.id === selectedRoleId);

  return (
    <section className="page wide">
      <div className="page-head">
        <div>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '2.1rem',
              color: '#3d2d23',
              fontWeight: 700,
            }}
          >
            Role & Permission Matrix
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0', color: '#8c735f', fontSize: '0.9rem' }}>
            Configure sanctuary authorization levels, staff role boundaries, and operational access rights.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={loadingDetail || !roleDetail}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '0.55rem 1.25rem',
              borderRadius: 999,
              backgroundColor: '#ffffff',
              border: '1.5px solid #eeddc8',
              color: '#785839',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: loadingDetail || !roleDetail ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 3px rgba(61,45,35,0.04)',
              transition: 'all 0.2s ease',
            }}
          >
            <CheckOutlined style={{ fontSize: 13 }} />
            <span>
              {roleDetail && selectedPermIds.length === roleDetail.allAvailablePermissions.length
                ? 'Deselect All'
                : 'Select All Permissions'}
            </span>
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleSave}
            disabled={loadingDetail || saving || !roleDetail}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '0.55rem 1.4rem',
              borderRadius: 999,
              backgroundColor: '#3d2d23',
              color: '#ffffff',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(61,45,35,0.18)',
              cursor: loadingDetail || saving || !roleDetail ? 'not-allowed' : 'pointer',
              opacity: loadingDetail || saving || !roleDetail ? 0.7 : 1,
              border: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <SaveOutlined style={{ fontSize: 14 }} />
            <span>{saving ? 'Saving changes...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #eeddc8',
            borderRadius: '16px',
            padding: '1.4rem',
            boxShadow: '0 4px 20px rgba(61, 45, 35, 0.04)',
          }}
        >
          <h3
            style={{
              margin: '0 0 1rem 0',
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '1.25rem',
              color: '#3d2d23',
              fontWeight: 700,
            }}
          >
            System Roles
          </h3>

          {loadingRoles ? (
            <div style={{ textAlign: 'center', padding: '2.5rem' }}>
              <Spin />
              <p style={{ marginTop: '0.75rem', color: '#8c735f', fontWeight: 600 }}>Loading roles...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {roles.map((r) => {
                const isSelected = r.id === selectedRoleId;
                const badgeStyle = getRoleBadgeStyle(r.roleName);

                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRoleId(r.id)}
                    style={{
                      padding: '1rem 1.15rem',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #785839' : '1.5px solid #eeddc8',
                      backgroundColor: isSelected ? '#fcf9f5' : '#ffffff',
                      boxShadow: isSelected ? '0 4px 14px rgba(120, 88, 57, 0.12)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '6px',
                      }}
                    >
                      <strong style={{ fontSize: '0.98rem', color: isSelected ? '#3d2d23' : '#554236' }}>
                        {r.roleName}
                      </strong>
                      <span
                        style={{
                          padding: '2px 9px',
                          borderRadius: 999,
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          backgroundColor: badgeStyle.bg,
                          color: badgeStyle.color,
                          border: `1px solid ${badgeStyle.border}`,
                        }}
                      >
                        {r.totalPermissions ?? 0} perms
                      </span>
                    </div>
                    {r.description && (
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#8c735f', lineHeight: 1.4 }}>
                        {r.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div className="search-wrapper" style={{ maxWidth: '380px', flex: 1 }}>
              <span className="search-icon-prefix" aria-hidden="true">
                <SearchOutlined style={{ color: '#8c735f' }} />
              </span>
              <input
                type="text"
                placeholder="Search permissions by keyword or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Filter permissions"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div
              style={{
                padding: '0.5rem 1.15rem',
                backgroundColor: '#faf6f0',
                border: '1.5px solid #eeddc8',
                borderRadius: 999,
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#785839',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <SafetyCertificateOutlined style={{ color: '#785839', fontSize: 15 }} />
              <span>
                {selectedPermIds.length} / {roleDetail?.allAvailablePermissions?.length || 0} Permissions Enabled
              </span>
            </div>
          </div>

          {loadingDetail ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #eeddc8',
                borderRadius: '16px',
                padding: '4rem 2rem',
                textAlign: 'center',
              }}
            >
              <Spin size="large" />
              <p style={{ marginTop: '1rem', color: '#8c735f', fontWeight: 600 }}>
                Loading permissions for {selectedRoleObj?.roleName || 'selected role'}...
              </p>
            </div>
          ) : !roleDetail || filteredModules.length === 0 ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #eeddc8',
                borderRadius: '16px',
                padding: '3rem 2rem',
                textAlign: 'center',
              }}
            >
              <p style={{ color: '#8c735f', margin: 0, fontWeight: 600 }}>
                No permissions matching your search query.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {filteredModules.map((moduleName) => {
                const permsInMod = groupedPermissions[moduleName] || [];
                const s = searchTerm.trim().toLowerCase();
                const visiblePerms = s
                  ? permsInMod.filter(
                      (p) =>
                        p.permissionName.toLowerCase().includes(s) ||
                        p.permissionCode.toLowerCase().includes(s)
                    )
                  : permsInMod;

                if (visiblePerms.length === 0) return null;

                const checkedCount = visiblePerms.filter((p) =>
                  selectedPermIds.includes(p.id)
                ).length;
                const isAllModuleChecked = checkedCount === visiblePerms.length;

                return (
                  <div
                    key={moduleName}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #eeddc8',
                      borderRadius: '16px',
                      padding: '1.4rem 1.5rem',
                      boxShadow: '0 2px 12px rgba(61,45,35,0.03)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1.1rem',
                        paddingBottom: '0.85rem',
                        borderBottom: '1px solid #f1ece5',
                        flexWrap: 'wrap',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            backgroundColor: '#faf6f0',
                            border: '1.5px solid #eeddc8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#785839',
                            fontSize: '1rem',
                            flexShrink: 0,
                          }}
                        >
                          <SafetyCertificateOutlined />
                        </div>
                        <div>
                          <strong style={{ fontSize: '1.05rem', color: '#3d2d23' }}>
                            {moduleName} Module
                          </strong>
                          <span style={{ fontSize: '0.82rem', color: '#8c735f', marginLeft: '0.65rem' }}>
                            ({checkedCount}/{visiblePerms.length} assigned)
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleModule(moduleName)}
                        style={{
                          background: isAllModuleChecked ? '#ffffff' : '#3d2d23',
                          border: isAllModuleChecked ? '1.5px solid #eeddc8' : 'none',
                          color: isAllModuleChecked ? '#785839' : '#ffffff',
                          padding: '0.35rem 0.95rem',
                          borderRadius: 999,
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: isAllModuleChecked ? 'none' : '0 2px 8px rgba(61,45,35,0.15)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isAllModuleChecked ? 'Deselect Module' : 'Select All in Module'}
                      </button>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '0.85rem',
                      }}
                    >
                      {visiblePerms.map((perm) => {
                        const isChecked = selectedPermIds.includes(perm.id);

                        return (
                          <div
                            key={perm.id}
                            onClick={() => handleTogglePerm(perm.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.75rem',
                              padding: '0.85rem 0.95rem',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              border: isChecked ? '1.5px solid #785839' : '1px solid #eeddc8',
                              backgroundColor: isChecked ? '#fcf9f5' : '#ffffff',
                              boxShadow: isChecked ? '0 2px 8px rgba(120,88,57,0.08)' : 'none',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              style={{
                                marginTop: '3px',
                                accentColor: '#3d2d23',
                                width: '16px',
                                height: '16px',
                                cursor: 'pointer',
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: '0.88rem',
                                  color: isChecked ? '#3d2d23' : '#554236',
                                }}
                              >
                                {perm.permissionName}
                              </div>
                              <code
                                style={{
                                  fontSize: '0.72rem',
                                  color: '#785839',
                                  backgroundColor: '#faf6f0',
                                  border: '1px solid #eeddc8',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  display: 'inline-block',
                                  marginTop: '4px',
                                  fontFamily: 'monospace',
                                }}
                              >
                                {perm.permissionCode}
                              </code>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
