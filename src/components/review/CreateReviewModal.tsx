import React, { useState, useEffect } from 'react'
import {
  Modal,
  Form,
  Rate,
  Input,
  Button,
  Space,
  Typography,
  Divider,
  Tag,
  Alert,
  message,
} from 'antd'
import { StarFilled, HeartFilled, CheckCircleOutlined } from '@ant-design/icons'
import { reviewService } from '@/services/review.service'
import { getApiErrorMessage } from '@/utils/apiError'

const { Text, Title } = Typography
const { TextArea } = Input

interface CreateReviewModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  bookingItemId: string
  serviceName: string
  petName?: string
  initialReview?: {
    id: string
    rating: number
    comment?: string | null
  }
}

const ratingDescriptions: Record<number, { text: string; color: string; desc: string }> = {
  1: { text: 'Very Poor', color: '#dc2626', desc: 'Service did not meet expectations' },
  2: { text: 'Dissatisfied', color: '#ea580c', desc: 'Needs improvement in several areas' },
  3: { text: 'Average', color: '#d97706', desc: 'Service was acceptable, as promised' },
  4: { text: 'Satisfied', color: '#b45309', desc: 'Pet was well cared for and happy' },
  5: { text: 'Excellent!', color: '#785839', desc: 'Outstanding quality, exceeded expectations!' },
}

const quickTags = [
  'Friendly & caring staff',
  'Pet was well taken care of',
  'Clean & modern facilities',
  'Punctual and professional',
  'Will definitely come back',
  'Reasonable pricing',
]

export const CreateReviewModal: React.FC<CreateReviewModalProps> = ({
  open,
  onClose,
  onSuccess,
  bookingItemId,
  serviceName,
  petName,
  initialReview,
}) => {
  const [form] = Form.useForm()
  const [ratingValue, setRatingValue] = useState<number>(initialReview?.rating || 5)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const isEditing = Boolean(initialReview?.id)

  useEffect(() => {
    if (open) {
      setApiError(null)
      const currentRating = initialReview?.rating || 5
      setRatingValue(currentRating)
      form.setFieldsValue({
        rating: currentRating,
        comment: initialReview?.comment || '',
      })
    }
  }, [open, initialReview, form])

  const handleFinish = async (values: { rating: number; comment?: string }) => {
    setSubmitting(true)
    setApiError(null)

    try {
      if (isEditing && initialReview?.id) {
        const res = await reviewService.update(initialReview.id, {
          rating: values.rating,
          comment: values.comment,
        })
        if (res.isSuccess) {
          message.success('Review updated successfully! Thank you for your feedback.')
          onSuccess()
          onClose()
        } else {
          setApiError(res.message || 'Failed to update review.')
        }
      } else {
        const res = await reviewService.create({
          bookingItemId,
          rating: values.rating,
          comment: values.comment,
        })
        if (res.isSuccess) {
          try {
            const cached = localStorage.getItem('petcare_reviewed_items')
            const arr = cached ? JSON.parse(cached) : []
            if (!arr.includes(bookingItemId)) {
              arr.push(bookingItemId)
              localStorage.setItem('petcare_reviewed_items', JSON.stringify(arr))
            }
          } catch {}
          message.success('Review submitted successfully! Thank you for your feedback.')
          onSuccess()
          onClose()
        } else {
          const msg = res.message || ''
          if (msg.toLowerCase().includes('already been reviewed') || msg.toLowerCase().includes('already reviewed')) {
            try {
              const cached = localStorage.getItem('petcare_reviewed_items')
              const arr = cached ? JSON.parse(cached) : []
              if (!arr.includes(bookingItemId)) {
                arr.push(bookingItemId)
                localStorage.setItem('petcare_reviewed_items', JSON.stringify(arr))
              }
            } catch {}
            message.info('This service has already been reviewed.')
            onSuccess()
            onClose()
          } else {
            setApiError(msg || 'Failed to submit review.')
          }
        }
      }
    } catch (err: any) {
      const errorMsg = getApiErrorMessage(err)
      if (errorMsg && (errorMsg.toLowerCase().includes('already been reviewed') || errorMsg.toLowerCase().includes('already reviewed'))) {
        try {
          const cached = localStorage.getItem('petcare_reviewed_items')
          const arr = cached ? JSON.parse(cached) : []
          if (!arr.includes(bookingItemId)) {
            arr.push(bookingItemId)
            localStorage.setItem('petcare_reviewed_items', JSON.stringify(arr))
          }
        } catch {}
        message.info('This service has already been reviewed.')
        onSuccess()
        onClose()
        return
      }
      setApiError(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleTagClick = (tag: string) => {
    const currentComment = form.getFieldValue('comment') || ''
    const newComment = currentComment
      ? `${currentComment}. ${tag}`
      : tag
    form.setFieldsValue({ comment: newComment })
  }

  const activeRatingInfo = ratingDescriptions[ratingValue] || ratingDescriptions[5]

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      destroyOnClose
      centered
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#fdf6ee',
              border: '1px solid #ebd9c8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c69f7b',
            }}
          >
            <StarFilled style={{ fontSize: 20 }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {isEditing ? 'Edit Review' : 'Service Review'}
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Your feedback helps us continuously improve our service quality
            </Text>
          </div>
        </div>
      }
    >
      <div style={{ padding: '8px 0' }}>
        {/* Service & Pet Info Box */}
        <div
          style={{
            background: 'var(--paper, #fdf9f3)',
            border: '1px solid #e8ded6',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              SERVICE BOOKED
            </Text>
            <Text strong style={{ fontSize: 15, color: '#0f172a' }}>
              {serviceName}
            </Text>
            {petName && (
              <div style={{ marginTop: 2 }}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Pet: <strong style={{ color: '#3d2d23' }}>{petName}</strong>
                </Text>
              </div>
            )}
          </div>
          <Tag color="green" icon={<CheckCircleOutlined />} style={{ padding: '4px 10px', borderRadius: 8 }}>
            Completed
          </Tag>
        </div>

        {apiError && (
          <Alert
            type="error"
            message={apiError}
            showIcon
            closable
            onClose={() => setApiError(null)}
            style={{ marginBottom: 16, borderRadius: 8 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          initialValues={{ rating: 5, comment: '' }}
          onFinish={handleFinish}
        >
          {/* Rating Stars Section */}
          <div
            style={{
              textAlign: 'center',
              padding: '16px 0',
              background: '#faf6f0',
              borderRadius: 14,
              border: '1px solid #ebd9c8',
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 14, color: '#78350f', display: 'block', marginBottom: 8 }}>
              How would you rate your experience?
            </Text>
            <Form.Item name="rating" noStyle rules={[{ required: true, message: 'Please select a rating!' }]}>
              <Rate
                style={{ fontSize: 34, color: '#c69f7b' }}
                value={ratingValue}
                onChange={(val) => setRatingValue(val)}
              />
            </Form.Item>
            <div style={{ marginTop: 10 }}>
              <Tag
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  padding: '4px 14px',
                  borderRadius: 16,
                  color: activeRatingInfo.color,
                  borderColor: activeRatingInfo.color,
                  background: '#ffffff',
                }}
              >
                {activeRatingInfo.text}
              </Tag>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                {activeRatingInfo.desc}
              </div>
            </div>
          </div>

          {/* Quick feedback tags */}
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
              Quick suggestions (click to add to review):
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {quickTags.map((tag) => (
                <Tag
                  key={tag}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 12,
                    padding: '3px 10px',
                    backgroundColor: 'var(--paper, #fdf9f3)',
                    border: '1px solid #e8ded6',
                    color: '#785839',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                  onClick={() => handleTagClick(tag)}
                >
                  + {tag}
                </Tag>
              ))}
            </div>
          </div>

          {/* Comment text area */}
          <Form.Item
            name="comment"
            label={<Text strong>Detailed Feedback</Text>}
            rules={[{ max: 1000, message: 'Feedback cannot exceed 1000 characters!' }]}
          >
            <TextArea
              rows={4}
              showCount
              maxLength={1000}
              placeholder="Share details about your pet's experience (staff care, groom quality, cleanliness, pet mood...)"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Divider style={{ margin: '16px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button onClick={onClose} disabled={submitting} style={{ borderRadius: 8 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              icon={<StarFilled style={{ color: '#c69f7b' }} />}
              style={{
                borderRadius: 8,
                backgroundColor: '#3d2d23',
                borderColor: '#3d2d23',
                color: '#ffffff',
                fontWeight: 600,
                padding: '0 24px',
                height: 38,
                boxShadow: '0 2px 8px rgba(61,45,35,0.2)',
              }}
            >
              {isEditing ? 'Update Review' : 'Submit Review'}
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  )
}
export default CreateReviewModal
