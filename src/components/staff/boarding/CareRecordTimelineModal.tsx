import { useEffect, useState } from 'react'
import { Empty, Image, Modal, Spin, Timeline } from 'antd'
import { CalendarOutlined, HeartOutlined, UserOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import careRecordService from '@/services/careRecord.service'
import type { CareRecordResponseDTO } from '@/types/boardingTask.types'

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
    careRecordService
      .getByBookingItem(bookingItemId)
      .then((data) => {
        if (active) {
          setRecords([...data].sort((a, b) => dayjs(b.recordDate).valueOf() - dayjs(a.recordDate).valueOf()))
        }
      })
      .catch((err: any) => {
        if (active) setError(err?.response?.data?.message || err?.message || 'Could not load care history.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [open, bookingItemId])

  return (
    <>
      <style>{`
        .haven-timeline-modal .ant-modal-content {
          border-radius: 20px !important;
          border: 1.5px solid #eeddc8 !important;
          background-color: #ffffff !important;
          box-shadow: 0 20px 48px rgba(61, 45, 35, 0.16) !important;
          padding: 24px 28px !important;
        }
        .haven-timeline-modal .ant-modal-header {
          margin-bottom: 20px !important;
          padding-bottom: 16px !important;
          border-bottom: 1px solid #eeddc8 !important;
          background: transparent !important;
        }
        .haven-timeline-modal .ant-modal-close {
          top: 22px !important;
          right: 22px !important;
          color: #8c735f !important;
          border-radius: 50% !important;
          transition: all 0.2s ease !important;
        }
        .haven-timeline-modal .ant-modal-close:hover {
          background-color: #faf6f0 !important;
          color: #3d2d23 !important;
        }
      `}</style>

      <Modal
        wrapClassName="haven-timeline-modal"
        open={open}
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
              <HeartOutlined />
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
                Care History {petName ? `· ${petName}` : ''}
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#8c735f', fontWeight: 400 }}>
                Chronological timeline of daily care updates, feeding, and medical observations
              </p>
            </div>
          </div>
        }
        onCancel={onClose}
        footer={null}
        width={700}
        destroyOnClose
        centered
      >
        <Spin spinning={loading}>
          {error ? (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          ) : records.length === 0 && !loading ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: '#8c735f', fontSize: 14 }}>
                  No care logs have been recorded for this stay yet.
                </span>
              }
            />
          ) : (
            <Timeline
              style={{ marginTop: 20 }}
              items={records.map((record) => ({
                color: '#785839',
                children: (
                  <div
                    style={{
                      paddingBottom: 16,
                      background: '#fdfbf7',
                      border: '1.5px solid #eeddc8',
                      borderRadius: 14,
                      padding: '14px 18px',
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          backgroundColor: '#faf6f0',
                          border: '1px solid #eeddc8',
                          color: '#785839',
                          borderRadius: 999,
                          padding: '3px 12px',
                        }}
                      >
                        <CalendarOutlined /> {dayjs(record.recordDate).format('MMM D, YYYY · h:mm A')}
                      </span>
                      <span style={{ color: '#8c735f', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <UserOutlined style={{ color: '#785839' }} /> {record.staffName || 'Boarding Staff'}
                      </span>
                    </div>

                    <div
                      style={{
                        fontWeight: 700,
                        color: '#3d2d23',
                        fontSize: 14,
                        marginBottom: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <HeartOutlined style={{ color: '#dc2626' }} />
                      <span>{record.healthStatus}</span>
                    </div>

                    {record.note && (
                      <div
                        style={{
                          marginBottom: record.imageUrl ? 12 : 0,
                          whiteSpace: 'pre-wrap',
                          color: '#5c4033',
                          fontSize: 13,
                          lineHeight: 1.6,
                        }}
                      >
                        {record.note}
                      </div>
                    )}

                    {record.imageUrl && (
                      <div style={{ marginTop: 10 }}>
                        <Image
                          src={record.imageUrl}
                          alt={`${record.petName || petName || 'Pet'} care record`}
                          width={160}
                          style={{
                            borderRadius: 12,
                            border: '1.5px solid #eeddc8',
                            objectFit: 'cover',
                          }}
                        />
                      </div>
                    )}
                  </div>
                ),
              }))}
            />
          )}
        </Spin>
      </Modal>
    </>
  )
}
