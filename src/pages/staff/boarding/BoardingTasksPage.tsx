import { useCallback, useEffect, useState } from 'react'
import {
  Alert, Avatar, Button, Card, Col, DatePicker, Descriptions, Empty, Input, Modal,
  Pagination, Row, Space, Spin, Statistic, Tag, Typography, message,
} from 'antd'
import {
  CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined,
  HeartOutlined, HomeOutlined, PhoneOutlined, ReloadOutlined, UserOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import boardingTaskService from '@/services/boardingTask.service'
import type { BoardingTaskResponseDTO } from '@/types/boardingTask.types'
import { normalizeStatus } from '@/types/groomingTask.types'
import CreateCareRecordModal from '@/components/staff/boarding/CreateCareRecordModal'
import CareRecordTimelineModal from '@/components/staff/boarding/CareRecordTimelineModal'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

type ViewTab = 'assigned' | 'active'

function statusDetails(status: number | string) {
  const normalized = normalizeStatus(status)
  if (normalized === 0) return { label: 'Pending', color: 'gold' }
  if (normalized === 1) return { label: 'Confirmed', color: 'blue' }
  if (normalized === 2) return { label: 'Checked in', color: 'cyan' }
  if (normalized === 3) return { label: 'In progress', color: 'green' }
  if (normalized === 4) return { label: 'Completed', color: 'default' }
  if (normalized === 5) return { label: 'Cancelled', color: 'red' }
  return { label: String(status), color: 'default' }
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
      const result = tab === 'assigned'
        ? await boardingTaskService.getMyTasks(params)
        : await boardingTaskService.getActiveTasks(params)
      setTasks(result.items)
      setTotal(result.totalCount)
    } catch (error: any) {
      const status = error?.response?.status
      const detail = error?.response?.data?.message || error?.message
      setLoadError(status === 404
        ? 'The boarding tasks API was not found (404). Check that the backend exposes this endpoint.'
        : detail || 'Could not load boarding tasks.')
      setTasks([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [date, pageNumber, pageSize, tab])

  useEffect(() => { void loadTasks() }, [loadTasks])

  const changeStatus = async (task: BoardingTaskResponseDTO, nextStatus: number, note?: string) => {
    setStatusBusyId(task.itemId)
    try {
      await boardingTaskService.updateItemStatus(task.bookingId, task.itemId, nextStatus, note)
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
    if (normalized === 0 || normalized === 1) return { label: 'Check in pet', icon: <CheckCircleOutlined /> }
    if (normalized === 2) return { label: 'Start stay', icon: <HomeOutlined /> }
    if (normalized === 3) return { label: 'Complete stay', icon: <CheckCircleOutlined /> }
    return null
  }

  return (
    <div className="page wide boarding-tasks-page">
      <div className="page-head">
        <div>
          <Title level={2} style={{ margin: 0 }}>Boarding Tasks</Title>
          <Paragraph className="page-subtitle">Track room assignments, daily pet care, and boarding progress.</Paragraph>
        </div>
        <Space wrap>
          <DatePicker value={date} onChange={(value) => { if (value) { setDate(value); setPageNumber(1) } }} allowClear={false} />
          <Button icon={<ReloadOutlined />} onClick={() => void loadTasks()} loading={loading}>Refresh</Button>
        </Space>
      </div>

      <div className="boarding-summary-row">
        <Statistic title="Guests on this view" value={total} prefix={<HomeOutlined />} />
        <Statistic title="Rooms assigned" value={tasks.filter((task) => Boolean(task.roomName)).length} prefix={<UserOutlined />} />
        <Statistic title="Care logs on cards" value={tasks.reduce((sum, task) => sum + (task.totalCareRecords ?? 0), 0)} prefix={<FileTextOutlined />} />
      </div>

      <div className="boarding-tabs" role="tablist" aria-label="Boarding task views">
        <Button type={tab === 'assigned' ? 'primary' : 'default'} onClick={() => { setTab('assigned'); setPageNumber(1); setPageSize(10) }}>
          My Assigned Rooms
        </Button>
        <Button type={tab === 'active' ? 'primary' : 'default'} onClick={() => { setTab('active'); setPageNumber(1); setPageSize(20) }}>
          All Active Guests
        </Button>
      </div>

      {tab === 'active' && <Alert showIcon type="info" message="Shared team view" description="This list shows pets currently checked in or in progress across all boarding rooms." style={{ marginBottom: 18 }} />}

      {loadError && <Alert showIcon type="error" message="Could not load boarding tasks" description={loadError} style={{ marginBottom: 18 }} />}

      <Spin spinning={loading}>
        {!loadError && tasks.length === 0 && !loading ? (
          <Card><Empty description={tab === 'assigned' ? 'No rooms are assigned to you for this date.' : 'No active boarding guests for this date.'} /></Card>
        ) : (
          <Row gutter={[18, 18]}>
            {tasks.map((task) => {
              const status = statusDetails(task.status)
              const action = getAction(task.status)
              const remaining = task.daysRemaining
              return (
                <Col xs={24} xl={12} key={task.itemId}>
                  <Card className="boarding-task-card" title={<Space><HomeOutlined /><span>{task.roomName || 'Room not assigned'}</span></Space>} extra={<Tag color={status.color}>{status.label}</Tag>}>
                    <div className="boarding-pet-heading">
                      <Avatar size={48} style={{ background: '#e6f4ec', color: '#16804a' }}>{speciesName(task.petSpecies) === 'Cat' ? '🐱' : '🐶'}</Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Title level={4} style={{ margin: 0 }}>{task.petName}</Title>
                        <Text type="secondary">{speciesName(task.petSpecies)}{task.petBreed ? ` · ${task.petBreed}` : ''}{task.petWeight != null ? ` · ${task.petWeight} kg` : ''}</Text>
                      </div>
                      <Tag color="geekblue">{task.roomTypeName || 'Boarding'}</Tag>
                    </div>

                    <Descriptions size="small" column={{ xs: 1, sm: 2 }} style={{ marginTop: 16 }}>
                      <Descriptions.Item label={<><CalendarOutlined /> Stay dates</>}>
                        {dayjs(task.scheduledStartAt).format('MMM D')} – {task.scheduledEndAt ? dayjs(task.scheduledEndAt).format('MMM D, YYYY') : '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label={<><ClockCircleOutlined /> Duration</>}>
                        {task.totalStayDays ?? '—'} day(s){remaining != null ? ` · ${remaining} remaining` : ''}
                      </Descriptions.Item>
                      <Descriptions.Item label={<><UserOutlined /> Owner</>}>
                        {task.customerName || '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
                        {task.customerPhone ? <a href={`tel:${task.customerPhone}`}>{task.customerPhone}</a> : '—'}
                      </Descriptions.Item>
                    </Descriptions>

                    {task.petHealthNotes && <Alert type="warning" showIcon message="Health & care notes" description={task.petHealthNotes} style={{ margin: '12px 0' }} />}

                    {task.dietServiceName && (
                      <div
                        style={{
                          margin: '10px 0',
                          padding: '6px 12px',
                          backgroundColor: '#fff7ed',
                          borderRadius: 6,
                          border: '1px solid #fed7aa',
                          fontSize: 13,
                        }}
                      >
                        <Text strong style={{ color: '#c2410c' }}>
                          🍲 Khẩu phần ăn kèm:{' '}
                        </Text>
                        <Text style={{ color: '#9a3412', fontWeight: 500 }}>
                          {task.dietServiceName}
                        </Text>
                        {task.dietPrice ? (
                          <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
                            ({task.dietPrice.toLocaleString()} VND)
                          </Text>
                        ) : null}
                      </div>
                    )}

                    <div className="boarding-latest-health">
                      <Text strong>Latest update: </Text>
                      <Text>{task.latestHealthStatus || 'No daily care status recorded yet.'}</Text>
                    </div>

                    <div className="boarding-card-footer">
                      <Text type="secondary">{task.totalCareRecords ?? 0} care log(s)</Text>
                      <Space wrap>
                        <Button icon={<HeartOutlined />} onClick={() => setHistoryTask(task)}>Care history</Button>
                        <Button type="primary" icon={<FileTextOutlined />} onClick={() => setCareTask(task)}>Log today</Button>
                        {action && <Button
                          type={normalizeStatus(task.status) === 3 ? 'default' : 'default'}
                          icon={action.icon}
                          loading={statusBusyId === task.itemId}
                          onClick={() => handlePrimaryAction(task)}
                        >{action.label}</Button>}
                      </Space>
                    </div>
                  </Card>
                </Col>
              )
            })}
          </Row>
        )}
      </Spin>

      {total > 0 && <Pagination
        className="boarding-pagination"
        current={pageNumber}
        pageSize={tab === 'active' ? 20 : pageSize}
        total={total}
        showSizeChanger={tab === 'assigned'}
        pageSizeOptions={[10, 20]}
        showTotal={(count, range) => `${range[0]}–${range[1]} of ${count} stays`}
        onChange={(page, size) => { setPageNumber(page); setPageSize(size) }}
      />}

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
      <Modal
        open={Boolean(completionTask)}
        title={`Complete boarding stay${completionTask ? ` · ${completionTask.petName}` : ''}`}
        onCancel={() => setCompletionTask(null)}
        onOk={submitCompletion}
        okText="Complete stay"
        confirmLoading={Boolean(completionTask && statusBusyId === completionTask.itemId)}
        destroyOnClose
      >
        <Text type="secondary">Add a short completion note for the pet’s stay.</Text>
        <TextArea
          rows={4}
          maxLength={1000}
          showCount
          value={resultNote}
          onChange={(event) => setResultNote(event.target.value)}
          placeholder="e.g. Completed a happy 3-day stay and is in good health."
          style={{ marginTop: 12 }}
        />
      </Modal>
    </div>
  )
}
