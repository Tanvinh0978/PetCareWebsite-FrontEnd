import { useEffect, useState } from 'react'
import { Empty, Image, Modal, Spin, Tag, Timeline, Typography } from 'antd'
import { CalendarOutlined, HeartOutlined, UserOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import careRecordService from '@/services/careRecord.service'
import type { CareRecordResponseDTO } from '@/types/boardingTask.types'

const { Text, Paragraph } = Typography

interface Props {
  open: boolean
  bookingItemId?: string
  petName?: string
  onClose: () => void
}

export default function CareRecordTimelineModal({ open, bookingItemId, petName, onClose }: Props) {
  const [records, setRecords] = useState<CareRecordResponseDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !bookingItemId) return
    let active = true
    setLoading(true)
    setError('')
    careRecordService.getByBookingItem(bookingItemId)
      .then((data) => {
        if (active) setRecords([...data].sort((a, b) => dayjs(b.recordDate).valueOf() - dayjs(a.recordDate).valueOf()))
      })
      .catch((err: any) => {
        if (active) setError(err?.response?.data?.message || err?.message || 'Could not load care history.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [open, bookingItemId])

  return (
    <Modal
      open={open}
      title={`Care history${petName ? ` · ${petName}` : ''}`}
      onCancel={onClose}
      footer={null}
      width={680}
      destroyOnClose
    >
      <Spin spinning={loading}>
        {error ? <Text type="danger">{error}</Text> : records.length === 0 && !loading ? (
          <Empty description="No care logs have been recorded for this stay yet." />
        ) : (
          <Timeline
            style={{ marginTop: 20 }}
            items={records.map((record) => ({
              color: 'green',
              children: (
                <div style={{ paddingBottom: 16 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Tag icon={<CalendarOutlined />} color="green">{dayjs(record.recordDate).format('MMM D, YYYY · h:mm A')}</Tag>
                    <Text type="secondary"><UserOutlined /> {record.staffName || 'Boarding staff'}</Text>
                  </div>
                  <div style={{ fontWeight: 650, marginBottom: 4 }}><HeartOutlined /> {record.healthStatus}</div>
                  {record.note && <Paragraph style={{ marginBottom: record.imageUrl ? 12 : 0, whiteSpace: 'pre-wrap' }}>{record.note}</Paragraph>}
                  {record.imageUrl && <Image src={record.imageUrl} alt={`${record.petName || petName || 'Pet'} care record`} width={180} style={{ borderRadius: 10, objectFit: 'cover' }} />}
                </div>
              ),
            }))}
          />
        )}
      </Spin>
    </Modal>
  )
}
