import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Select, Pagination, message } from 'antd';
import {
  PlusOutlined,
  HomeOutlined,
  EditOutlined,
  DeleteOutlined,
  SwapOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { roomService, type RoomDTO } from '@/services/room.service';
import { roomTypeService, type RoomTypeDTO } from '@/services/roomType.service';
import { useAuthStore } from '@/store/useAuthStore';
import { hasPermission, PERMISSIONS } from '@/auth/permissionHelper';
import { getApiErrorMessage } from '@/utils/apiError';

const AdminRoomListPage: React.FC = () => {
  const location = useLocation();
  const baseRoomPath = location.pathname.startsWith('/staff') ? '/staff/rooms' : '/admin/rooms';
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, PERMISSIONS.ROOM_MANAGE);

  const [data, setData] = useState<IPagedResult<RoomDTO> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [status, setStatus] = useState<string>('');
  const [roomTypeIdFilter, setRoomTypeIdFilter] = useState<string>('');
  const [roomTypes, setRoomTypes] = useState<RoomTypeDTO[]>([]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [roomToDelete, setRoomToDelete] = useState<RoomDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [roomToToggle, setRoomToToggle] = useState<RoomDTO | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    roomTypeService
      .fetchAll()
      .then((res) => {
        if (res.isSuccess && res.result) {
          setRoomTypes(res.result);
        }
      })
      .catch((err) => console.error('Failed to load room types:', err));
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await roomService.fetchWithPagination({
        pageNumber: page,
        pageSize,
        searchTerm: searchTerm.trim() || undefined,
        status: status || undefined,
        roomTypeId: roomTypeIdFilter || undefined,
      });
      if (res.isSuccess && res.result) {
        setData(res.result);
      } else {
        setError(res.message || 'Failed to fetch rooms');
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [page, pageSize, searchTerm, status, roomTypeIdFilter]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchTerm(keywordInput.trim());
  };

  const clearSearch = () => {
    setKeywordInput('');
    setSearchTerm('');
    setPage(1);
  };

  const resetAllFilters = () => {
    setKeywordInput('');
    setSearchTerm('');
    setStatus('');
    setRoomTypeIdFilter('');
    setPage(1);
  };

  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;
    try {
      setDeleting(true);
      const res = await roomService.delete(roomToDelete.id);
      if (res.isSuccess) {
        message.success(`Room "${roomToDelete.roomName}" deleted successfully.`);
        setRoomToDelete(null);
        fetchRooms();
      } else {
        setError(res.message || 'Failed to delete room');
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!roomToToggle) return;
    const newStatus = roomToToggle.status === 'Available' ? 'Maintenance' : 'Available';
    try {
      setToggling(true);
      const res = await roomService.updateStatus(roomToToggle.id, newStatus);
      if (res.isSuccess) {
        message.success(`Room "${roomToToggle.roomName}" status updated to ${newStatus}.`);
        setRoomToToggle(null);
        fetchRooms();
      } else {
        setError(res.message || 'Failed to update room status');
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setToggling(false);
    }
  };

  const hasActiveFilters = Boolean(searchTerm || status || roomTypeIdFilter);

  const totalCount = data?.totalCount ?? 0;
  const startEntry = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endEntry = Math.min(page * pageSize, totalCount);

  return (
    <section className="page wide">
      {/* Page Header */}
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
            Rooms Management
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0', color: '#8c735f', fontSize: '0.9rem' }}>
            {canManage
              ? 'View, search, filter, and manage individual boarding suite units and operational statuses.'
              : 'Explore sanctuary boarding units and real-time suite occupancy.'}
          </p>
        </div>
        {canManage && (
          <Link
            to={`${baseRoomPath}/new`}
            className="btn"
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
              textDecoration: 'none',
            }}
          >
            <PlusOutlined style={{ fontSize: 13 }} />
            <span>Add Room</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Panel */}
      <div className="admin-toolbar-panel">
        <div className="admin-toolbar-row">
          <form className="search-wrapper" onSubmit={onSearch}>
            <span className="search-icon-prefix" aria-hidden="true">
              <SearchOutlined style={{ color: '#8c735f' }} />
            </span>
            <input
              type="text"
              placeholder="Search rooms by name..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              aria-label="Search rooms"
            />
            {keywordInput && (
              <button type="button" className="search-clear-btn" onClick={clearSearch} title="Clear search">
                ✕
              </button>
            )}
          </form>

          <div className="filter-dropdowns" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Room Type Filter */}
            <Select
              value={roomTypeIdFilter}
              onChange={(val) => {
                setPage(1);
                setRoomTypeIdFilter(val);
              }}
              style={{ minWidth: 160, height: 40 }}
              options={[
                { value: '', label: 'All Room Types' },
                ...roomTypes.map((rt) => ({ value: rt.id, label: rt.name })),
              ]}
            />

            {/* Status Filter */}
            <Select
              value={status}
              onChange={(val) => {
                setPage(1);
                setStatus(val);
              }}
              style={{ minWidth: 140, height: 40 }}
              options={[
                { value: '', label: 'All statuses' },
                { value: 'Available', label: 'Available' },
                { value: 'Maintenance', label: 'Maintenance' },
                { value: 'Occupied', label: 'Occupied' },
              ]}
            />

            {/* Page Size Filter */}
            <Select
              value={pageSize}
              onChange={(val) => {
                setPage(1);
                setPageSize(val);
              }}
              style={{ minWidth: 130, height: 40 }}
              options={[
                { value: 10, label: '10 per page' },
                { value: 25, label: '25 per page' },
                { value: 50, label: '50 per page' },
              ]}
            />

            {hasActiveFilters && (
              <button
                type="button"
                className="chip"
                onClick={resetAllFilters}
                title="Reset all filters"
                style={{
                  height: 40,
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: 10,
                  border: '1.5px solid #eeddc8',
                  background: '#ffffff',
                  color: '#785839',
                  fontWeight: 600,
                  padding: '0 14px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <p className="msg error" role="alert">{error}</p>}

      {/* Main Data Table */}
      <div className="table-card">
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="col-idx">#</th>
                <th className="col-name">ROOM NAME</th>
                <th>ROOM CATEGORY</th>
                <th className="col-status">STATUS</th>
                <th className="col-actions">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                    <p style={{ margin: 0, color: '#785839', fontWeight: 600 }}>Loading sanctuary rooms...</p>
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="table-empty-box">
                      <h3>No matching rooms found</h3>
                      <p>
                        {hasActiveFilters
                          ? 'Try adjusting your search query or filters to find what you are looking for.'
                          : 'No physical rooms configured in the system yet.'}
                      </p>
                      {hasActiveFilters ? (
                        <button type="button" className="btn" onClick={resetAllFilters}>
                          Clear filters
                        </button>
                      ) : canManage ? (
                        <Link to={`${baseRoomPath}/new`} className="btn">
                          + Add first room
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((r, idx) => {
                  const rowNumber = (page - 1) * pageSize + idx + 1;
                  return (
                    <tr key={r.id}>
                      <td className="col-idx">{rowNumber}</td>
                      <td className="col-name">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                              fontSize: '0.95rem',
                              flexShrink: 0,
                            }}
                          >
                            <HomeOutlined />
                          </div>
                          <div>
                            <span style={{ fontWeight: 700, color: '#3d2d23', fontSize: '0.94rem' }}>
                              {r.roomName}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 12px',
                            borderRadius: 999,
                            backgroundColor: '#faf6f0',
                            border: '1px solid #eeddc8',
                            color: '#785839',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                          }}
                        >
                          <HomeOutlined style={{ fontSize: 11 }} />
                          <span>{r.roomTypeName || 'Suite Category'}</span>
                        </span>
                      </td>
                      <td className="col-status">
                        {r.status === 'Available' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '3px 12px',
                              borderRadius: 999,
                              backgroundColor: '#ecfdf5',
                              color: '#047857',
                              border: '1px solid #a7f3d0',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
                            Available
                          </span>
                        ) : r.status === 'Maintenance' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '3px 12px',
                              borderRadius: 999,
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                            Maintenance
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '3px 12px',
                              borderRadius: 999,
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              border: '1px solid #fde68a',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                            {r.status || 'Occupied'}
                          </span>
                        )}
                      </td>
                      <td className="col-actions">
                        {canManage ? (
                          <div className="action-group">
                            <button
                              type="button"
                              className="btn-action view"
                              title={`Toggle status (currently ${r.status})`}
                              onClick={() => setRoomToToggle(r)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: '0.82rem',
                              }}
                            >
                              <SwapOutlined style={{ fontSize: 12 }} />
                              <span>Toggle</span>
                            </button>

                            <Link
                              to={`${baseRoomPath}/${r.id}/edit`}
                              className="btn-action edit"
                              title="Edit room"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: '0.82rem',
                              }}
                            >
                              <EditOutlined style={{ fontSize: 12 }} />
                              <span>Edit</span>
                            </Link>

                            <button
                              type="button"
                              className="btn-action danger"
                              title="Delete room"
                              onClick={() => setRoomToDelete(r)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: '0.82rem',
                              }}
                            >
                              <DeleteOutlined style={{ fontSize: 12 }} />
                              <span>Delete</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic' }}>View only</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        {data && totalCount > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              backgroundColor: '#ffffff',
              borderTop: '1px solid #eeddc8',
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <span style={{ fontSize: '0.88rem', color: '#785839', fontWeight: 600 }}>
              Showing {startEntry} to {endEntry} of {totalCount} rooms
            </span>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={totalCount}
              onChange={(newPage) => setPage(newPage)}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>

      {/* Delete Room Confirmation Dialog */}
      {roomToDelete && (
        <div className="confirm-backdrop">
          <div className="confirm-dialog" role="dialog" aria-modal="true">
            <div className="confirm-icon danger">⚠️</div>
            <h3>Delete Room?</h3>
            <p>
              Are you sure you want to delete room <strong>"{roomToDelete.roomName}"</strong>?
              <br />
              This action cannot be undone and will permanently remove this room unit.
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={deleting}
                onClick={() => setRoomToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-action danger"
                disabled={deleting}
                onClick={handleConfirmDelete}
                style={{ padding: '0.65rem 1.4rem', color: '#fff' }}
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Status Confirmation Dialog */}
      {roomToToggle && (
        <div className="confirm-backdrop">
          <div className="confirm-dialog" role="dialog" aria-modal="true">
            <div
              className="confirm-icon"
              style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}
            >
              🔄
            </div>
            <h3>Change Room Status?</h3>
            <p>
              Are you sure you want to change the status of <strong>"{roomToToggle.roomName}"</strong> from{' '}
              <strong style={{ color: '#3d2d23' }}>{roomToToggle.status}</strong> to{' '}
              <strong style={{ color: '#3d2d23' }}>
                {roomToToggle.status === 'Available' ? 'Maintenance' : 'Available'}
              </strong>?
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={toggling}
                onClick={() => setRoomToToggle(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-action"
                disabled={toggling}
                onClick={handleConfirmToggleStatus}
                style={{ backgroundColor: '#3d2d23', color: '#ffffff', padding: '0.65rem 1.4rem' }}
              >
                {toggling ? 'Updating...' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminRoomListPage;
