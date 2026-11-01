import { DogIcon, CatIcon } from '@/components/common/PetIcons'
import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Empty,
  Input,
  Modal,
  Pagination,
  Row,
  Spin,
  Tooltip,
  message,
} from 'antd'
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  FileTextOutlined,
  HeartOutlined,
  HomeOutlined,
  PhoneOutlined,
  ReloadOutlined,
  UserOutlined,
  LeftOutlined,
  RightOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import boardingTaskService from '@/services/boardingTask.service'
import type { BoardingTaskResponseDTO } from '@/types/boardingTask.types'
import { normalizeStatus } from '@/types/groomingTask.types'
import CreateCareRecordModal from '@/components/staff/boarding/CreateCareRecordModal'
import CareRecordTimelineModal from '@/components/staff/boarding/CareRecordTimelineModal'

const { TextArea } = Input

type ViewTab = 'assigned' | 'active'

interface StatusStyle {
  label: string
  bg: string
  color: string
  border: string
}

function statusDetails(status: number | string): StatusStyle {
  const normalized = normalizeStatus(status)
  if (normalized === 0) return { label: 'Pending', bg: '#fffbeb', color: '#b45309', border: '#fde68a' }
  if (normalized === 1) return { label: 'Confirmed', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }
  if (normalized === 2) return { label: 'Checked In', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' }
  if (normalized === 3) return { label: 'In Progress', bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' }
  if (normalized === 4) return { label: 'Completed', bg: '#faf6f0', color: '#785839', border: '#eeddc8' }
  if (normalized === 5) return { label: 'Cancelled', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' }
  return { label: String(status), bg: '#faf6f0', color: '#785839', border: '#eeddc8' }
}

function speciesName(species: number | string) {
  return Number(species) === 1 || String(species).toLowerCase() === 'cat' ? 'Cat' : 'Dog'
}

export default function BoardingTasksPage() {
  const [date, setDate] = useState<Dayjs>(dayjs())
  const [tab, setTab] = useState<ViewTab>('assigned')
  const [tasks, setTasks] = useState<BoardingTaskResponseDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [careTask, setCareTask] = useState<BoardingTaskResponseDTO | null>(null)
  const [historyTask, setHistoryTask] = useState<BoardingTaskResponseDTO | null>(null)
  const [completionTask, setCompletionTask] = useState<BoardingTaskResponseDTO | null>(null)
  const [resultNote, setResultNote] = useState('')
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null)

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const params = {
        date: date.format('YYYY-MM-DD'),
        pageNumber,
        pageSize: tab === 'active' ? 20 : pageSize,
      }
      const result =
        tab === 'assigned'
          ? await boardingTaskService.getMyTasks(params)
          : await boardingTaskService.getActiveTasks(params)
      setTasks(result.items)
      setTotal(result.totalCount)
    } catch (error: any) {
      const status = error?.response?.status
      const detail = error?.response?.data?.message || error?.message
      setLoadError(
        status === 404
          ? 'The boarding tasks API was not found (404). Check that the backend exposes this endpoint.'
          : detail || 'Could not load boarding tasks.'
      )
      setTasks([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [date, pageNumber, pageSize, tab])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  // Quick date switches
  const handlePrevDay = () => {
    setDate((prev) => prev.subtract(1, 'day'))
    setPageNumber(1)
  }
  const handleToday = () => {
    setDate(dayjs())
    setPageNumber(1)
  }
  const handleNextDay = () => {
    setDate((prev) => prev.add(1, 'day'))
    setPageNumber(1)
  }

  const changeStatus = async (
    task: BoardingTaskResponseDTO,
    nextStatus: number,
    note?: string
  ) => {
    setStatusBusyId(task.itemId)
    try {
      await boardingTaskService.updateItemStatus(
        task.bookingId,
        task.itemId,
        nextStatus,
        note,
        task.staffId || undefined,
        task.roomId || undefined
      )
      message.success(`${task.petName}'s boarding status was updated.`)
      setCompletionTask(null)
      setResultNote('')
      await loadTasks()
    } catch (error: any) {
      message.error(error?.response?.data?.message || error?.message || 'Could not update boarding status.')
    } finally {
      setStatusBusyId(null)
    }
  }

  const handlePrimaryAction = (task: BoardingTaskResponseDTO) => {
    const current = normalizeStatus(task.status)
    if (current === 0 || current === 1) {
      void changeStatus(task, 2)
    } else if (current === 2) {
      void changeStatus(task, 3)
    } else if (current === 3) {
      setResultNote('')
      setCompletionTask(task)
    }
  }

  const submitCompletion = () => {
    if (!completionTask) return
    if (!resultNote.trim()) {
      message.warning('Add a short stay completion note before finishing.')
      return
    }
    void changeStatus(completionTask, 4, resultNote.trim())
  }

  const getAction = (status: number | string) => {
    const normalized = normalizeStatus(status)
    if (normalized === 0 || normalized === 1) {
      return { label: 'Check in pet', icon: <CheckCircleOutlined />, isComplete: false }
    }
    if (normalized === 2) {
      return { label: 'Start stay', icon: <HomeOutlined />, isComplete: false }
    }
    if (normalized === 3) {
      return { label: 'Complete stay', icon: <CheckCircleFilled />, isComplete: true }
    }
    return null
  }

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '16px 20px 48px' }}>
      <style>{`
        .haven-boarding-modal .ant-modal-content {
          border-radius: 20px !important;
          border: 1.5px solid #eeddc8 !important;
          background-color: #ffffff !important;
          box-shadow: 0 20px 48px rgba(61, 45, 35, 0.16) !important;
          padding: 24px 28px !important;
        }
        .haven-boarding-modal .ant-modal-header {
          margin-bottom: 20px !important;
          padding-bottom: 16px !important;
          border-bottom: 1px solid #eeddc8 !important;
          background: transparent !important;
        }
        .haven-boarding-modal .ant-modal-close {
          top: 22px !important;
          right: 22px !important;
          color: #8c735f !important;
          border-radius: 50% !important;
          transition: all 0.2s ease !important;
        }
        .haven-boarding-modal .ant-modal-close:hover {
          background-color: #faf6f0 !important;
          color: #3d2d23 !important;
        }

        .haven-sanctuary-pagination .ant-pagination-item {
          border-radius: 8px !important;
          border: 1px solid #eeddc8 !important;
          background-color: #ffffff !important;
          color: #785839 !important;
          font-weight: 600 !important;
          transition: all 0.2s ease !important;
        }
        .haven-sanctuary-pagination .ant-pagination-item:hover {
          border-color: #785839 !important;
          color: #3d2d23 !important;
        }
        .haven-sanctuary-pagination .ant-pagination-item-active {
          background-color: #3d2d23 !important;
          border-color: #3d2d23 !important;
        }
        .haven-sanctuary-pagination .ant-pagination-item-active a {
          color: #ffffff !important;
        }
        .haven-sanctuary-pagination .ant-pagination-prev .ant-pagination-item-link,
        .haven-sanctuary-pagination .ant-pagination-next .ant-pagination-item-link {
          border-radius: 8px !important;
          border: 1px solid #eeddc8 !important;
          background-color: #ffffff !important;
          color: #785839 !important;
        }
        .haven-sanctuary-pagination .ant-select-selector {
          border-radius: 8px !important;
          border: 1px solid #eeddc8 !important;
          color: #785839 !important;
          font-weight: 500 !important;
        }
        .haven-sanctuary-pagination .ant-select:hover .ant-select-selector {
          border-color: #785839 !important;
        }
      `}</style>

      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
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
            Boarding Tasks
          </h1>
          <p style={{ margin: '6px 0 0', color: '#8c735f', fontSize: '0.9rem' }}>
            Track room assignments, daily pet care, and boarding progress.
          </p>
        </div>

        {/* Date Filter & Quick Switch Controls */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#ffffff',
            padding: '6px 14px',
            borderRadius: 999,
            boxShadow: '0 2px 10px rgba(61,45,35,0.05)',
            border: '1.5px solid #eeddc8',
          }}
        >
          <Tooltip title="Previous day">
            <button
              type="button"
              onClick={handlePrevDay}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '1px solid #eeddc8',
                backgroundColor: '#faf6f0',
                color: '#785839',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              <LeftOutlined />
            </button>
          </Tooltip>

          <button
            type="button"
            onClick={handleToday}
            style={{
              padding: '4px 14px',
              borderRadius: 999,
              fontSize: '0.82rem',
              fontWeight: 700,
              border: date.isSame(dayjs(), 'day') ? 'none' : '1px solid #eeddc8',
              backgroundColor: date.isSame(dayjs(), 'day') ? '#3d2d23' : '#ffffff',
              color: date.isSame(dayjs(), 'day') ? '#ffffff' : '#785839',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Today
          </button>

          <DatePicker
            value={date}
            onChange={(value) => {
              if (value) {
                setDate(value)
                setPageNumber(1)
              }
            }}
            format="DD/MM/YYYY"
            allowClear={false}
            style={{
              borderRadius: 999,
              width: 135,
              height: 32,
              border: '1px solid #eeddc8',
              fontSize: '0.85rem',
              color: '#3d2d23',
            }}
          />

          <Tooltip title="Next day">
            <button
              type="button"
              onClick={handleNextDay}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '1px solid #eeddc8',
                backgroundColor: '#faf6f0',
                color: '#785839',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              <RightOutlined />
            </button>
          </Tooltip>

          <Tooltip title="Refresh tasks">
            <button
              type="button"
              onClick={() => void loadTasks()}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '1px solid #eeddc8',
                backgroundColor: '#faf6f0',
                color: '#785839',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              <ReloadOutlined spin={loading} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Metric Summary Statistics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
          margin: '20px 0 24px',
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #eeddc8',
            borderRadius: 16,
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 4px 14px rgba(61,45,35,0.04)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: '#faf6f0',
              border: '1.5px solid #eeddc8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#785839',
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            <HomeOutlined />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#8c735f',
              }}
            >
              Guests on this view
            </div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 28,
                fontWeight: 700,
                color: '#3d2d23',
                lineHeight: 1.2,
                marginTop: 2,
              }}
            >
              {total}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #eeddc8',
            borderRadius: 16,
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 4px 14px rgba(61,45,35,0.04)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: '#faf6f0',
              border: '1.5px solid #eeddc8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#785839',
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            <UserOutlined />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#8c735f',
              }}
            >
              Rooms assigned
            </div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 28,
                fontWeight: 700,
                color: '#3d2d23',
                lineHeight: 1.2,
                marginTop: 2,
              }}
            >
              {tasks.filter((task) => Boolean(task.roomName)).length}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #eeddc8',
            borderRadius: 16,
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 4px 14px rgba(61,45,35,0.04)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: '#faf6f0',
              border: '1.5px solid #eeddc8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#785839',
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            <FileTextOutlined />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#8c735f',
              }}
            >
              Care logs on cards
            </div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 28,
                fontWeight: 700,
                color: '#3d2d23',
                lineHeight: 1.2,
                marginTop: 2,
              }}
            >
              {tasks.reduce((sum, task) => sum + (task.totalCareRecords ?? 0), 0)}
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div style={{ display: 'flex', gap: 10, margin: '0 0 20px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => {
            setTab('assigned')
            setPageNumber(1)
            setPageSize(10)
          }}
          style={{
            padding: '8px 22px',
            borderRadius: 999,
            fontSize: 14,
            fontWeight: tab === 'assigned' ? 700 : 500,
            backgroundColor: tab === 'assigned' ? '#3d2d23' : '#ffffff',
            color: tab === 'assigned' ? '#ffffff' : '#785839',
            border: tab === 'assigned' ? '1.5px solid #3d2d23' : '1.5px solid #eeddc8',
            boxShadow: tab === 'assigned' ? '0 3px 10px rgba(61,45,35,0.18)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          My Assigned Rooms
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('active')
            setPageNumber(1)
            setPageSize(20)
          }}
          style={{
            padding: '8px 22px',
            borderRadius: 999,
            fontSize: 14,
            fontWeight: tab === 'active' ? 700 : 500,
            backgroundColor: tab === 'active' ? '#3d2d23' : '#ffffff',
            color: tab === 'active' ? '#ffffff' : '#785839',
            border: tab === 'active' ? '1.5px solid #3d2d23' : '1.5px solid #eeddc8',
            boxShadow: tab === 'active' ? '0 3px 10px rgba(61,45,35,0.18)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          All Active Guests
        </button>
      </div>

      {tab === 'active' && (
        <Alert
          showIcon
          type="info"
          message="Shared team view"
          description="This list shows pets currently checked in or in progress across all boarding rooms in the sanctuary."
          style={{
            marginBottom: 20,
            borderRadius: 14,
            border: '1.5px solid #eeddc8',
            backgroundColor: '#faf6f0',
            color: '#785839',
          }}
        />
      )}

      {loadError && (
        <Alert
          showIcon
          type="error"
          message="Could not load boarding tasks"
          description={loadError}
          style={{
            marginBottom: 20,
            borderRadius: 14,
            border: '1.5px solid #fecaca',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
          }}
        />
      )}

      <Spin spinning={loading}>
        {!loadError && tasks.length === 0 && !loading ? (
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1.5px solid #eeddc8',
              borderRadius: 18,
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: '#8c735f', fontSize: 14 }}>
                  {tab === 'assigned'
                    ? 'No rooms are assigned to you for this date.'
                    : 'No active boarding guests for this date.'}
                </span>
              }
            />
          </div>
        ) : (
          <Row gutter={[20, 20]}>
            {tasks.map((task) => {
              const status = statusDetails(task.status)
              const action = getAction(task.status)
              const remaining = task.daysRemaining

              return (
                <Col xs={24} xl={12} key={task.itemId}>
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #eeddc8',
                      borderRadius: 18,
                      boxShadow: '0 4px 16px rgba(61,45,35,0.06)',
                      overflow: 'hidden',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                  >
                    {/* Card Header Banner */}
                    <div
                      style={{
                        backgroundColor: '#faf6f0',
                        borderBottom: '1.5px solid #eeddc8',
                        padding: '12px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <HomeOutlined style={{ color: '#785839', fontSize: 16 }} />
                        <span
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 17,
                            fontWeight: 700,
                            color: '#3d2d23',
                          }}
                        >
                          {task.roomName || 'Room not assigned'}
                        </span>
                      </div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '3px 12px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          backgroundColor: status.bg,
                          color: status.color,
                          border: `1px solid ${status.border}`,
                          letterSpacing: '0.03em',
                        }}
                      >
                        ● {status.label}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div
                      style={{
                        padding: '18px 20px',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {/* Pet Heading */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: '50%',
                            backgroundColor: '#faf6f0',
                            border: '1.5px solid #eeddc8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#785839',
                            flexShrink: 0,
                          }}
                        >
                          {speciesName(task.petSpecies) === 'Cat' ? (
                            <CatIcon size={26} />
                          ) : (
                            <DogIcon size={26} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3
                            style={{
                              margin: 0,
                              fontFamily: "'Playfair Display', serif",
                              fontSize: 19,
                              fontWeight: 700,
                              color: '#3d2d23',
                            }}
                          >
                            {task.petName}
                          </h3>
                          <div style={{ color: '#8c735f', fontSize: 13, marginTop: 2 }}>
                            {speciesName(task.petSpecies)}
                            {task.petBreed ? ` · ${task.petBreed}` : ''}
                            {task.petWeight != null ? ` · ${task.petWeight} kg` : ''}
                          </div>
                        </div>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            backgroundColor: '#faf6f0',
                            border: '1px solid #eeddc8',
                            color: '#785839',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '3px 12px',
                          }}
                        >
                          {task.roomTypeName || 'Boarding'}
                        </span>
                      </div>

                      {/* Stay Information Grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: 10,
                          margin: '16px 0',
                          padding: '14px',
                          backgroundColor: '#fdfbf7',
                          border: '1px solid #eeddc8',
                          borderRadius: 14,
                        }}
                      >
                        <div style={{ fontSize: 13 }}>
                          <span style={{ color: '#8c735f', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CalendarOutlined style={{ color: '#785839' }} /> Stay dates:
                          </span>
                          <span style={{ fontWeight: 600, color: '#3d2d23', display: 'block', marginTop: 2 }}>
                            {dayjs(task.scheduledStartAt).format('MMM D')} –{' '}
                            {task.scheduledEndAt ? dayjs(task.scheduledEndAt).format('MMM D, YYYY') : '—'}
                          </span>
                        </div>

                        <div style={{ fontSize: 13 }}>
                          <span style={{ color: '#8c735f', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ClockCircleOutlined style={{ color: '#785839' }} /> Duration:
                          </span>
                          <span style={{ fontWeight: 600, color: '#3d2d23', display: 'block', marginTop: 2 }}>
                            {task.totalStayDays ?? '—'} day(s)
                            {remaining != null ? ` · ${remaining} remaining` : ''}
                          </span>
                        </div>

                        <div style={{ fontSize: 13 }}>
                          <span style={{ color: '#8c735f', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <UserOutlined style={{ color: '#785839' }} /> Owner:
                          </span>
                          <span style={{ fontWeight: 600, color: '#3d2d23', display: 'block', marginTop: 2 }}>
                            {task.customerName || '—'}
                          </span>
                        </div>

                        <div style={{ fontSize: 13 }}>
                          <span style={{ color: '#8c735f', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <PhoneOutlined style={{ color: '#785839' }} /> Phone:
                          </span>
                          <span style={{ fontWeight: 600, display: 'block', marginTop: 2 }}>
                            {task.customerPhone ? (
                              <a
                                href={`tel:${task.customerPhone}`}
                                style={{ color: '#785839', textDecoration: 'none' }}
                              >
                                {task.customerPhone}
                              </a>
                            ) : (
                              '—'
                            )}
                          </span>
                        </div>

                        <div style={{ fontSize: 13, gridColumn: '1 / -1' }}>
                          <span style={{ color: '#8c735f', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <UserOutlined style={{ color: '#785839' }} /> Assigned Staff:
                          </span>
                          <span style={{ marginLeft: 8 }}>
                            {task.staffName ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  backgroundColor: '#faf6f0',
                                  border: '1px solid #eeddc8',
                                  color: '#785839',
                                  borderRadius: 999,
                                  padding: '2px 10px',
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                {task.staffName}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>
                                Unassigned
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Health Notes Alert */}
                      {task.petHealthNotes && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            padding: '10px 14px',
                            backgroundColor: '#fffbeb',
                            borderRadius: 12,
                            border: '1.5px solid #fde68a',
                            marginBottom: 12,
                          }}
                        >
                          <WarningOutlined style={{ color: '#b45309', fontSize: 16, marginTop: 2 }} />
                          <div>
                            <span style={{ fontWeight: 700, color: '#92400e', fontSize: 13 }}>
                              Health & Care Notes:
                            </span>
                            <div style={{ color: '#78350f', fontSize: 12, marginTop: 2 }}>
                              {task.petHealthNotes}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Diet Add-on Box */}
                      {task.dietServiceName && (
                        <div
                          style={{
                            marginBottom: 12,
                            padding: '10px 14px',
                            backgroundColor: '#fffbf5',
                            borderRadius: 12,
                            border: '1.5px solid #fed7aa',
                            fontSize: 13,
                          }}
                        >
                          <span style={{ color: '#c2410c', fontWeight: 700 }}>Diet add-on: </span>
                          <span style={{ color: '#9a3412', fontWeight: 600 }}>
                            {task.dietServiceName}
                          </span>
                          {task.dietPrice ? (
                            <span style={{ color: '#c2410c', fontSize: 12, marginLeft: 6 }}>
                              ({task.dietPrice.toLocaleString()} VND)
                            </span>
                          ) : null}
                        </div>
                      )}

                      {/* Latest Health Update */}
                      <div
                        style={{
                          padding: '11px 14px',
                          borderRadius: 12,
                          border: '1.5px solid #eeddc8',
                          backgroundColor: '#fdfbf7',
                          marginTop: 'auto',
                          marginBottom: 14,
                          fontSize: 13,
                        }}
                      >
                        <span style={{ fontWeight: 700, color: '#3d2d23' }}>Latest update: </span>
                        <span style={{ color: '#5c4033' }}>
                          {task.latestHealthStatus || 'No daily care status recorded yet.'}
                        </span>
                      </div>

                      {/* Card Footer */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 10,
                          paddingTop: 14,
                          borderTop: '1px solid #f4ebe1',
                        }}
                      >
                        <span style={{ color: '#8c735f', fontSize: 13, fontWeight: 500 }}>
                          {task.totalCareRecords ?? 0} care log(s)
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Button
                            icon={<HeartOutlined />}
                            onClick={() => setHistoryTask(task)}
                            style={{
                              borderRadius: 999,
                              border: '1.5px solid #eeddc8',
                              backgroundColor: '#ffffff',
                              color: '#785839',
                              fontWeight: 600,
                              height: 36,
                              padding: '0 16px',
                            }}
                          >
                            Care history
                          </Button>

                          <Button
                            type="primary"
                            icon={<FileTextOutlined />}
                            onClick={() => setCareTask(task)}
                            style={{
                              borderRadius: 999,
                              border: 'none',
                              backgroundColor: '#785839',
                              color: '#ffffff',
                              fontWeight: 600,
                              height: 36,
                              padding: '0 16px',
                              boxShadow: '0 2px 8px rgba(120,88,57,0.18)',
                            }}
                          >
                            Log today
                          </Button>

                          {action && (
                            <Button
                              icon={action.icon}
                              loading={statusBusyId === task.itemId}
                              onClick={() => handlePrimaryAction(task)}
                              style={{
                                borderRadius: 999,
                                border: 'none',
                                backgroundColor: action.isComplete ? '#047857' : '#3d2d23',
                                color: '#ffffff',
                                fontWeight: 600,
                                height: 36,
                                padding: '0 18px',
                                boxShadow: action.isComplete
                                  ? '0 2px 8px rgba(4,120,87,0.2)'
                                  : '0 2px 8px rgba(61,45,35,0.2)',
                              }}
                            >
                              {action.label}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
              )
            })}
          </Row>
        )}
      </Spin>

      {/* Pagination Footer */}
      {total > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            backgroundColor: '#ffffff',
            border: '1.5px solid #eeddc8',
            borderRadius: 16,
            marginTop: 24,
            flexWrap: 'wrap',
            gap: 14,
            boxShadow: '0 2px 10px rgba(61,45,35,0.03)',
          }}
        >
          <span style={{ fontSize: '0.88rem', color: '#785839', fontWeight: 600 }}>
            Showing{' '}
            {Math.min(
              (pageNumber - 1) * (tab === 'active' ? 20 : pageSize) + 1,
              total
            )}{' '}
            to {Math.min(pageNumber * (tab === 'active' ? 20 : pageSize), total)} of {total} boarding stays
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Pagination
              className="haven-sanctuary-pagination"
              current={pageNumber}
              pageSize={tab === 'active' ? 20 : pageSize}
              total={total}
              showSizeChanger={tab === 'assigned'}
              pageSizeOptions={[10, 20]}
              onChange={(page, size) => {
                setPageNumber(page)
                setPageSize(size)
              }}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateCareRecordModal
        open={Boolean(careTask)}
        task={careTask}
        onClose={() => setCareTask(null)}
        onSuccess={() => void loadTasks()}
      />

      <CareRecordTimelineModal
        open={Boolean(historyTask)}
        bookingItemId={historyTask?.itemId}
        petName={historyTask?.petName}
        onClose={() => setHistoryTask(null)}
      />

      {/* Complete Stay Modal */}
      <Modal
        wrapClassName="haven-boarding-modal"
        open={Boolean(completionTask)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: '#faf6f0',
                border: '1.5px solid #eeddc8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#785839',
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              <CheckCircleFilled />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 19,
                  fontWeight: 700,
                  color: '#3d2d23',
                  lineHeight: 1.3,
                }}
              >
                Complete Boarding Stay{completionTask ? ` · ${completionTask.petName}` : ''}
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#8c735f', fontWeight: 400 }}>
                Document final condition before handover and release of suite
              </p>
            </div>
          </div>
        }
        onCancel={() => setCompletionTask(null)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <Button
              onClick={() => setCompletionTask(null)}
              style={{
                borderRadius: 999,
                border: '1.5px solid #eeddc8',
                color: '#785839',
                fontWeight: 600,
                height: 40,
                padding: '0 24px',
                background: '#ffffff',
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              loading={Boolean(completionTask && statusBusyId === completionTask.itemId)}
              onClick={submitCompletion}
              style={{
                borderRadius: 999,
                backgroundColor: '#047857',
                borderColor: '#047857',
                color: '#ffffff',
                fontWeight: 600,
                height: 40,
                padding: '0 28px',
                boxShadow: '0 4px 12px rgba(4,120,87,0.2)',
              }}
            >
              Complete stay
            </Button>
          </div>
        }
        destroyOnClose
        centered
        width={580}
      >
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 13, color: '#5c4033', fontWeight: 600, marginBottom: 8 }}>
            Add a final completion note for the pet’s stay: <span style={{ color: '#dc2626' }}>*</span>
          </div>
          <TextArea
            rows={4}
            maxLength={1000}
            showCount
            value={resultNote}
            onChange={(event) => setResultNote(event.target.value)}
            placeholder="e.g. Completed a happy 3-day stay in the suite, healthy, energetic, and ready for owner pickup."
            style={{
              borderRadius: 10,
              border: '1.5px solid #eeddc8',
              padding: '10px 14px',
            }}
          />
        </div>
      </Modal>
    </div>
  )
}
