import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Typography,
  Card,
  Row,
  Col,
  Tag,
  Button,
  DatePicker,
  Tabs,
  Badge,
  Spin,
  Empty,
  Space,
  message,
  Popconfirm,
  Image,
  Tooltip,
} from 'antd'
import {
  ClockCircleOutlined,
  CalendarOutlined,
  LeftOutlined,
  RightOutlined,
  ReloadOutlined,
  PlayCircleFilled,
  CheckCircleFilled,
  CheckCircleOutlined,
  LoginOutlined,
  WarningFilled,
  ScissorOutlined,
  UserOutlined,
  PhoneOutlined,
  HomeOutlined,
  SyncOutlined,
  CameraOutlined,
  EditOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import groomingTaskService from '@/services/groomingTask.service'
import type { GroomingTaskResponseDTO } from '@/types/groomingTask.types'
import { normalizeStatus } from '@/types/groomingTask.types'
import CompleteGroomingTaskModal from '@/components/staff/CompleteGroomingTaskModal'

const { Title, Text, Paragraph } = Typography

export const GroomingTasksPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [tasks, setTasks] = useState<GroomingTaskResponseDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('all')

  // Action states
  const [actionLoadingItemId, setActionLoadingItemId] = useState<string | null>(null)
  const [completingTask, setCompletingTask] = useState<GroomingTaskResponseDTO | null>(null)
  const [completeModalOpen, setCompleteModalOpen] = useState(false)

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD')
      const data = await groomingTaskService.getMyTasks({
        date: dateStr,
        pageSize: 100,
      })
      setTasks(data.items || [])
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load grooming task schedule.'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Quick date switches
  const handlePrevDay = () => setSelectedDate((prev) => prev.subtract(1, 'day'))
  const handleToday = () => setSelectedDate(dayjs())
  const handleNextDay = () => setSelectedDate((prev) => prev.add(1, 'day'))

  // Filter tasks by active tab
  const filteredTasks = useMemo(() => {
    if (activeTab === 'all') return tasks
    const tabNum = Number(activeTab)
    if (tabNum === 1) {
      return tasks.filter((t) => {
        const s = normalizeStatus(t.status)
        return s === 1 || s === 0
      })
    }
    return tasks.filter((t) => normalizeStatus(t.status) === tabNum)
  }, [tasks, activeTab])

  // Count by status
  const counts = useMemo(() => {
    let confirmed = 0
    let checkedIn = 0
    let inProgress = 0
    let completed = 0

    tasks.forEach((t) => {
      const s = normalizeStatus(t.status)
      if (s === 1 || s === 0) confirmed++
      else if (s === 2) checkedIn++
      else if (s === 3) inProgress++
      else if (s === 4) completed++
    })

    return { total: tasks.length, confirmed, checkedIn, inProgress, completed }
  }, [tasks])

  // Check-In task handler (status -> 2)
  const handleCheckInTask = async (task: GroomingTaskResponseDTO) => {
    try {
      setActionLoadingItemId(task.itemId)
      const currentStatus = normalizeStatus(task.status)
      if (currentStatus === 0) {
        await groomingTaskService.updateTaskStatus(task.bookingId, task.itemId, {
          status: 1,
          roomId: task.roomId || undefined,
        })
      }
      await groomingTaskService.updateTaskStatus(task.bookingId, task.itemId, {
        status: 2, // Checked_In
        roomId: task.roomId || undefined,
      })
      message.success(`Checked in ${task.petName} successfully!`)
      fetchTasks()
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to check in pet.'
      message.error(msg)
    } finally {
      setActionLoadingItemId(null)
    }
  }

  // Start task handler (status -> 3)
  const handleStartTask = async (task: GroomingTaskResponseDTO) => {
    try {
      setActionLoadingItemId(task.itemId)
      const currentStatus = normalizeStatus(task.status)
      // If task is still Confirmed (1) or Pending (0), advance to Checked_In first
      if (currentStatus === 0) {
        await groomingTaskService.updateTaskStatus(task.bookingId, task.itemId, {
          status: 1,
          roomId: task.roomId || undefined,
        })
      }
      if (currentStatus === 1 || currentStatus === 0) {
        await groomingTaskService.updateTaskStatus(task.bookingId, task.itemId, {
          status: 2, // Checked_In
          roomId: task.roomId || undefined,
        })
      }
      await groomingTaskService.updateTaskStatus(task.bookingId, task.itemId, {
        status: 3, // In_Progress
        roomId: task.roomId || undefined,
      })
      message.success(`Started grooming session for ${task.petName}!`)
      fetchTasks()
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to start grooming session.'
      message.error(msg)
    } finally {
      setActionLoadingItemId(null)
    }
  }

  // Open complete modal
  const handleOpenCompleteModal = (task: GroomingTaskResponseDTO) => {
    setCompletingTask(task)
    setCompleteModalOpen(true)
  }

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '16px 20px 48px' }}>
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0, color: '#0f172a' }}>
            Grooming & Spa Workstation
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Track assigned pets, start service sessions, and document completed results in real time
          </Text>
        </div>

        {/* Date Filter & Quick Switch Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#ffffff',
            padding: '6px 12px',
            borderRadius: 12,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
          }}
        >
          <Tooltip title="Previous day">
            <Button
              size="small"
              icon={<LeftOutlined />}
              onClick={handlePrevDay}
              style={{ borderRadius: 6 }}
            />
          </Tooltip>

          <Button
            size="small"
            type={selectedDate.isSame(dayjs(), 'day') ? 'primary' : 'default'}
            onClick={handleToday}
            style={{
              borderRadius: 6,
              fontWeight: 600,
              backgroundColor: selectedDate.isSame(dayjs(), 'day') ? '#059669' : undefined,
              borderColor: selectedDate.isSame(dayjs(), 'day') ? '#059669' : undefined,
            }}
          >
            Today
          </Button>

          <DatePicker
            value={selectedDate}
            onChange={(d) => d && setSelectedDate(d)}
            format="DD/MM/YYYY"
            allowClear={false}
            style={{ borderRadius: 8, width: 140 }}
          />

          <Tooltip title="Next day">
            <Button
              size="small"
              icon={<RightOutlined />}
              onClick={handleNextDay}
              style={{ borderRadius: 6 }}
            />
          </Tooltip>

          <Tooltip title="Refresh task list">
            <Button
              size="small"
              icon={<ReloadOutlined spin={loading} />}
              onClick={fetchTasks}
              style={{ borderRadius: 6 }}
            />
          </Tooltip>
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div style={{ marginBottom: 16 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          items={[
            {
              key: 'all',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px' }}>
                  <span>All</span>
                  <Badge count={counts.total} overflowCount={99} style={{ backgroundColor: '#64748b' }} />
                </span>
              ),
            },
            {
              key: '2',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px' }}>
                  <span>Waiting / Checked-In</span>
                  <Badge count={counts.checkedIn} overflowCount={99} style={{ backgroundColor: '#f59e0b' }} />
                </span>
              ),
            },
            {
              key: '3',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px' }}>
                  <span>In Progress</span>
                  <Badge count={counts.inProgress} overflowCount={99} style={{ backgroundColor: '#059669' }} />
                </span>
              ),
            },
            {
              key: '4',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px' }}>
                  <span>Completed</span>
                  <Badge count={counts.completed} overflowCount={99} style={{ backgroundColor: '#10b981' }} />
                </span>
              ),
            },
            {
              key: '1',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px' }}>
                  <span>Confirmed</span>
                  <Badge count={counts.confirmed} overflowCount={99} style={{ backgroundColor: '#2563eb' }} />
                </span>
              ),
            },
          ]}
        />
      </div>

      {/* Task Cards Grid */}
      <Spin spinning={loading} tip="Loading grooming tasks...">
        {filteredTasks.length === 0 ? (
          <Card style={{ borderRadius: 16, textAlign: 'center', padding: '40px 0', border: '1px dashed #cbd5e1' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Text strong style={{ fontSize: 16, color: '#475569', display: 'block' }}>
                    No grooming tasks scheduled for {selectedDate.format('DD/MM/YYYY')}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {activeTab === 'all'
                      ? 'Reception has not assigned any tasks or no bookings exist for this date.'
                      : 'No tasks match the selected filter.'}
                  </Text>
                </div>
              }
            />
          </Card>
        ) : (
          <Row gutter={[20, 20]}>
            {filteredTasks.map((task) => {
              const status = normalizeStatus(task.status)
              const isDog = task.petSpecies === 0 || String(task.petSpecies).toLowerCase() === 'dog'
              const isConfirmed = status === 1 || status === 0
              const isCheckedIn = status === 2
              const isInProgress = status === 3
              const isCompleted = status === 4

              const startTime = task.scheduledStartAt
                ? dayjs(task.scheduledStartAt).format('HH:mm')
                : '--:--'
              const endTime = task.scheduledEndAt
                ? dayjs(task.scheduledEndAt).format('HH:mm')
                : '--:--'

              return (
                <Col xs={24} md={12} lg={8} key={task.itemId}>
                  <Card
                    hoverable
                    onClick={() => {
                      if (isInProgress || isCompleted) {
                        handleOpenCompleteModal(task)
                      }
                    }}
                    style={{
                      borderRadius: 14,
                      cursor: isInProgress || isCompleted ? 'pointer' : 'default',
                      border: isInProgress
                        ? '2px solid #059669'
                        : isCheckedIn
                        ? '2px solid #f59e0b'
                        : isConfirmed
                        ? '1px solid #93c5fd'
                        : '1px solid #e2e8f0',
                      boxShadow: isInProgress
                        ? '0 6px 16px rgba(5, 150, 105, 0.14)'
                        : isCheckedIn
                        ? '0 4px 14px rgba(245, 158, 11, 0.14)'
                        : '0 2px 8px rgba(0, 0, 0, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      background: '#ffffff',
                    }}
                    styles={{
                      body: {
                        padding: '16px 18px',
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                      },
                    }}
                  >
                    {/* Card Header: Time, Station, Status Badge */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid #f1f5f9',
                        paddingBottom: 12,
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ClockCircleOutlined style={{ color: '#059669', fontSize: 14 }} />
                          <Text strong style={{ fontSize: 15, color: '#0f172a' }}>
                            {startTime} - {endTime}
                          </Text>
                          {task.durationMinutes > 0 && (
                            <Tag style={{ fontSize: 11, borderRadius: 6, margin: 0, padding: '0 6px' }}>
                              {task.durationMinutes}m
                            </Tag>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: '#64748b', fontSize: 12 }}>
                          <HomeOutlined style={{ color: '#d97706' }} />
                          <span>{task.roomName || 'Pending Station Assignment'}</span>
                        </div>
                      </div>

                      {/* Status Tag */}
                      {isConfirmed && (
                        <Tag
                          color="blue"
                          icon={<CheckCircleOutlined />}
                          style={{
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: 8,
                            margin: 0,
                            background: '#eff6ff',
                            borderColor: '#bfdbfe',
                            color: '#1d4ed8',
                          }}
                        >
                          Confirmed
                        </Tag>
                      )}
                      {isCheckedIn && (
                        <Tag
                          color="warning"
                          icon={<ClockCircleOutlined />}
                          style={{
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: 8,
                            margin: 0,
                            background: '#fffbeb',
                            borderColor: '#fde68a',
                            color: '#b45309',
                          }}
                        >
                          Ready / Checked-In
                        </Tag>
                      )}
                      {isInProgress && (
                        <Tag
                          color="processing"
                          icon={<SyncOutlined spin />}
                          style={{
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: 8,
                            margin: 0,
                            background: '#f0fdf4',
                            borderColor: '#bbf7d0',
                            color: '#15803d',
                          }}
                        >
                          In Progress
                        </Tag>
                      )}
                      {isCompleted && (
                        <Tag
                          color="success"
                          icon={<CheckCircleFilled />}
                          style={{
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: 8,
                            margin: 0,
                            background: '#ecfdf5',
                            borderColor: '#a7f3d0',
                            color: '#065f46',
                          }}
                        >
                          Completed
                        </Tag>
                      )}
                      {!isConfirmed && !isCheckedIn && !isInProgress && !isCompleted && (
                        <Tag style={{ borderRadius: 8, margin: 0 }}>
                          Status: {task.status}
                        </Tag>
                      )}
                    </div>

                    {/* Card Body: Pet Info, Service, Customer */}
                    <div style={{ flex: 1 }}>
                      {/* Pet Profile */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: isDog ? '#fef3c7' : '#e0e7ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                            flexShrink: 0,
                          }}
                        >
                          {isDog ? '🐶' : '🐱'}
                        </div>
                        <div>
                          <Text strong style={{ fontSize: 17, color: '#0f172a', display: 'block', lineHeight: 1.2 }}>
                            {task.petName}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            {task.petBreed || (isDog ? 'Canine' : 'Feline')} •{' '}
                            <strong style={{ color: '#059669' }}>{task.petWeight} kg</strong>
                          </Text>
                        </div>
                      </div>

                      {/* Service Booked */}
                      <div
                        style={{
                          background: '#f8fafc',
                          borderRadius: 8,
                          padding: '8px 12px',
                          marginBottom: 10,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <ScissorOutlined style={{ color: '#059669', fontSize: 15 }} />
                        <Text strong style={{ fontSize: 13, color: '#1e293b' }}>
                          {task.serviceName}
                        </Text>
                      </div>

                      {/* Customer Info */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569' }}>
                          <UserOutlined style={{ color: '#6366f1' }} />
                          <span>{task.customerName}</span>
                        </div>
                        <a
                          href={`tel:${task.customerPhone}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            color: '#059669',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          <PhoneOutlined />
                          <span>{task.customerPhone}</span>
                        </a>
                      </div>

                      {/* Health & Behavior Warning Box */}
                      {task.petHealthNotes ? (
                        <div
                          style={{
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: 8,
                            padding: '8px 12px',
                            marginBottom: 12,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 8,
                          }}
                        >
                          <WarningFilled style={{ color: '#d97706', fontSize: 15, marginTop: 2, flexShrink: 0 }} />
                          <div style={{ fontSize: 12, color: '#92400e', lineHeight: 1.4 }}>
                            <strong>Special Pet Notice:</strong> {task.petHealthNotes}
                          </div>
                        </div>
                      ) : null}

                      {/* Completed Result Thumbnail & Note */}
                      {isCompleted && (
                        <div
                          style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: 8,
                            padding: '10px 12px',
                            marginBottom: 12,
                          }}
                        >
                          {(task.beforeImageUrl || task.resultImageUrl) && (
                            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                              <Image.PreviewGroup>
                                {task.beforeImageUrl && (
                                  <div style={{ textAlign: 'center' }}>
                                    <Image
                                      src={task.beforeImageUrl}
                                      width={60}
                                      height={60}
                                      style={{ objectFit: 'cover', borderRadius: 6, border: '1px solid #cbd5e1' }}
                                    />
                                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Before</div>
                                  </div>
                                )}
                                {task.resultImageUrl && (
                                  <div style={{ textAlign: 'center' }}>
                                    <Image
                                      src={task.resultImageUrl}
                                      width={60}
                                      height={60}
                                      style={{ objectFit: 'cover', borderRadius: 6, border: '1px solid #10b981' }}
                                    />
                                    <div style={{ fontSize: 10, color: '#059669', fontWeight: 600, marginTop: 2 }}>After ⭐</div>
                                  </div>
                                )}
                              </Image.PreviewGroup>
                            </div>
                          )}
                          {task.resultNote && (
                            <Paragraph
                              ellipsis={{ rows: 2 }}
                              style={{ margin: 0, fontSize: 12, color: '#166534', fontStyle: 'italic' }}
                            >
                              💬 "{task.resultNote}"
                            </Paragraph>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Footer Actions - Single Step Action Button */}
                    <div
                      style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, marginTop: 'auto' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Step 1: Chưa check in -> Chỉ hiện nút Check In */}
                      {isConfirmed && (
                        <Button
                          type="primary"
                          size="large"
                          block
                          icon={<LoginOutlined />}
                          loading={actionLoadingItemId === task.itemId}
                          onClick={() => handleCheckInTask(task)}
                          style={{
                            backgroundColor: '#f59e0b',
                            borderColor: '#f59e0b',
                            height: 42,
                            fontSize: 14,
                            fontWeight: 600,
                            borderRadius: 8,
                            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                          }}
                        >
                          Check In
                        </Button>
                      )}

                      {/* Step 2: Đã check in -> Chỉ hiện nút Start Service */}
                      {isCheckedIn && (
                        <Button
                          type="primary"
                          size="large"
                          block
                          loading={actionLoadingItemId === task.itemId}
                          icon={<PlayCircleFilled />}
                          onClick={() => handleStartTask(task)}
                          style={{
                            backgroundColor: '#2563eb',
                            borderColor: '#2563eb',
                            height: 42,
                            fontSize: 14,
                            fontWeight: 600,
                            borderRadius: 8,
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                          }}
                        >
                          ▶ Start Service
                        </Button>
                      )}

                      {/* Step 3: Đang làm -> Chỉ hiện nút Finish & Submit Result */}
                      {isInProgress && (
                        <Button
                          type="primary"
                          size="large"
                          block
                          icon={<CheckCircleFilled />}
                          onClick={() => handleOpenCompleteModal(task)}
                          style={{
                            backgroundColor: '#059669',
                            borderColor: '#059669',
                            height: 42,
                            fontSize: 14,
                            fontWeight: 600,
                            borderRadius: 8,
                            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                          }}
                        >
                          ✓ Finish & Submit Result
                        </Button>
                      )}

                      {/* Step 4: Đã hoàn tất -> Hiển thị kết quả */}
                      {isCompleted && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircleFilled /> Handed Over & Finished
                          </span>
                          <Button
                            size="small"
                            type="primary"
                            ghost
                            icon={<EditOutlined />}
                            onClick={() => handleOpenCompleteModal(task)}
                            style={{
                              borderRadius: 6,
                              fontWeight: 500,
                              fontSize: 12,
                            }}
                          >
                            View / Edit Result
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>
              )
            })}
          </Row>
        )}
      </Spin>

      {/* Complete Task Modal */}
      <CompleteGroomingTaskModal
        open={completeModalOpen}
        onClose={() => {
          setCompleteModalOpen(false)
          setCompletingTask(null)
        }}
        onSuccess={() => {
          fetchTasks()
        }}
        task={completingTask}
      />
    </div>
  )
}

export default GroomingTasksPage
