import React, { useEffect, useState } from 'react'
import { App, Form, Input, Modal } from 'antd'
import { customerService } from '@/services/customer.service'
import type { CustomerDetailDTO } from '@/types/customer.types'
import { getApiErrorMessage } from '@/utils/apiError'

interface Props {
  open: boolean
  customer: CustomerDetailDTO | null
  onClose: () => void
  onSuccess: () => void
}

const CustomerFormModal: React.FC<Props> = ({ open, customer, onClose, onSuccess }) => {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)
  const isEdit = !!customer

  useEffect(() => {
    if (open) {
      if (isEdit) {
        form.setFieldsValue({
          fullName: customer.fullName,
          email: customer.email,
          phoneNumber: customer.phoneNumber,
          address: customer.address,
        })
      } else {
        form.resetFields()
      }
    }
  }, [open, customer, form, isEdit])

  const onFinish = async (values: any) => {
    try {
      setSubmitting(true)
      if (isEdit) {
        await customerService.update(customer.id, {
          id: customer.id,
          fullName: values.fullName,
          phoneNumber: values.phoneNumber,
          address: values.address,
        })
        message.success('Customer updated successfully')
      } else {
        await customerService.create(values)
        message.success('Customer created successfully')
      }
      onSuccess()
    } catch (e) {
      message.error(getApiErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Customer' : 'Add Customer'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
          <Input disabled={isEdit} />
        </Form.Item>
        {!isEdit && (
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
        )}
        <Form.Item name="phoneNumber" label="Phone Number" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="address" label="Address">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CustomerFormModal
