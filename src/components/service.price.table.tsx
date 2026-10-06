import React from 'react'
import { Table } from 'antd'
import { PRICING_UNIT_LABELS, type ServicePriceDTO } from '@/types/service.types'
import { formatVnd, weightLabel } from '@/utils/format'

const ServicePriceTable: React.FC<{ prices: ServicePriceDTO[] }> = ({ prices }) => (
  <Table<ServicePriceDTO>
    rowKey={(r) => r.id ?? `${r.minWeight}-${r.maxWeight}-${r.price}`}
    dataSource={prices}
    pagination={false}
    locale={{ emptyText: 'No prices yet' }}
    columns={[
      { title: 'Weight', render: (_, r) => weightLabel(r.minWeight, r.maxWeight) },
      { title: 'Price', render: (_, r) => `${formatVnd(r.price)} / ${PRICING_UNIT_LABELS[r.pricingUnit] ?? r.pricingUnit}` },
    ]}
  />
)

export default ServicePriceTable
