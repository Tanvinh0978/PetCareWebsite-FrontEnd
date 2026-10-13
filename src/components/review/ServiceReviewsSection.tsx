import React, { useCallback, useEffect, useState } from 'react'
import {
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Modal,
  Pagination,
  Popconfirm,
  Progress,
  Rate,
  Row,
  Segmented,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  CheckCircleFilled,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  LikeOutlined,
  MessageOutlined,
  StarFilled,
  UserOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { reviewService } from '@/services/review.service'
import { bookingService } from '@/services/booking.service'
import type { ReviewListItem } from '@/types/review.types'
import { useAuthStore } from '@/store/useAuthStore'
import { getApiErrorMessage } from '@/utils/apiError'
import CreateReviewModal from './CreateReviewModal'

dayjs.extend(relativeTime)

const { Title, Text, Paragraph } = Typography

interface ServiceReviewsSectionProps {
  serviceId: string
  serviceName: string
  showWriteButton?: boolean
}

export const ServiceReviewsSection: React.FC<ServiceReviewsSectionProps> = ({
  serviceId,
  serviceName,
  showWriteButton = false,
}) => {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [reviews, setReviews] = useState<ReviewListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined)

  // Write new review state
  const [checkingBooking, setCheckingBooking] = useState(false)
  const [writeModalOpen, setWriteModalOpen] = useState(false)
  const [eligibleBookingItem, setEligibleBookingItem] = useState<{ id: string; petName: string } | null>(null)
  const [notEligibleModalOpen, setNotEligibleModalOpen] = useState(false)

  // Edit review state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<ReviewListItem | null>(null)

  const handleWriteReviewClick = async () => {
    if (!user) {
      Modal.confirm({
        title: 'Sign in to Review',
        content: 'You need to log in as a customer to submit a review for this service.',
        okText: 'Sign In Now',
        cancelText: 'Later',
        onOk: () => navigate('/login'),
      })
      return
    }

    setCheckingBooking(true)
    try {
      const myBookings = await bookingService.fetchMyBookings({ pageSize: 50 })
      let foundItem: { id: string; petName: string } | null = null

      for (const b of myBookings.items) {
        try {
          const detail = await bookingService.fetchById(b.id)
          const matched = detail.bookingItems?.find(
            (item) =>
              item.serviceId === serviceId &&
              (String(item.status).toLowerCase() === '4' ||
                String(item.status).toLowerCase() === 'completed')
          )
          if (matched) {
            foundItem = { id: matched.id, petName: matched.petName }
            break
          }
        } catch {
          // ignore error for single booking detail
        }
      }

      if (foundItem) {
        setEligibleBookingItem(foundItem)
        setWriteModalOpen(true)
      } else {
        setNotEligibleModalOpen(true)
      }
    } catch {
      setNotEligibleModalOpen(true)
    } finally {
      setCheckingBooking(false)
    }
  }

  // Fetch reviews for this service
  const fetchReviews = useCallback(async () => {
    if (!serviceId) return
    setLoading(true)
    try {
      const res = await reviewService.getReviews({
        serviceId,
        rating: selectedRating,
        pageNumber,
        pageSize,
      })
      if (res.isSuccess) {
        setReviews(res.result.items || [])
        setTotalCount(res.result.totalCount || 0)
      }
    } catch (err) {
      console.error('Failed to load reviews:', err)
    } finally {
      setLoading(false)
    }
  }, [serviceId, selectedRating, pageNumber, pageSize])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  // Delete review
  const handleDelete = async (id: string) => {
    try {
      const res = await reviewService.delete(id)
      if (res.isSuccess) {
        message.success('Review deleted successfully.')
        fetchReviews()
      } else {
        message.error(res.message || 'Failed to delete review.')
      }
    } catch (err) {
      message.error(getApiErrorMessage(err))
    }
  }

  // Calculate stats from available reviews (or baseline)
  const avgScore =
    reviews.length > 0
      ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
      : '5.0'

  const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach((r) => {
    if (counts[r.rating] !== undefined) counts[r.rating]++
  })

  return (
    <Card
      style={{
        borderRadius: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        border: '1px solid #e2e8f0',
        marginTop: 32,
      }}
      bodyStyle={{ padding: '28px 24px' }}
    >
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
            <MessageOutlined style={{ marginRight: 10, color: '#f59e0b' }} />
            Customer Reviews ({totalCount})
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Genuine feedback from pet parents who have experienced this service
          </Text>
        </div>

        {showWriteButton && (
          <div style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="large"
              loading={checkingBooking}
              style={{
                backgroundColor: '#059669',
                borderColor: '#059669',
                borderRadius: 8,
                fontWeight: 600,
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
              }}
              onClick={handleWriteReviewClick}
            >
              Write a Review
            </Button>
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 11, color: '#64748b' }}>
                ✓ Only available for customers with completed appointments
              </Text>
            </div>
          </div>
        )}
      </div>

      {/* Rating Overview Summary */}
      <div
        style={{
          background: '#f8fafc',
          borderRadius: 16,
          padding: '24px',
          border: '1px solid #f1f5f9',
          marginBottom: 28,
        }}
      >
        <Row gutter={[32, 24]} align="middle">
          {/* Average Rating Block */}
          <Col xs={24} md={8} style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 52, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              {avgScore}
              <span style={{ fontSize: 24, fontWeight: 500, color: '#94a3b8' }}>/5</span>
            </div>
            <div style={{ margin: '12px 0 6px' }}>
              <Rate disabled allowHalf value={Number(avgScore)} style={{ fontSize: 22, color: '#f59e0b' }} />
            </div>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Based on <strong>{totalCount}</strong> review{totalCount === 1 ? '' : 's'}
            </Text>
          </Col>

          {/* Star Breakdown Bars */}
          <Col xs={24} md={16}>
            <div style={{ maxWidth: 450, margin: '0 auto' }}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = counts[star] || 0
                const percent = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0
                return (
                  <div
                    key={star}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 8,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setSelectedRating(selectedRating === star ? undefined : star)
                      setPageNumber(1)
                    }}
                  >
                    <Space size={4} style={{ width: 65 }}>
                      <Text strong style={{ fontSize: 13 }}>{star}</Text>
                      <StarFilled style={{ color: '#f59e0b', fontSize: 13 }} />
                    </Space>
                    <Progress
                      percent={percent}
                      strokeColor={star >= 4 ? '#10b981' : star === 3 ? '#f59e0b' : '#ef4444'}
                      showInfo={false}
                      style={{ flex: 1, margin: 0 }}
                    />
                    <Text type="secondary" style={{ width: 55, textAlign: 'right', fontSize: 12 }}>
                      {count} ({percent}%)
                    </Text>
                  </div>
                )
              })}
            </div>
          </Col>
        </Row>
      </div>

      {/* Filter Tabs by Star Rating */}
      <div style={{ marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        <Segmented
          value={selectedRating === undefined ? 'all' : String(selectedRating)}
          onChange={(val) => {
            setSelectedRating(val === 'all' ? undefined : Number(val))
            setPageNumber(1)
          }}
          options={[
            { label: 'All Reviews', value: 'all' },
            { label: '⭐⭐⭐⭐⭐ 5 Stars', value: '5' },
            { label: '⭐⭐⭐⭐ 4 Stars', value: '4' },
            { label: '⭐⭐⭐ 3 Stars', value: '3' },
            { label: '⭐⭐ 2 Stars', value: '2' },
            { label: '⭐ 1 Star', value: '1' },
          ]}
          style={{ padding: 4 }}
        />
      </div>

      {/* Reviews List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : reviews.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No reviews for this service yet."
        >
          <Text type="secondary">
            Book an appointment and experience our service to be the first to share your thoughts!
          </Text>
        </Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reviews.map((rev) => {
            const isOwner = user?.id === rev.customerId
            const isAdmin = user?.role === 'Admin' || user?.role === 'Staff'

            return (
              <Card
                key={rev.id}
                bordered={false}
                style={{
                  background: '#ffffff',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
                bodyStyle={{ padding: 18 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <Space align="start" size="middle">
                    <Avatar
                      src={rev.customerAvatarUrl}
                      icon={<UserOutlined />}
                      size={44}
                      style={{ backgroundColor: '#059669', flexShrink: 0 }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text strong style={{ fontSize: 15, color: '#0f172a' }}>
                          {rev.customerName || 'Customer'}
                        </Text>
                        <Tag
                          icon={<CheckCircleFilled style={{ color: '#10b981' }} />}
                          style={{
                            borderRadius: 12,
                            background: '#ecfdf5',
                            borderColor: '#a7f3d0',
                            color: '#065f46',
                            fontSize: 11,
                          }}
                        >
                          Verified Customer
                        </Tag>
                        {isOwner && (
                          <Tag color="gold" style={{ borderRadius: 8, fontSize: 11 }}>
                            Your Review
                          </Tag>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                        <Rate disabled value={rev.rating} style={{ fontSize: 13, color: '#f59e0b' }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(rev.createdAt).format('DD/MM/YYYY HH:mm')} ({dayjs(rev.createdAt).fromNow()})
                        </Text>
                      </div>
                    </div>
                  </Space>

                  {(isOwner || isAdmin) && (
                    <Space size="small">
                      {isOwner && (
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          style={{ color: '#0ea5e9' }}
                          onClick={() => {
                            setEditingReview(rev)
                            setEditModalOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                      )}
                      <Popconfirm
                        title="Delete this review?"
                        onConfirm={() => handleDelete(rev.id)}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                      >
                        <Button type="text" danger size="small" icon={<DeleteOutlined />}>
                          Delete
                        </Button>
                      </Popconfirm>
                    </Space>
                  )}
                </div>

                {rev.comment && (
                  <Paragraph
                    style={{
                      marginTop: 14,
                      marginBottom: 0,
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: '#334155',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {rev.comment}
                  </Paragraph>
                )}
              </Card>
            )
          })}

          {totalCount > pageSize && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Pagination
                current={pageNumber}
                pageSize={pageSize}
                total={totalCount}
                onChange={(p, ps) => {
                  setPageNumber(p)
                  setPageSize(ps)
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <CreateReviewModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setEditingReview(null)
          }}
          onSuccess={() => {
            fetchReviews()
          }}
          bookingItemId=""
          serviceName={serviceName}
          initialReview={{
            id: editingReview.id,
            rating: editingReview.rating,
            comment: editingReview.comment,
          }}
        />
      )}

      {/* Write New Review Modal */}
      {eligibleBookingItem && (
        <CreateReviewModal
          open={writeModalOpen}
          onClose={() => {
            setWriteModalOpen(false)
            setEligibleBookingItem(null)
          }}
          onSuccess={() => {
            fetchReviews()
          }}
          bookingItemId={eligibleBookingItem.id}
          serviceName={serviceName}
          petName={eligibleBookingItem.petName}
        />
      )}

      {/* Guidance modal if user hasn't completed this service yet */}
      <Modal
        open={notEligibleModalOpen}
        onCancel={() => setNotEligibleModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setNotEligibleModalOpen(false)}>
            Close
          </Button>,
          <Button
            key="bookings"
            onClick={() => {
              setNotEligibleModalOpen(false)
              navigate('/my-bookings')
            }}
          >
            My Bookings
          </Button>,
          <Button
            key="book"
            type="primary"
            style={{ backgroundColor: '#059669', borderColor: '#059669' }}
            onClick={() => {
              setNotEligibleModalOpen(false)
              navigate('/customer/booking')
            }}
          >
            Book Now
          </Button>,
        ]}
        title={
          <Space>
            <InfoCircleOutlined style={{ color: '#0ea5e9' }} />
            <span>Service Completion Required to Review</span>
          </Space>
        }
      >
        <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
          To ensure authentic and trustworthy feedback, reviews are only open to customers who have <strong>completed this service</strong>.
        </p>
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
          💡 <em>Tip:</em> Once your appointment is completed (status Completed), you can submit your review here or in <strong>My Bookings</strong>!
        </p>
      </Modal>
    </Card>
  )
}
export default ServiceReviewsSection
