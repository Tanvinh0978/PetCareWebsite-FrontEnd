import { useEffect, useState } from 'react'
import { Button, Form, Input, message, Modal } from 'antd'
import { HeartOutlined } from '@ant-design/icons'
import ImageUpload from '@/components/common/ImageUpload'
import careRecordService from '@/services/careRecord.service'
import type { BoardingTaskResponseDTO } from '@/types/boardingTask.types'

const { TextArea } = Input

interface Props {
  open: boolean
  task: BoardingTaskResponseDTO | null
  onClose: () => void
  onSuccess: () => void
}

export default function CreateCareRecordModal({ open, task, onClose, onSuccess }: Props) {
  const [form] = Form.useForm<{ healthStatus: string; note: string }>()
  const [imageUrl, setImageUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      form.resetFields()
      setImageUrl('')
    }
  }, [open, task?.itemId, form])

  const submit = async (values: { healthStatus: string; note: string }) => {
    if (!task) return
    setSaving(true)
    try {
      await careRecordService.create({
        bookingItemId: task.itemId,
        healthStatus: values.healthStatus.trim(),
        note: values.note?.trim() ?? '',
        ...(imageUrl ? { imageUrl } : {}),
      })
      message.success(`Care log saved for ${task.petName}.`)
      onSuccess()
      onClose()
    } catch (error: any) {
      message.error(error?.response?.data?.message || error?.message || 'Could not save the care log.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <style>{`
        .haven-care-modal .ant-modal-content {
          border-radius: 20px !important;
          border: 1.5px solid #eeddc8 !important;
          background-color: #ffffff !important;
          box-shadow: 0 20px 48px rgba(61, 45, 35, 0.16) !important;
          padding: 24px 28px !important;
        }
        .haven-care-modal .ant-modal-header {
          margin-bottom: 20px !important;
          padding-bottom: 16px !important;
          border-bottom: 1px solid #eeddc8 !important;
          background: transparent !important;
        }
        .haven-care-modal .ant-modal-close {
          top: 22px !important;
          right: 22px !important;
          color: #8c735f !important;
          border-radius: 50% !important;
          transition: all 0.2s ease !important;
        }
        .haven-care-modal .ant-modal-close:hover {
          background-color: #faf6f0 !important;
          color: #3d2d23 !important;
        }
      `}</style>

      <Modal
        wrapClassName="haven-care-modal"
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
                Daily Care Log {task ? `· ${task.petName}` : ''}
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#8c735f', fontWeight: 400 }}>
                Record today’s health observations, meals, and care details for this guest.
              </p>
            </div>
          </div>
        }
        onCancel={onClose}
        footer={null}
        destroyOnClose
        width={640}
        centered
      >
        {task?.dietServiceName && (
          <div
            style={{
              marginBottom: 16,
              padding: '10px 14px',
              backgroundColor: '#fffbf5',
              borderRadius: 12,
              border: '1.5px solid #fed7aa',
              fontSize: 13,
            }}
          >
            <span style={{ color: '#c2410c', fontWeight: 700 }}>Diet add-on: </span>
            <span style={{ color: '#9a3412', fontWeight: 600 }}>{task.dietServiceName}</span>
            {task.dietPrice ? (
              <span style={{ color: '#c2410c', fontSize: 12, marginLeft: 6 }}>
                ({task.dietPrice.toLocaleString()} VND)
              </span>
            ) : null}
          </div>
        )}

        <Form form={form} layout="vertical" onFinish={submit} style={{ marginTop: 14 }}>
          <Form.Item
            name="healthStatus"
            label={
              <span style={{ fontWeight: 600, color: '#3d2d23', fontSize: 13 }}>
                Latest health status <span style={{ color: '#dc2626' }}>*</span>
              </span>
            }
            rules={[{ required: true, whitespace: true, message: 'Enter the pet’s current health status.' }]}
          >
            <TextArea
              rows={3}
              maxLength={500}
              showCount
              placeholder="e.g. Healthy, energetic, ate all food, and drank plenty of water"
              style={{
                borderRadius: 10,
                border: '1.5px solid #eeddc8',
                padding: '8px 12px',
              }}
            />
          </Form.Item>

          <Form.Item
            name="note"
            label={<span style={{ fontWeight: 600, color: '#3d2d23', fontSize: 13 }}>Care notes</span>}
          >
            <TextArea
              rows={4}
              maxLength={1500}
              showCount
              placeholder="Meals, walks, playtime, cleaning, medication, or anything the pet parent should know"
              style={{
                borderRadius: 10,
                border: '1.5px solid #eeddc8',
                padding: '8px 12px',
              }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#3d2d23', fontSize: 13 }}>Care photo (optional)</span>}
          >
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              folder="care-records"
              width={112}
              height={112}
              title="Care photo"
              helperText="Optional · JPG, PNG, or WEBP up to 5MB"
              disabled={saving}
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <Button
              onClick={onClose}
              disabled={saving}
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
              htmlType="submit"
              loading={saving}
              style={{
                borderRadius: 999,
                backgroundColor: '#3d2d23',
                borderColor: '#3d2d23',
                color: '#ffffff',
                fontWeight: 600,
                height: 40,
                padding: '0 28px',
                boxShadow: '0 4px 12px rgba(61,45,35,0.2)',
              }}
            >
              Save care log
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  )
}
