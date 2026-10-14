import { useEffect, useState } from 'react'
import { Button, Form, Input, message, Modal, Space, Typography } from 'antd'
import { HeartOutlined } from '@ant-design/icons'
import ImageUpload from '@/components/common/ImageUpload'
import careRecordService from '@/services/careRecord.service'
import type { BoardingTaskResponseDTO } from '@/types/boardingTask.types'

const { Text } = Typography
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
    <Modal
      open={open}
      title={<Space><HeartOutlined /> Daily care log {task ? `· ${task.petName}` : ''}</Space>}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={620}
    >
      <Text type="secondary">Record today’s health, meals, and care details for this boarding stay.</Text>

      {task?.dietServiceName && (
        <div
          style={{
            marginTop: 12,
            padding: '8px 12px',
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

      <Form form={form} layout="vertical" onFinish={submit} style={{ marginTop: 20 }}>
        <Form.Item
          name="healthStatus"
          label="Latest health status"
          rules={[{ required: true, whitespace: true, message: 'Enter the pet’s current health status.' }]}
        >
          <TextArea rows={3} maxLength={500} showCount placeholder="e.g. Healthy, ate all food, and drank plenty of water" />
        </Form.Item>
        <Form.Item name="note" label="Care notes">
          <TextArea rows={4} maxLength={1500} showCount placeholder="Meals, walks, cleaning, medication, or anything the owner should know" />
        </Form.Item>
        <Form.Item label="Photo (optional)">
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={saving}>Save care log</Button>
        </div>
      </Form>
    </Modal>
  )
}
