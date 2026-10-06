import React from 'react'
import {
  ModalForm, ProFormDigit, ProFormGroup, ProFormList, ProFormSelect, ProFormSwitch, ProFormText, ProFormTextArea,
} from '@ant-design/pro-components'
import { App } from 'antd'
import { serviceService } from '@/services/service.service'
import {
  PRICING_UNIT_LABELS, SERVICE_TYPE_LABELS, type ServiceDetailDTO, type ServicePriceDTO,
} from '@/types/service.types'
import { getApiErrorMessage } from '@/utils/apiError'

interface FormValues {
  name: string
  description?: string
  serviceType: string
  isActive?: boolean
  prices?: { minWeight?: number | null; maxWeight?: number | null; price: number; pricingUnit: string }[]
}

interface Props {
  open: boolean
  service: ServiceDetailDTO | null // null = thêm mới, có giá trị = sửa
  onClose: () => void
  onSuccess: () => void
}

const toOptions = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }))

// Một modal dùng cho cả thêm và sửa (khác dự án mẫu, vì hai form giống nhau).
const ServiceFormModal: React.FC<Props> = ({ open, service, onClose, onSuccess }) => {
  const { message } = App.useApp()
  const editing = Boolean(service)

  const initialValues: FormValues = service
    ? { name: service.name, description: service.description, serviceType: service.serviceType, isActive: service.isActive, prices: service.prices }
    : { serviceType: 'Grooming', name: '', prices: [{ pricingUnit: 'Per_Turn', price: 0 }] }

  return (
    <ModalForm<FormValues>
      title={editing ? 'Edit service' : 'Add service'}
      open={open}
      width={720}
      initialValues={initialValues}
      modalProps={{ destroyOnHidden: true, onCancel: onClose }}
      onOpenChange={(visible) => { if (!visible) onClose() }}
      onFinish={async (values) => {
        const prices: ServicePriceDTO[] = (values.prices ?? []).map((p) => ({
          minWeight: p.minWeight ?? null, maxWeight: p.maxWeight ?? null, price: p.price, pricingUnit: p.pricingUnit,
        }))
        const bad = prices.findIndex((p) => p.minWeight !== null && p.maxWeight !== null && p.maxWeight <= p.minWeight)
        if (bad >= 0) {
          message.error(`Price ${bad + 1}: maximum weight must be greater than minimum.`)
          return false
        }
        const payload = { name: values.name.trim(), description: values.description ?? '', serviceType: values.serviceType, prices }
        try {
          if (service) await serviceService.update(service.id, { ...payload, isActive: values.isActive ?? true })
          else await serviceService.create(payload)
          message.success(editing ? 'Service updated' : 'Service created')
          onSuccess()
          return true
        } catch (e) {
          message.error(getApiErrorMessage(e))
          return false
        }
      }}
    >
      <ProFormText name="name" label="Service name" rules={[{ required: true, max: 150 }]} />
      <ProFormSelect name="serviceType" label="Service type" options={toOptions(SERVICE_TYPE_LABELS)} rules={[{ required: true }]} allowClear={false} />
      <ProFormTextArea name="description" label="Description" />
      {editing && <ProFormSwitch name="isActive" label="Active" />}
      <ProFormList name="prices" label="Pricing" creatorButtonProps={{ creatorButtonText: 'Add price' }} copyIconProps={false}>
        <ProFormGroup>
          <ProFormDigit name="minWeight" label="Min (kg)" min={0} width="xs" />
          <ProFormDigit name="maxWeight" label="Max (kg)" min={0} width="xs" />
          <ProFormDigit name="price" label="Price (VND)" min={0} width="sm" rules={[{ required: true }]} />
          <ProFormSelect name="pricingUnit" label="Unit" options={toOptions(PRICING_UNIT_LABELS)} width="xs" allowClear={false} />
        </ProFormGroup>
      </ProFormList>
    </ModalForm>
  )
}

export default ServiceFormModal
