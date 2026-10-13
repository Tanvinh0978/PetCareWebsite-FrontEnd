import { useEffect, useMemo, useState } from 'react'
import { Button, Card, DatePicker, Form, Select, Space, Spin, Typography, message } from 'antd'
import { ArrowLeftOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { bookingService } from '@/services/booking.service'
import { customerService } from '@/services/customer.service'
import { petService } from '@/services/pet.service'
import { serviceService } from '@/services/service.service'
import type { CustomerDTO } from '@/types/customer.types'
import type { PetDTO } from '@/types/pet.types'
import type { ServiceDTO } from '@/types/service.types'
import { getApiErrorMessage } from '@/utils/apiError'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

interface FormValues {
  customerId: string
  petId: string
  serviceId: string
  appointmentAt?: Dayjs
  boardingDates?: [Dayjs, Dayjs]
}

export default function CounterBookingPage() {
  const [form] = Form.useForm<FormValues>()
  const navigate = useNavigate()
  const location = useLocation()
  const base = location.pathname.startsWith('/admin') ? '/admin/bookings' : '/staff/bookings'
  const [customers, setCustomers] = useState<CustomerDTO[]>([])
  const [pets, setPets] = useState<PetDTO[]>([])
  const [services, setServices] = useState<ServiceDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [petsLoading, setPetsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const selectedCustomerId = Form.useWatch('customerId', form)
  const selectedServiceId = Form.useWatch('serviceId', form)
  const selectedService = useMemo(() => services.find((service) => service.id === selectedServiceId), [services, selectedServiceId])
  const isBoarding = String(selectedService?.serviceType).toLowerCase() === 'boarding' || String(selectedService?.serviceType) === '1'

  useEffect(() => {
    Promise.all([
      customerService.fetchWithPagination({ pageNumber: 1, pageSize: 100, isActive: true }),
      serviceService.fetchActive(),
    ]).then(([customerResponse, activeServices]) => {
      setCustomers(customerResponse.result?.items ?? [])
      setServices(activeServices.filter((service) => {
        const type = String(service.serviceType).toLowerCase()
        return ['grooming', 'boarding', '0', '1'].includes(type)
      }))
    }).catch((error) => message.error(getApiErrorMessage(error, 'Could not load customers or services.')))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedCustomerId) {
      setPets([])
      return
    }
    let active = true
    setPetsLoading(true)
    petService.fetchByCustomerId(selectedCustomerId)
      .then((customerPets) => { if (active) setPets(customerPets.filter((pet) => pet.isActive)) })
      .catch((error) => { if (active) message.error(getApiErrorMessage(error, 'Could not load this customer’s pets.')) })
      .finally(() => { if (active) setPetsLoading(false) })
    return () => { active = false }
  }, [selectedCustomerId])

  const submit = async (values: FormValues) => {
    if (!values.customerId) return message.warning('Choose a customer for this booking.')
    if (!values.petId || !values.serviceId) return message.warning('Choose a pet and service.')
    if (isBoarding && !selectedService?.roomTypeId) {
      return message.error(`Boarding service "${selectedService?.name}" has no room type linked. Please choose another service or contact an administrator.`)
    }
    const start = isBoarding ? values.boardingDates?.[0] : values.appointmentAt
    const end = isBoarding ? values.boardingDates?.[1] : undefined
    if (!start) return message.warning('Choose an appointment date and time.')

    const quantity = isBoarding && end ? Math.max(1, end.startOf('day').diff(start.startOf('day'), 'day')) : 1
    setSaving(true)
    try {
      await bookingService.create({
        customerId: values.customerId,
        paymentChoice: 'PAY_AT_COUNTER',
        bookingItems: [{
          petId: values.petId,
          serviceId: values.serviceId,
          scheduledStartAt: start.toISOString(),
          scheduledEndAt: end?.toISOString() ?? null,
          quantity,
        }],
      })
      message.success('Walk-in booking created. Payment is due at the counter.')
      navigate(base)
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Could not create the walk-in booking.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}><Spin size="large" /></div>

  return (
    <section className="page narrow counter-booking-page">
      <div className="page-head">
        <div>
          <Title level={2} style={{ margin: 0 }}>Walk-in Booking</Title>
          <Text type="secondary">Create a counter booking for a customer who arrived in person.</Text>
        </div>
        <Link to={base} className="btn btn-secondary"><ArrowLeftOutlined /> Back to bookings</Link>
      </div>

      <Card className="counter-booking-card" bordered={false}>
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item name="customerId" label="Customer" rules={[{ required: true, message: 'Select the customer.' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Search by customer name, email, or phone"
              options={customers.map((customer) => ({
                value: customer.id,
                label: `${customer.fullName} · ${customer.phoneNumber || customer.email}`,
              }))}
              onChange={() => { form.setFieldsValue({ petId: undefined }); setPets([]) }}
            />
          </Form.Item>

          <Form.Item name="petId" label="Pet" rules={[{ required: true, message: 'Select a pet.' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              loading={petsLoading}
              disabled={!selectedCustomerId}
              placeholder={selectedCustomerId ? 'Select this customer’s pet' : 'Select a customer first'}
              options={pets.map((pet) => ({ value: pet.id, label: `${pet.name} · ${pet.weight} kg` }))}
            />
          </Form.Item>

          <Form.Item name="serviceId" label="Service" rules={[{ required: true, message: 'Select a service.' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Choose Grooming or Boarding"
              options={services.map((service) => ({ value: service.id, label: `${service.name} · ${service.serviceType}` }))}
              onChange={() => form.setFieldsValue({ appointmentAt: undefined, boardingDates: undefined })}
            />
          </Form.Item>

          {isBoarding ? (
            <Form.Item name="boardingDates" label="Check-in and check-out" rules={[{ required: true, message: 'Select the boarding dates.' }]}>
              <RangePicker showTime style={{ width: '100%' }} disabledDate={(current) => current.isBefore(dayjs().startOf('day'))} />
            </Form.Item>
          ) : (
            <Form.Item name="appointmentAt" label="Appointment date and time" rules={[{ required: true, message: 'Select the appointment date and time.' }]}>
              <DatePicker showTime style={{ width: '100%' }} placeholder="Select date and time" disabledDate={(current) => current.isBefore(dayjs().startOf('day'))} />
            </Form.Item>
          )}

          <div className="counter-booking-payment">
            <CalendarOutlined /> <span>Payment method</span> <strong>Pay at counter</strong>
          </div>
          <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 20 }}>
            <Button onClick={() => navigate(base)}>Cancel</Button>
            <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />} loading={saving}>Create booking</Button>
          </Space>
        </Form>
      </Card>
    </section>
  )
}
