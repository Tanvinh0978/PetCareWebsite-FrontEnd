import React, { useState, useEffect } from 'react'
import { DogIcon, CatIcon } from '@/components/common/PetIcons'
import {
  Modal,
  Form,
  Input,
  Button,
  Typography,
  Tag,
  Space,
  Alert,
  Divider,
  Row,
  Col,
  message,
} from 'antd'
import {
  CheckCircleFilled,
  CameraOutlined,
  HeartFilled,
  WarningOutlined,
  ScissorOutlined,
  UserOutlined,
  HomeOutlined,
} from '@ant-design/icons'
import ImageUpload from '@/components/common/ImageUpload'
import groomingTaskService from '@/services/groomingTask.service'
import type { GroomingTaskResponseDTO } from '@/types/groomingTask.types'
import { normalizeStatus } from '@/types/groomingTask.types'

const { Text, Title } = Typography
const { TextArea } = Input

interface CompleteGroomingTaskModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  task: GroomingTaskResponseDTO | null
}

const quickTags = [
  'Very well-behaved & gentle',
  'Nails trimmed & filed',
  'Ears cleaned thoroughly',
  'Anal glands expressed',
  'Round teddy bear cut applied',
  'Matted fur brushed & untangled',
  'Mild skin redness - please monitor',
  'Sensitive to loud blow dryer',
]

export const CompleteGroomingTaskModal: React.FC<CompleteGroomingTaskModalProps> = ({
  open,
  onClose,
  onSuccess,
  task,
}) => {
  const [form] = Form.useForm()
  const [beforeImage, setBeforeImage] = useState<string>('')
  const [resultImage, setResultImage] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (open && task) {
      setErrorMsg(null)
      setBeforeImage(task.beforeImageUrl || '')
      setResultImage(task.resultImageUrl || '')
      form.setFieldsValue({
        resultNote: task.resultNote || '',
      })
    }
  }, [open, task, form])

  if (!task) return null

  const handleTagClick = (tag: string) => {
    const currentNote = form.getFieldValue('resultNote') || ''
    const newNote = currentNote ? `${currentNote}. ${tag}` : tag
    form.setFieldsValue({ resultNote: newNote })
  }

  const handleSubmit = async (values: { resultNote?: string }) => {
    setSubmitting(true)
    setErrorMsg(null)
    try {
      const currentStatus = normalizeStatus(task.status)

      // Ensure backend status transitions are respected (1 -> 2 -> 3 -> 4)
      if (currentStatus === 1 || currentStatus === 0) {
        await groomingTaskService.updateTaskStatus(task.bookingId, task.itemId, {
          status: 2,
          roomId: task.roomId || undefined,
        })
        await groomingTaskService.updateTaskStatus(task.bookingId, task.itemId, {
          status: 3,
          roomId: task.roomId || undefined,
        })
      } else if (currentStatus === 2) {
        await groomingTaskService.updateTaskStatus(task.bookingId, task.itemId, {
          status: 3,
          roomId: task.roomId || undefined,
        })
      }

      await groomingTaskService.updateTaskStatus(task.bookingId, task.itemId, {
        status: 4, // Completed
        resultNote: values.resultNote?.trim() || 'Service completed successfully.',
        beforeImageUrl: beforeImage || null,
        resultImageUrl: resultImage || null,
        roomId: task.roomId || undefined,
      })

      message.success(`Grooming session for ${task.petName} has been completed successfully!`)
      onSuccess()
      onClose()
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update grooming task status.'
      setErrorMsg(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const isDog = task.petSpecies === 0 || String(task.petSpecies).toLowerCase() === 'dog'

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnClose
      centered
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              fontSize: 20,
            }}
          >
            <CheckCircleFilled />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
              Complete & Hand Over Service Session
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Record grooming outcomes and before/after photos to hand over to reception & pet owner
            </Text>
          </div>
        </div>
      }
    >
      <div style={{ padding: '12px 0' }}>
        {/* Task Summary Banner */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isDog ? <DogIcon size={24} /> : <CatIcon size={24} />}
                <Text strong style={{ fontSize: 17, color: '#0f172a' }}>
                  {task.petName}
                </Text>
                {task.petBreed && (
                  <Tag color="blue" style={{ borderRadius: 6, margin: 0 }}>
                    {task.petBreed}
                  </Tag>
                )}
                <Tag color="cyan" style={{ borderRadius: 6, margin: 0 }}>
                  {task.petWeight} kg
                </Tag>
              </div>

              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: '#475569' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <ScissorOutlined style={{ color: '#059669' }} />
                  <strong>Service:</strong> {task.serviceName}
                </span>
                {task.roomName && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <HomeOutlined style={{ color: '#d97706' }} />
                    <strong>Station:</strong> {task.roomName}
                  </span>
                )}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <UserOutlined style={{ color: '#6366f1' }} />
                  <strong>Owner:</strong> {task.customerName} ({task.customerPhone})
                </span>
              </div>
            </div>

            {normalizeStatus(task.status) === 4 ? (
              <Tag color="success" style={{ padding: '4px 10px', borderRadius: 8, fontWeight: 600 }}>
                Completed
              </Tag>
            ) : normalizeStatus(task.status) === 3 ? (
              <Tag color="processing" style={{ padding: '4px 10px', borderRadius: 8, fontWeight: 600 }}>
                In Progress
              </Tag>
            ) : normalizeStatus(task.status) === 2 ? (
              <Tag color="warning" style={{ padding: '4px 10px', borderRadius: 8, fontWeight: 600 }}>
                Ready / Checked-In
              </Tag>
            ) : (
              <Tag color="blue" style={{ padding: '4px 10px', borderRadius: 8, fontWeight: 600 }}>
                Confirmed
              </Tag>
            )}
          </div>

          {/* Health Alert Note if present */}
          {task.petHealthNotes && (
            <div
              style={{
                marginTop: 12,
                padding: '8px 12px',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: '#92400e',
              }}
            >
              <WarningOutlined style={{ color: '#d97706', fontSize: 15 }} />
              <span>
                <strong>Special Pet Notice:</strong> {task.petHealthNotes}
              </span>
            </div>
          )}
        </div>

        {errorMsg && (
          <Alert
            type="error"
            message={errorMsg}
            showIcon
            closable
            onClose={() => setErrorMsg(null)}
            style={{ marginBottom: 16, borderRadius: 8 }}
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Images Section */}
          <div style={{ marginBottom: 20 }}>
            <Text strong style={{ fontSize: 14, color: '#1e293b', display: 'block', marginBottom: 8 }}>
              Pet Photos (Before & After Service)
            </Text>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '14px',
                    background: '#f8fafc',
                    textAlign: 'center',
                  }}
                >
                  <Text strong style={{ display: 'block', marginBottom: 6, color: '#334155' }}>
                    1. Before Service Photo (Before)
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 10 }}>
                    Coat & condition upon check-in
                  </Text>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ImageUpload
                      value={beforeImage}
                      onChange={(url) => setBeforeImage(url)}
                      folder="grooming-results"
                      width={180}
                      height={180}
                      title="Upload / Take Before Photo"
                      helperText="JPG, PNG, WEBP up to 5MB"
                    />
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12}>
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '14px',
                    background: '#f0fdf4',
                    textAlign: 'center',
                  }}
                >
                  <Text strong style={{ display: 'block', marginBottom: 6, color: '#065f46' }}>
                    2. After Service Photo (After) ⭐
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 10 }}>
                    Styled, cleaned, and finished result
                  </Text>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ImageUpload
                      value={resultImage}
                      onChange={(url) => setResultImage(url)}
                      folder="grooming-results"
                      width={180}
                      height={180}
                      title="Upload / Take After Photo"
                      helperText="Final result photo for owner"
                    />
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* Quick Tags Suggestions */}
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
              Quick note suggestions (Click to append):
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {quickTags.map((tag) => (
                <Tag
                  key={tag}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 12,
                    padding: '3px 10px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    fontSize: 12,
                  }}
                  onClick={() => handleTagClick(tag)}
                >
                  + {tag}
                </Tag>
              ))}
            </div>
          </div>

          {/* Result Note */}
          <Form.Item
            name="resultNote"
            label={<Text strong>Care Notes & Result Feedback</Text>}
            rules={[
              { required: true, message: 'Please provide care notes or result feedback!' },
              { max: 1000, message: 'Notes cannot exceed 1000 characters!' },
            ]}
          >
            <TextArea
              rows={4}
              showCount
              maxLength={1000}
              placeholder="e.g. Pet was very well-behaved and gentle. Ears cleaned thoroughly, nails trimmed and round teddy bear style applied. Sensitive to loud dryer so low heat mode was used..."
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Divider style={{ margin: '16px 0' }} />

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button onClick={onClose} disabled={submitting} style={{ borderRadius: 8 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              icon={<HeartFilled />}
              style={{
                borderRadius: 8,
                backgroundColor: '#059669',
                borderColor: '#059669',
                fontWeight: 600,
                padding: '0 24px',
                height: 40,
              }}
            >
              Save & Notify Reception
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  )
}

export default CompleteGroomingTaskModal
