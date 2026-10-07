import React, { useRef, useState } from 'react'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { ProTable } from '@ant-design/pro-components'
import { App, Button, Popconfirm, Tag } from 'antd'
import { customerService } from '@/services/customer.service'
import type { CustomerDTO, CustomerDetailDTO } from '@/types/customer.types'
import { getApiErrorMessage } from '@/utils/apiError'
import CustomerFormModal from '@/pages/admin/customer/components/customer.form.modal'

const CustomerManagement: React.FC = () => {
  const { message } = App.useApp()
  const actionRef = useRef<ActionType>(null)
  const [modal, setModal] = useState<{ open: boolean; customer: CustomerDetailDTO | null }>({ open: false, customer: null })

  const openEdit = async (id: string) => {
    try {
      const res = await customerService.fetchById(id)
      setModal({ open: true, customer: res.result })
    } catch (e) {
      message.error(getApiErrorMessage(e))
    }
  }

  const columns: ProColumns<CustomerDTO>[] = [
    { title: 'Full Name', dataIndex: 'fullName' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Phone', dataIndex: 'phoneNumber', hideInSearch: true },
    { title: 'Total Pets', dataIndex: 'totalPets', hideInSearch: true, valueType: 'digit' },
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
        <Button key="edit" type="link" onClick={() => openEdit(r.id)}>Edit</Button>,
        <Popconfirm
          key="toggle"
          title={r.isActive ? "Deactivate this customer?" : "Activate this customer?"}
          onConfirm={async () => {
            try {
              await customerService.toggleStatus(r.id)
              message.success(r.isActive ? 'Customer deactivated' : 'Customer activated')
              actionRef.current?.reload()
            } catch (e) {
              message.error(getApiErrorMessage(e))
            }
          }}
        >
          <a style={{ color: r.isActive ? 'red' : 'green' }}>{r.isActive ? 'Deactivate' : 'Activate'}</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <>
      <ProTable<CustomerDTO>
        headerTitle="Customers"
        rowKey="id"
        cardBordered
        columns={columns}
        actionRef={actionRef}
        request={async (params) => {
          const { current = 1, pageSize = 10, fullName, email, isActive } = params
          try {
            const res = await customerService.fetchWithPagination({
              pageNumber: current,
              pageSize,
              searchTerm: (fullName as string) || (email as string) || undefined,
              isActive: isActive !== undefined ? String(isActive) === 'true' : undefined
            })
            return { data: res.result.items, success: true, total: res.result.totalCount }
          } catch (e) {
            message.error(getApiErrorMessage(e))
            return { data: [], success: false, total: 0 }
          }
        }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        toolBarRender={() => [
          <Button key="add" type="primary" onClick={() => setModal({ open: true, customer: null })}>
            Add customer
          </Button>,
        ]}
      />
      {modal.open && (
        <CustomerFormModal
          open={modal.open}
          customer={modal.customer}
          onClose={() => setModal({ open: false, customer: null })}
          onSuccess={() => { setModal({ open: false, customer: null }); actionRef.current?.reload() }}
        />
      )}
    </>
  )
}

export default CustomerManagement
