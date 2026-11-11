import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Select, Pagination, message } from 'antd';
import {
  PlusOutlined,
  HomeOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { roomTypeService, type RoomTypeDTO } from '@/services/roomType.service';
import { useAuthStore } from '@/store/useAuthStore';
import { hasPermission, PERMISSIONS } from '@/auth/permissionHelper';
import { getApiErrorMessage } from '@/utils/apiError';

const AdminRoomTypeListPage: React.FC = () => {
  const location = useLocation();
  const baseRoomTypePath = location.pathname.startsWith('/staff') ? '/staff/room-types' : '/admin/room-types';
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, PERMISSIONS.ROOM_MANAGE);

  const [data, setData] = useState<RoomTypeDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [roomTypeToDelete, setRoomTypeToDelete] = useState<RoomTypeDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoomTypes = async (search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await roomTypeService.fetchAll(search);
      if (res.isSuccess && res.result) {
        setData(res.result);
      } else {
        setError(res.message || 'Failed to fetch room types');
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomTypes(searchTerm);
  }, [searchTerm]);

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

  const handleConfirmDelete = async () => {
    if (!roomTypeToDelete) return;
    try {
      setDeleting(true);
      const res = await roomTypeService.delete(roomTypeToDelete.id);
      if (res.isSuccess) {
        message.success(`Room type "${roomTypeToDelete.name}" deleted successfully.`);
        setRoomTypeToDelete(null);
        fetchRoomTypes(searchTerm);
      } else {
        setError(res.message || 'Failed to delete room type');
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const hasActiveFilters = Boolean(searchTerm);

  const totalCount = data.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startEntry = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endEntry = Math.min(page * pageSize, totalCount);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

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
            Room Types Management
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0', color: '#8c735f', fontSize: '0.9rem' }}>
            {canManage
              ? 'Configure pet hotel suites, accommodations, and room category capacities.'
              : 'View and explore sanctuary boarding suite types.'}
          </p>
        </div>
        {canManage && (
          <Link
            to={`${baseRoomTypePath}/new`}
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
            <span>Add Room Type</span>
          </Link>
        )}
      </div>

      <div className="admin-toolbar-panel">
        <div className="admin-toolbar-row">
          <form className="search-wrapper" onSubmit={onSearch}>
            <span className="search-icon-prefix" aria-hidden="true">
              <SearchOutlined style={{ color: '#8c735f' }} />
            </span>
            <input
              type="text"
              placeholder="Search room types by name or amenities..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              aria-label="Search room types"
            />
            {keywordInput && (
              <button type="button" className="search-clear-btn" onClick={clearSearch} title="Clear search">
                ✕
              </button>
            )}
          </form>

          <div className="filter-dropdowns" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                onClick={clearSearch}
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

      <div className="table-card">
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="col-idx">#</th>
                <th style={{ width: 70 }}>SUITE PHOTO</th>
                <th className="col-name">ROOM TYPE NAME</th>
                <th>AMENITIES & DESCRIPTION</th>
                <th style={{ textAlign: 'center' }}>TOTAL ROOMS</th>
                <th className="col-actions">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                    <p style={{ margin: 0, color: '#785839', fontWeight: 600 }}>Loading suite categories...</p>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="table-empty-box">
                      <h3>No matching room types found</h3>
                      <p>
                        {hasActiveFilters
                          ? 'Try adjusting your search query to find what you are looking for.'
                          : 'No room types configured in the sanctuary database yet.'}
                      </p>
                      {hasActiveFilters ? (
                        <button type="button" className="btn" onClick={clearSearch}>
                          Clear filters
                        </button>
                      ) : canManage ? (
                        <Link to={`${baseRoomTypePath}/new`} className="btn">
                          + Add first room type
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((c, idx) => {
                  const rowNumber = (page - 1) * pageSize + idx + 1;
                  return (
                    <tr key={c.id}>
                      <td className="col-idx">{rowNumber}</td>
                      <td>
                        {c.imageUrl ? (
                          <img
                            src={c.imageUrl}
                            alt={c.name}
                            style={{
                              width: 54,
                              height: 42,
                              borderRadius: '8px',
                              objectFit: 'cover',
                              border: '1.5px solid #eeddc8',
                              display: 'block',
                              backgroundColor: '#faf6f0',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 54,
                              height: 42,
                              borderRadius: '8px',
                              backgroundColor: '#faf6f0',
                              border: '1.5px solid #eeddc8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#785839',
                              fontSize: '1.1rem',
                            }}
                          >
                            <HomeOutlined />
                          </div>
                        )}
                      </td>
                      <td className="col-name">
                        <Link
                          to={`${baseRoomTypePath}/${c.id}`}
                          style={{
                            display: 'block',
                            color: '#3d2d23',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            textDecoration: 'none',
                          }}
                        >
                          {c.name}
                        </Link>
                        <span style={{ fontSize: '0.75rem', color: '#8c735f' }}>
                          ID: {c.id.slice(0, 8)}...
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#554236', fontSize: '0.88rem', lineHeight: 1.5 }}>
                          {c.description ? (
                            c.description.length > 80 ? c.description.slice(0, 80) + '...' : c.description
                          ) : (
                            <span style={{ color: '#998373', fontStyle: 'italic' }}>No description</span>
                          )}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 12px',
                            borderRadius: 999,
                            backgroundColor: '#ecfdf5',
                            color: '#047857',
                            border: '1px solid #a7f3d0',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                          }}
                        >
                          <HomeOutlined />
                          <span>{c.totalRooms} Rooms</span>
                        </span>
                      </td>
                      <td className="col-actions">
                        <div className="action-group">
                          <Link
                            to={`${baseRoomTypePath}/${c.id}`}
                            className="btn-action view"
                            title="View suite details"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '4px 10px',
                              borderRadius: 6,
                              fontSize: '0.82rem',
                            }}
                          >
                            <EyeOutlined style={{ fontSize: 12 }} />
                            <span>View</span>
                          </Link>

                          {canManage && (
                            <>
                              <Link
                                to={`${baseRoomTypePath}/${c.id}/edit`}
                                className="btn-action edit"
                                title="Edit suite specifications"
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
                                title="Delete suite category"
                                onClick={() => setRoomTypeToDelete(c)}
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
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalCount > 0 && (
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
              Showing {startEntry} to {endEntry} of {totalCount} room types
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

      {roomTypeToDelete && (
        <div className="confirm-backdrop">
          <div className="confirm-dialog" role="dialog" aria-modal="true">
            <div className="confirm-icon danger">⚠️</div>
            <h3>Delete Room Type?</h3>
            <p>
              Are you sure you want to delete suite category <strong>"{roomTypeToDelete.name}"</strong>?
              <br />
              This action cannot be undone and will permanently remove this category.
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={deleting}
                onClick={() => setRoomTypeToDelete(null)}
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
    </section>
  );
};

export default AdminRoomTypeListPage;
