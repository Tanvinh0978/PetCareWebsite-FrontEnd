import React, { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Select, Pagination, message } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { DogIcon, CatIcon } from '@/components/common/PetIcons';
import { petService } from '@/services/pet.service';
import type { PetDTO } from '@/types/pet.types';
import { PetSpecies, isCat } from '@/types/pet.types';
import { getApiErrorMessage } from '@/utils/apiError';

interface PetManagementTableProps {
  basePath: string;
  title?: string;
  subtitle?: string;
}

export const PetManagementTable: React.FC<PetManagementTableProps> = ({
  basePath,
  title = 'Pet Management',
  subtitle = 'Comprehensive view of all customer pets registered in the PetCare system.',
}) => {
  const navigate = useNavigate();

  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [species, setSpecies] = useState<'all' | 'dog' | 'cat'>('all');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reload, setReload] = useState(0);

  const [data, setData] = useState<IPagedResult<PetDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [petToDelete, setPetToDelete] = useState<PetDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const speciesParam =
      species === 'dog' ? PetSpecies.Dog : species === 'cat' ? PetSpecies.Cat : undefined;
    const activeParam =
      status === 'all' ? undefined : status === 'active';

    petService
      .fetchWithPagination({
        keyword: keyword || undefined,
        species: speciesParam,
        pageIndex: page,
        pageSize,
        isActive: activeParam,
      })
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setError('');
        }
      })
      .catch((e) => {
        if (!cancelled) setError(getApiErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, pageSize, keyword, species, status, reload]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setKeyword(keywordInput.trim());
  };

  const clearSearch = () => {
    setKeywordInput('');
    setKeyword('');
    setPage(1);
  };

  const resetAllFilters = () => {
    setKeywordInput('');
    setKeyword('');
    setSpecies('all');
    setStatus('all');
    setPage(1);
  };

  const hasActiveFilters = Boolean(keyword || species !== 'all' || status !== 'all');

  const handleConfirmDelete = async () => {
    if (!petToDelete) return;
    setDeleting(true);
    try {
      await petService.delete(petToDelete.id);
      message.success(`Pet "${petToDelete.name}" marked as inactive.`);
      setPetToDelete(null);
      setReload((n) => n + 1);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

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
            {title}
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0', color: '#8c735f', fontSize: '0.9rem' }}>
            {subtitle}
          </p>
        </div>
        <Link
          to={`${basePath}/new`}
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
          <span>Add Pet</span>
        </Link>
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
              placeholder="Search pets by name..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              aria-label="Search pets by name"
            />
            {keywordInput && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={clearSearch}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </form>

          <div className="filter-dropdowns" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Species Dropdown */}
            <Select
              value={species}
              onChange={(val) => {
                setPage(1);
                setSpecies(val);
              }}
              style={{ minWidth: 135, height: 40 }}
              options={[
                { value: 'all', label: 'All species' },
                { value: 'dog', label: 'Dogs' },
                { value: 'cat', label: 'Cats' },
              ]}
            />

            {/* Status Dropdown */}
            <Select
              value={status}
              onChange={(val) => {
                setPage(1);
                setStatus(val);
              }}
              style={{ minWidth: 140, height: 40 }}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'active', label: 'Active only' },
                { value: 'inactive', label: 'Inactive only' },
              ]}
            />

            {/* Page Size Dropdown */}
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

      {error && (
        <p className="msg error" role="alert">
          {error}
        </p>
      )}

      {/* Main Data Table */}
      <div className="table-card">
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="col-idx">#</th>
                <th className="col-name">PET NAME</th>
                <th>SPECIES</th>
                <th>BREED</th>
                <th>WEIGHT</th>
                <th>AGE</th>
                <th className="col-status">STATUS</th>
                <th className="col-actions">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{ textAlign: 'center', padding: '3.5rem 1rem' }}
                  >
                    <p style={{ margin: 0, color: '#785839', fontWeight: 600 }}>
                      Loading sanctuary pets...
                    </p>
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="table-empty-box">
                      <h3>No matching pets found</h3>
                      <p>
                        {hasActiveFilters
                          ? 'Try adjusting your search query or filters to find what you are looking for.'
                          : 'No pets have been registered in the sanctuary database yet.'}
                      </p>
                      {hasActiveFilters ? (
                        <button
                          type="button"
                          className="btn"
                          onClick={resetAllFilters}
                        >
                          Clear filters
                        </button>
                      ) : (
                        <Link to={`${basePath}/new`} className="btn">
                          + Add first pet
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((pet, idx) => {
                  const rowNumber = (page - 1) * pageSize + idx + 1;
                  const isPetCat = isCat(pet.species);
                  const speciesLabel = isPetCat ? 'Cat' : 'Dog';
                  const speciesIcon = isPetCat ? <CatIcon size={16} /> : <DogIcon size={16} />;

                  return (
                    <tr
                      key={pet.id}
                      className={pet.isActive ? '' : 'row-inactive'}
                    >
                      <td className="col-idx">{rowNumber}</td>
                      <td className="col-name">
                        <Link
                          to={`${basePath}/${pet.id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontWeight: 700,
                            color: '#3d2d23',
                            textDecoration: 'none',
                          }}
                          title="View pet details"
                        >
                          {pet.imageUrl ? (
                            <img
                              src={pet.imageUrl}
                              alt={pet.name}
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '1.5px solid #eeddc8',
                                display: 'block',
                                flexShrink: 0,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                backgroundColor: '#faf6f0',
                                border: '1.5px solid #eeddc8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {speciesIcon}
                            </div>
                          )}
                          <span style={{ fontSize: '0.94rem' }}>{pet.name}</span>
                        </Link>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: isPetCat ? '#faf5ff' : '#f0f9ff',
                            color: isPetCat ? '#7e22ce' : '#0284c7',
                            border: `1px solid ${isPetCat ? '#e9d5ff' : '#bae6fd'}`,
                          }}
                        >
                          {isPetCat ? <CatIcon size={13} /> : <DogIcon size={13} />}
                          <span>{speciesLabel}</span>
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#554236', fontSize: '0.88rem' }}>
                          {pet.breed || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#554236', fontSize: '0.88rem', fontWeight: 600 }}>
                          {pet.weight ? `${pet.weight} kg` : '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#554236', fontSize: '0.88rem' }}>
                          {pet.age !== undefined && pet.age !== null ? `${pet.age} yr` : '—'}
                        </span>
                      </td>
                      <td className="col-status">
                        {pet.isActive ? (
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
                            Active
                          </span>
                        ) : (
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
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="col-actions">
                        <div className="action-group">
                          <Link
                            to={`${basePath}/${pet.id}`}
                            className="btn-action view"
                            title="View pet details"
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
                          <Link
                            to={`${basePath}/${pet.id}/edit`}
                            className="btn-action edit"
                            title="Edit pet"
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
                          {pet.isActive && (
                            <button
                              type="button"
                              className="btn-action danger"
                              onClick={() => setPetToDelete(pet)}
                              title="Delete pet"
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

        {/* Table Footer with Pagination */}
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
              Showing {startEntry} to {endEntry} of {totalCount} pets
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

      {/* Delete Confirmation Dialog */}
      {petToDelete && (
        <div className="confirm-backdrop">
          <div className="confirm-dialog" role="dialog" aria-modal="true">
            <div className="confirm-icon danger">⚠️</div>
            <h3>Delete Pet?</h3>
            <p>
              Are you sure you want to delete{' '}
              <strong>"{petToDelete.name}"</strong>?
              <br />
              The pet record will be marked as inactive in the sanctuary system.
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={deleting}
                onClick={() => setPetToDelete(null)}
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

export default PetManagementTable;
