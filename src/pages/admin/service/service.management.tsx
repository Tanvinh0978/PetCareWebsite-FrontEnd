import React, { useRef, useState } from 'react'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { ProTable } from '@ant-design/pro-components'
import { App, Button, Popconfirm, Tag } from 'antd'
import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { serviceService } from '@/services/service.service'
import { SERVICE_TYPE_LABELS, type ServiceDTO, type ServiceDetailDTO } from '@/types/service.types'
import { getApiErrorMessage } from '@/utils/apiError'
import ServiceFormModal from '@/pages/admin/service/components/service.form.modal'

const ServiceManagement: React.FC = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const actionRef = useRef<ActionType>(null)
  const [modal, setModal] = useState<{ open: boolean; service: ServiceDetailDTO | null }>({ open: false, service: null })

  const openEdit = async (id: string) => {
    try {
      const res = await serviceService.fetchById(id)
      setModal({ open: true, service: res.result })
    } catch (e) {
      message.error(getApiErrorMessage(e))
    }
  }

  const columns: ProColumns<ServiceDTO>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (_, r) => <a onClick={() => navigate(`/admin/services/${r.id}`)}>{r.name}</a>,
    },
    { title: 'Description', dataIndex: 'description', hideInSearch: true, ellipsis: true },
    {
      title: 'Type',
      dataIndex: 'serviceType',
      valueType: 'select',
      valueEnum: Object.fromEntries(Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => [k, { text: v }])),
      render: (_, r) => <Tag color="green">{SERVICE_TYPE_LABELS[r.serviceType] ?? r.serviceType}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      valueType: 'select',
      valueEnum: { true: { text: 'Active' }, false: { text: 'Inactive' } },
      render: (_, r) => <Tag color={r.isActive ? 'green' : 'default'}>{r.isActive ? 'Active' : 'Inactive'}</Tag>,
    },
    {
      title: 'Action',
      valueType: 'option',
      width: 220,
      render: (_, r) => [
        <Button key="view" type="link" icon={<EyeOutlined />} onClick={() => navigate(`/admin/services/${r.id}`)}>View</Button>,
        <Button key="edit" type="link" onClick={() => openEdit(r.id)}>Edit</Button>,
        r.isActive && (
          <Popconfirm
            key="delete"
            title="Deactivate this service?"
            onConfirm={async () => {
              try {
                await serviceService.remove(r.id)
                message.success('Service deactivated')
                actionRef.current?.reload()
              } catch (e) {
                message.error(getApiErrorMessage(e))
              }
            }}
          >
            <a style={{ color: 'red' }}>Delete</a>
          </Popconfirm>
        ),
      ],
    },
  ]

  return (
    <>
      <ProTable<ServiceDTO>
        headerTitle="Services"
        rowKey="id"
        cardBordered
        columns={columns}
        actionRef={actionRef}
        request={async (params) => {
          const { current = 1, pageSize = 10, name, serviceType, isActive } = params
          try {
            const all = await serviceService.fetchAllForAdmin()
            const kw = (name as string | undefined)?.trim().toLowerCase()
            const filtered = all.filter((s) =>
              (!serviceType || s.serviceType === serviceType) &&
              (isActive === undefined || String(s.isActive) === String(isActive)) &&
              (!kw || s.name.toLowerCase().includes(kw) || (s.description ?? '').toLowerCase().includes(kw)))
            return { data: filtered.slice((current - 1) * pageSize, current * pageSize), success: true, total: filtered.length }
          } catch (e) {
            message.error(getApiErrorMessage(e))
            return { data: [], success: false, total: 0 }
          }
        }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => setModal({ open: true, service: null })}>
            Add service
          </Button>,
        ]}
      />
      <ServiceFormModal
        open={modal.open}
        service={modal.service}
        onClose={() => setModal({ open: false, service: null })}
        onSuccess={() => { setModal({ open: false, service: null }); actionRef.current?.reload() }}
      />
    </>
  )
}

export default ServiceManagement
