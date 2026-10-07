import React from 'react'
import { ModalForm, ProFormText, ProFormTextArea } from '@ant-design/pro-components'
import { App } from 'antd'
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
  const { message } = App.useApp()
  const isEdit = !!customer

  const initialValues = customer
    ? {
        fullName: customer.fullName,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
        address: customer.address,
      }
    : {}

  return (
    <ModalForm<Record<string, any>>
      title={isEdit ? 'Edit customer' : 'Add customer'}
      open={open}
      width={720}
      initialValues={initialValues}
      modalProps={{ destroyOnHidden: true, onCancel: onClose }}
      onOpenChange={(visible) => { if (!visible) onClose() }}
      onFinish={async (values) => {
        try {
          if (isEdit) {
            await customerService.update(customer.id, {
              id: customer.id,
              fullName: values.fullName,
              phoneNumber: values.phoneNumber,
              address: values.address,
            })
            message.success('Customer updated successfully')
          } else {
            await customerService.create(values as any)
            message.success('Customer created successfully')
          }
          onSuccess()
          return true
        } catch (e) {
          message.error(getApiErrorMessage(e))
          return false
        }
      }}
    >

      <ProFormText name="fullName" label="Full name" rules={[{ required: true }]} />
      <ProFormText name="email" label="Email" rules={[{ required: true, type: 'email' }]} disabled={isEdit} />
      {!isEdit && (
        <ProFormText.Password name="password" label="Password" rules={[{ required: true }]} />
      )}
      <ProFormText name="phoneNumber" label="Phone number" rules={[{ required: true }]} />
      <ProFormTextArea name="address" label="Address" />
    </ModalForm>
  )
}

export default CustomerFormModal
