import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  Select,
  Spin,
  Tooltip,
  message,
} from 'antd'
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarCircleOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  PhoneOutlined,
  ScissorOutlined,
  ShopOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { bookingService, type BookingItemPayload } from '@/services/booking.service'
import { customerService } from '@/services/customer.service'
import { petService } from '@/services/pet.service'
import { serviceService } from '@/services/service.service'
import { DogIcon, CatIcon } from '@/components/common/PetIcons'
import type { CustomerDTO } from '@/types/customer.types'
import type { PetDTO } from '@/types/pet.types'
import type { ServiceDTO } from '@/types/service.types'
import { getApiErrorMessage } from '@/utils/apiError'
import { useAuthStore } from '@/store/useAuthStore'
import { hasPermission, PERMISSIONS } from '@/auth/permissionHelper'
import { isServiceCompatibleWithPet, getRoomTierInfo, isPetCat } from '@/utils/petServiceFilter'

const { RangePicker } = DatePicker
const { TextArea } = Input

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

type BookingCategory = 'Grooming' | 'Boarding'

export default function CounterBookingPage() {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const location = useLocation()
  const base = location.pathname.startsWith('/admin') ? '/admin/bookings' : '/staff/bookings'

  const currentUser = useAuthStore((s) => s.user)
  const canCreate = hasPermission(currentUser, PERMISSIONS.BOOKING_CREATE)

  const [customers, setCustomers] = useState<CustomerDTO[]>([])
  const [pets, setPets] = useState<PetDTO[]>([])
  const [services, setServices] = useState<ServiceDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [petsLoading, setPetsLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
  const [category, setCategory] = useState<BookingCategory>('Grooming')

  // Grooming state
  const [selectedGroomingIds, setSelectedGroomingIds] = useState<string[]>([])
  const [appointmentAt, setAppointmentAt] = useState<Dayjs | null>(null)

  // Boarding state
  const [selectedBoardingId, setSelectedBoardingId] = useState<string | null>(null)
  const [selectedDietId, setSelectedDietId] = useState<string | null>(null)
  const [boardingDates, setBoardingDates] = useState<[Dayjs, Dayjs] | null>(null)

  // Staff note
  const [note, setNote] = useState<string>('')

  // Load Customers and Services with details
  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      customerService.fetchWithPagination({ pageNumber: 1, pageSize: 150, isActive: true }),
      serviceService.fetchActive(),
    ])
      .then(async ([customerResponse, activeServices]) => {
        if (!active) return
        setCustomers(customerResponse.result?.items ?? [])

        // Fetch detailed prices and room links for all active services
        const servicesWithDetails = await Promise.all(
          activeServices.map(async (srv) => {
            try {
              const detailRes: any = await serviceService.fetchById(srv.id)
              return detailRes.result || detailRes.data || detailRes
            } catch {
              return srv
            }
          })
        )
        if (active) {
          setServices(servicesWithDetails)
        }
      })
      .catch((error) => {
        if (active) {
          message.error(getApiErrorMessage(error, 'Could not load customer or service records.'))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  // Load pets whenever customer selection changes
  useEffect(() => {
    if (!selectedCustomerId) {
      setPets([])
      setSelectedPetId(null)
      return
    }
    let active = true
    setPetsLoading(true)
    petService
      .fetchByCustomerId(selectedCustomerId)
      .then((customerPets) => {
        if (active) {
          const activePets = customerPets.filter((pet) => pet.isActive)
          setPets(activePets)
          if (activePets.length === 1) {
            setSelectedPetId(activePets[0].id)
          } else {
            setSelectedPetId(null)
          }
        }
      })
      .catch((error) => {
        if (active) {
          message.error(getApiErrorMessage(error, 'Could not load pets for this customer.'))
        }
      })
      .finally(() => {
        if (active) setPetsLoading(false)
      })

    return () => {
      active = false
    }
  }, [selectedCustomerId])

  // Lookups
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  )

  const selectedPet = useMemo(
    () => pets.find((p) => p.id === selectedPetId) || null,
    [pets, selectedPetId]
  )

  // Weight-based pricing helper
  const getPriceForPet = (service: ServiceDTO, petWeight: number) => {
    if (!service.prices || service.prices.length === 0) return 0
    const priceObj = service.prices.find(
      (p) =>
        (p.minWeight == null || p.minWeight <= petWeight) &&
        (p.maxWeight == null || p.maxWeight >= petWeight)
    )
    return priceObj ? priceObj.price : 0
  }

  // Filter Grooming services
  const groomingServices = useMemo(() => {
    return services.filter((s) => {
      const type = String(s.serviceType || '').toLowerCase()
      const isGrooming = type === 'grooming' || type === 'care' || type === '0'
      if (!isGrooming) return false
      if (!selectedPet) return true
      return isServiceCompatibleWithPet(s, selectedPet.species)
    })
  }, [services, selectedPet])

  // Filter Boarding suite services
  const boardingServices = useMemo(() => {
    return services.filter((s) => {
      const type = String(s.serviceType || '').toLowerCase()
      const isBoarding = type === 'boarding' || type === '1'
      if (!isBoarding) return false
      if (!selectedPet) return true
      return isServiceCompatibleWithPet(s, selectedPet.species)
    })
  }, [services, selectedPet])

  // Filter Diet options
  const dietServices = useMemo(() => {
    return services.filter((s) => {
      const type = String(s.serviceType || '').toLowerCase()
      return type === 'diet' || type === '2'
    })
  }, [services])

  // Boarding duration calculation
  const stayDays = useMemo(() => {
    if (!boardingDates || boardingDates.length < 2 || !boardingDates[0] || !boardingDates[1]) {
      return 1
    }
    return Math.max(1, boardingDates[1].startOf('day').diff(boardingDates[0].startOf('day'), 'day'))
  }, [boardingDates])

  // Financial calculation
  const { lineItems, totalEstimatedCost } = useMemo(() => {
    if (!selectedPet) return { lineItems: [], totalEstimatedCost: 0 }

    const items: Array<{
      name: string
      type: string
      quantity: number
      unitPrice: number
      total: number
    }> = []

    let sum = 0

    if (category === 'Grooming') {
      selectedGroomingIds.forEach((gId) => {
        const srv = services.find((s) => s.id === gId)
        if (srv) {
          const unitPrice = getPriceForPet(srv, selectedPet.weight)
          items.push({
            name: srv.name,
            type: 'Grooming & Spa',
            quantity: 1,
            unitPrice,
            total: unitPrice,
          })
          sum += unitPrice
        }
      })
    } else {
      if (selectedBoardingId) {
        const suite = services.find((s) => s.id === selectedBoardingId)
        if (suite) {
          const unitPrice = getPriceForPet(suite, selectedPet.weight)
          const total = unitPrice * stayDays
          items.push({
            name: suite.name,
            type: `Boarding Suite (${stayDays} day${stayDays > 1 ? 's' : ''})`,
            quantity: stayDays,
            unitPrice,
            total,
          })
          sum += total
        }
      }
      if (selectedDietId) {
        const diet = services.find((s) => s.id === selectedDietId)
        if (diet) {
          const unitPrice = getPriceForPet(diet, selectedPet.weight)
          const total = unitPrice * stayDays
          items.push({
            name: `Diet: ${diet.name}`,
            type: `Diet Add-on (${stayDays} day${stayDays > 1 ? 's' : ''})`,
            quantity: stayDays,
            unitPrice,
            total,
          })
          sum += total
        }
      }
    }

    return { lineItems: items, totalEstimatedCost: sum }
  }, [category, selectedPet, selectedGroomingIds, selectedBoardingId, selectedDietId, stayDays, services])

  // Handle Grooming service toggle
  const toggleGroomingService = (serviceId: string) => {
    setSelectedGroomingIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    )
  }

  // Quick appointment time presets
  const handleQuickTime = (hours: number, minutes: number) => {
    const baseDate = appointmentAt || dayjs()
    const target = baseDate.hour(hours).minute(minutes).second(0)
    setAppointmentAt(target)
  }

  // Submission handler
  const handleCreateBooking = async () => {
    if (!canCreate) {
      return message.error('You do not have permission to create bookings (BOOKING_CREATE).')
    }
    if (!selectedCustomerId) {
      return message.warning('Please select a customer for this walk-in booking.')
    }
    if (!selectedPetId) {
      return message.warning('Please select a pet for this booking.')
    }

    const bookingItems: BookingItemPayload[] = []

    if (category === 'Grooming') {
      if (selectedGroomingIds.length === 0) {
        return message.warning('Please select at least 1 grooming service.')
      }
      if (!appointmentAt) {
        return message.warning('Please select an appointment date and time for grooming.')
      }
      if (appointmentAt.isBefore(dayjs())) {
        return message.warning('The appointment time must be in the future.')
      }

      selectedGroomingIds.forEach((srvId) => {
        bookingItems.push({
          petId: selectedPetId,
          serviceId: srvId,
          scheduledStartAt: appointmentAt.format('YYYY-MM-DDTHH:mm:ss'),
          scheduledEndAt: null,
          quantity: 1,
        })
      })
    } else {
      if (!selectedBoardingId) {
        return message.warning('Please choose a boarding room or suite.')
      }
      if (!boardingDates || boardingDates.length < 2 || !boardingDates[0] || !boardingDates[1]) {
        return message.warning('Please select check-in and check-out dates for boarding.')
      }

      const selectedSuite = services.find((s) => s.id === selectedBoardingId)
      if (!selectedSuite?.roomTypeId) {
        return message.error(
          `Boarding service "${selectedSuite?.name}" has no room type linked. Please choose another service or contact an administrator.`
        )
      }

      const isSameDay = boardingDates[0].isSame(boardingDates[1], 'day')
      const startHour = isSameDay ? 8 : 14
      const endHour = isSameDay ? 18 : 12

      const scheduledStartAt = boardingDates[0]
        .startOf('day')
        .add(startHour, 'hour')
        .format('YYYY-MM-DDTHH:mm:ss')
      const scheduledEndAt = boardingDates[1]
        .startOf('day')
        .add(endHour, 'hour')
        .format('YYYY-MM-DDTHH:mm:ss')

      bookingItems.push({
        petId: selectedPetId,
        serviceId: selectedBoardingId,
        scheduledStartAt,
        scheduledEndAt,
        quantity: stayDays,
      })

      if (selectedDietId) {
        bookingItems.push({
          petId: selectedPetId,
          serviceId: selectedDietId,
          scheduledStartAt,
          scheduledEndAt,
          quantity: stayDays,
        })
      }
    }

    setSaving(true)
    try {
      await bookingService.create({
        customerId: selectedCustomerId,
        paymentChoice: 'PAY_AT_COUNTER',
        bookingItems,
      })

      message.success('Walk-in booking created successfully! Payment is payable at the front desk.')
      navigate(base)
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Could not create the walk-in reservation.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '100px 0', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#8c735f', fontWeight: 500 }}>
          Loading sanctuary booking options...
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: '16px 20px 48px' }}>
      <style>{`
        .haven-custom-select .ant-select-selector {
          border-radius: 10px !important;
          border: 1.5px solid #eeddc8 !important;
          background-color: #ffffff !important;
          min-height: 42px !important;
          display: flex !important;
          align-items: center !important;
          color: #3d2d23 !important;
        }
        .haven-custom-select .ant-select-selection-placeholder {
          color: #a89f91 !important;
        }
        .haven-custom-select.ant-select-focused .ant-select-selector,
        .haven-custom-select:hover .ant-select-selector {
          border-color: #785839 !important;
        }
      `}</style>

      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '2.1rem',
              color: '#3d2d23',
              fontWeight: 700,
            }}
          >
            Add New Booking
          </h1>
          <p style={{ margin: '6px 0 0', color: '#8c735f', fontSize: '0.92rem' }}>
            Create a concierge reservation for walk-in or phone guests with instant service configuration.
          </p>
        </div>

        <Link
          to={base}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#ffffff',
            border: '1.5px solid #eeddc8',
            color: '#785839',
            borderRadius: 999,
            padding: '8px 20px',
            fontSize: '0.88rem',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(61,45,35,0.04)',
            transition: 'all 0.2s ease',
          }}
        >
          <ArrowLeftOutlined /> Back to bookings
        </Link>
      </div>

      {!canCreate && (
        <Alert
          type="error"
          showIcon
          style={{
            marginBottom: 24,
            borderRadius: 14,
            border: '1.5px solid #fecaca',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
          }}
          message="Permission Denied"
          description="Your account is not granted permission to create bookings (BOOKING_CREATE). Please contact your administrator."
        />
      )}

      {/* Main Grid: Form Left (col-15), Sticky Summary Right (col-9) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.6fr) minmax(320px, 1fr)',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* Left Column: Booking Form Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Section 1: Customer & Pet Identification */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1.5px solid #eeddc8',
              borderRadius: 20,
              padding: '24px 28px',
              boxShadow: '0 4px 18px rgba(61,45,35,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: '#faf6f0',
                  border: '1.5px solid #eeddc8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#785839',
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                1
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#3d2d23',
                  }}
                >
                  Guest & Pet Information
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#8c735f' }}>
                  Select the registered pet owner and pet companion
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
              {/* Customer Selector */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#3d2d23',
                    marginBottom: 6,
                  }}
                >
                  Customer (Pet Owner) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <Select
                  className="haven-custom-select"
                  showSearch
                  style={{ width: '100%' }}
                  placeholder="Search by name, phone, or email..."
                  optionFilterProp="label"
                  value={selectedCustomerId}
                  onChange={(val) => {
                    setSelectedCustomerId(val)
                    setSelectedGroomingIds([])
                    setSelectedBoardingId(null)
                  }}
                  options={customers.map((c) => ({
                    value: c.id,
                    label: `${c.fullName} · ${c.phoneNumber || c.email}`,
                  }))}
                />
                {selectedCustomer && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: '8px 12px',
                      borderRadius: 10,
                      backgroundColor: '#fdfbf7',
                      border: '1px solid #eeddc8',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      color: '#5c4033',
                    }}
                  >
                    <span>
                      <UserOutlined style={{ color: '#785839', marginRight: 4 }} />
                      {selectedCustomer.fullName}
                    </span>
                    {selectedCustomer.phoneNumber && (
                      <span>
                        <PhoneOutlined style={{ color: '#785839', marginRight: 4 }} />
                        {selectedCustomer.phoneNumber}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Pet Selector */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#3d2d23',
                    marginBottom: 6,
                  }}
                >
                  Pet Companion <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <Select
                  className="haven-custom-select"
                  loading={petsLoading}
                  disabled={!selectedCustomerId}
                  style={{ width: '100%' }}
                  placeholder={
                    !selectedCustomerId
                      ? 'Select a customer first'
                      : pets.length === 0
                      ? 'No active pets found for this customer'
                      : 'Select this customer’s pet...'
                  }
                  value={selectedPetId}
                  onChange={(val) => {
                    setSelectedPetId(val)
                    setSelectedGroomingIds([])
                    setSelectedBoardingId(null)
                  }}
                  options={pets.map((p) => {
                    const isCat = isPetCat(p.species)
                    return {
                      value: p.id,
                      label: `${p.name} (${isCat ? 'Cat' : 'Dog'} · ${p.weight} kg${
                        p.breed ? ` · ${p.breed}` : ''
                      })`,
                    }
                  })}
                />
                {selectedPet && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: '8px 12px',
                      borderRadius: 10,
                      backgroundColor: '#fdfbf7',
                      border: '1px solid #eeddc8',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: '#5c4033',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isPetCat(selectedPet.species) ? (
                        <CatIcon size={16} />
                      ) : (
                        <DogIcon size={16} />
                      )}
                      <strong>{selectedPet.name}</strong>
                      <span>({isPetCat(selectedPet.species) ? 'Feline' : 'Canine'})</span>
                    </div>
                    <span
                      style={{
                        backgroundColor: '#faf6f0',
                        border: '1px solid #eeddc8',
                        padding: '1px 8px',
                        borderRadius: 999,
                        fontWeight: 600,
                        color: '#785839',
                      }}
                    >
                      {selectedPet.weight} kg
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Sanctuary Experience Category (Grooming vs Boarding) */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1.5px solid #eeddc8',
              borderRadius: 20,
              padding: '24px 28px',
              boxShadow: '0 4px 18px rgba(61,45,35,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: '#faf6f0',
                  border: '1.5px solid #eeddc8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#785839',
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                2
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#3d2d23',
                  }}
                >
                  Choose Sanctuary Experience
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#8c735f' }}>
                  Distinguish between grooming treatments and hotel boarding suites
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              {/* Option 1: Botanical Grooming & Spa */}
              <div
                onClick={() => setCategory('Grooming')}
                style={{
                  cursor: 'pointer',
                  borderRadius: 16,
                  padding: '18px 20px',
                  backgroundColor: category === 'Grooming' ? '#faf6f0' : '#ffffff',
                  border:
                    category === 'Grooming'
                      ? '2px solid #3d2d23'
                      : '1.5px solid #eeddc8',
                  boxShadow:
                    category === 'Grooming'
                      ? '0 6px 20px rgba(61,45,35,0.1)'
                      : 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      backgroundColor: category === 'Grooming' ? '#3d2d23' : '#faf6f0',
                      border: '1px solid #eeddc8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: category === 'Grooming' ? '#ffffff' : '#785839',
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    <ScissorOutlined />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: 17,
                          fontWeight: 700,
                          color: '#3d2d23',
                        }}
                      >
                        Botanical Grooming & Spa
                      </span>
                    </div>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 12.5,
                        color: '#8c735f',
                        lineHeight: 1.4,
                      }}
                    >
                      Bespoke bath, coat styling, breed trims, hygiene, and nail care sessions.
                    </p>
                  </div>
                  {category === 'Grooming' && (
                    <CheckCircleFilled style={{ color: '#3d2d23', fontSize: 18 }} />
                  )}
                </div>
              </div>

              {/* Option 2: Sanctuary Hotel Suites */}
              <div
                onClick={() => setCategory('Boarding')}
                style={{
                  cursor: 'pointer',
                  borderRadius: 16,
                  padding: '18px 20px',
                  backgroundColor: category === 'Boarding' ? '#faf6f0' : '#ffffff',
                  border:
                    category === 'Boarding'
                      ? '2px solid #3d2d23'
                      : '1.5px solid #eeddc8',
                  boxShadow:
                    category === 'Boarding'
                      ? '0 6px 20px rgba(61,45,35,0.1)'
                      : 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      backgroundColor: category === 'Boarding' ? '#3d2d23' : '#faf6f0',
                      border: '1px solid #eeddc8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: category === 'Boarding' ? '#ffffff' : '#785839',
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    <HomeOutlined />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: 17,
                          fontWeight: 700,
                          color: '#3d2d23',
                        }}
                      >
                        Sanctuary Hotel Boarding
                      </span>
                    </div>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 12.5,
                        color: '#8c735f',
                        lineHeight: 1.4,
                      }}
                    >
                      Climate-controlled private suites, 24/7 dedicated caregiver attention, and overnight stay.
                    </p>
                  </div>
                  {category === 'Boarding' && (
                    <CheckCircleFilled style={{ color: '#3d2d23', fontSize: 18 }} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Experience Details & Scheduling */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1.5px solid #eeddc8',
              borderRadius: 20,
              padding: '24px 28px',
              boxShadow: '0 4px 18px rgba(61,45,35,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: '#faf6f0',
                  border: '1.5px solid #eeddc8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#785839',
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                3
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#3d2d23',
                  }}
                >
                  {category === 'Grooming'
                    ? 'Grooming Services & Appointment Schedule'
                    : 'Suite Selection, Stay Dates & Nutrition'}
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#8c735f' }}>
                  {category === 'Grooming'
                    ? 'Select treatments and target date/time for the spa session'
                    : 'Select room suite, date range, and optional tailored meal plans'}
                </p>
              </div>
            </div>

            {/* A. GROOMING FLOW */}
            {category === 'Grooming' && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#3d2d23',
                    marginBottom: 10,
                  }}
                >
                  Select Spa & Grooming Treatments <span style={{ color: '#dc2626' }}>*</span>
                </label>

                {!selectedPet ? (
                  <div
                    style={{
                      padding: '20px',
                      borderRadius: 14,
                      backgroundColor: '#fdfbf7',
                      border: '1.5px solid #eeddc8',
                      textAlign: 'center',
                      color: '#8c735f',
                      fontSize: 13,
                      marginBottom: 18,
                    }}
                  >
                    Please select a customer and pet above to view compatible grooming treatments and tailored weight rates.
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: 12,
                      marginBottom: 20,
                    }}
                  >
                    {groomingServices.map((srv) => {
                      const isSelected = selectedGroomingIds.includes(srv.id)
                      const price = getPriceForPet(srv, selectedPet.weight)

                      return (
                        <div
                          key={srv.id}
                          onClick={() => toggleGroomingService(srv.id)}
                          style={{
                            cursor: 'pointer',
                            borderRadius: 12,
                            padding: '14px 16px',
                            backgroundColor: isSelected ? '#faf6f0' : '#ffffff',
                            border: isSelected
                              ? '2px solid #3d2d23'
                              : '1.5px solid #eeddc8',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: 10,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontWeight: 600, color: '#3d2d23', fontSize: 14 }}>
                              {srv.name}
                            </div>
                            <div
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 6,
                                border: isSelected ? 'none' : '1.5px solid #eeddc8',
                                backgroundColor: isSelected ? '#3d2d23' : '#ffffff',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                flexShrink: 0,
                                marginTop: 2,
                              }}
                            >
                              {isSelected && '✓'}
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingTop: 8,
                              borderTop: '1px solid #f4ebe1',
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                color: '#8c735f',
                                backgroundColor: '#fdfbf7',
                                border: '1px solid #eeddc8',
                                padding: '2px 8px',
                                borderRadius: 999,
                              }}
                            >
                              {selectedPet.weight} kg rate
                            </span>
                            <span style={{ fontWeight: 700, color: '#3d2d23', fontSize: 14 }}>
                              {vnd.format(price)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Grooming Appointment Date & Time */}
                <div style={{ marginTop: 16 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#3d2d23',
                      marginBottom: 8,
                    }}
                  >
                    Appointment Date & Time <span style={{ color: '#dc2626' }}>*</span>
                  </label>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <DatePicker
                      showTime
                      format="DD/MM/YYYY HH:mm"
                      style={{
                        borderRadius: 10,
                        border: '1.5px solid #eeddc8',
                        height: 42,
                        minWidth: 240,
                        backgroundColor: '#ffffff',
                      }}
                      disabledDate={(current) => current && current.isBefore(dayjs().startOf('day'))}
                      value={appointmentAt}
                      onChange={(d) => setAppointmentAt(d)}
                      placeholder="Select appointment date and time"
                    />

                    {/* Quick Time Presets */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: '#8c735f', marginRight: 4 }}>
                        Quick Time:
                      </span>
                      {[
                        { label: '09:00', h: 9, m: 0 },
                        { label: '11:00', h: 11, m: 0 },
                        { label: '14:00', h: 14, m: 0 },
                        { label: '16:30', h: 16, m: 30 },
                        { label: '18:00', h: 18, m: 0 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleQuickTime(preset.h, preset.m)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                            border: '1px solid #eeddc8',
                            backgroundColor: '#faf6f0',
                            color: '#785839',
                            cursor: 'pointer',
                          }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* B. BOARDING FLOW */}
            {category === 'Boarding' && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#3d2d23',
                    marginBottom: 10,
                  }}
                >
                  Select Boarding Suite Unit <span style={{ color: '#dc2626' }}>*</span>
                </label>

                {!selectedPet ? (
                  <div
                    style={{
                      padding: '20px',
                      borderRadius: 14,
                      backgroundColor: '#fdfbf7',
                      border: '1.5px solid #eeddc8',
                      textAlign: 'center',
                      color: '#8c735f',
                      fontSize: 13,
                      marginBottom: 18,
                    }}
                  >
                    Please select a customer and pet above to view compatible suite units and nightly rates.
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: 14,
                      marginBottom: 20,
                    }}
                  >
                    {boardingServices.map((suite) => {
                      const isSelected = selectedBoardingId === suite.id
                      const tier = getRoomTierInfo(suite.roomTypeName, suite.name)
                      const price = getPriceForPet(suite, selectedPet.weight)

                      return (
                        <div
                          key={suite.id}
                          onClick={() => setSelectedBoardingId(suite.id)}
                          style={{
                            cursor: 'pointer',
                            borderRadius: 14,
                            padding: '16px 18px',
                            backgroundColor: isSelected ? '#faf6f0' : '#ffffff',
                            border: isSelected
                              ? '2px solid #3d2d23'
                              : '1.5px solid #eeddc8',
                            boxShadow: isSelected
                              ? '0 4px 14px rgba(61,45,35,0.08)'
                              : 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontWeight: 700, color: '#3d2d23', fontSize: 15 }}>
                                {suite.name}
                              </div>
                              <span
                                style={{
                                  display: 'inline-block',
                                  marginTop: 4,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  backgroundColor: tier.badgeBg,
                                  color: tier.badgeColor,
                                  border: `1px solid ${tier.badgeBorder}`,
                                  borderRadius: 999,
                                  padding: '1px 8px',
                                }}
                              >
                                {tier.badgeText}
                              </span>
                            </div>

                            <div
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                border: isSelected ? '6px solid #3d2d23' : '1.5px solid #eeddc8',
                                backgroundColor: '#ffffff',
                                flexShrink: 0,
                                marginTop: 2,
                              }}
                            />
                          </div>

                          {!suite.roomTypeId && (
                            <div
                              style={{
                                fontSize: 11,
                                color: '#b91c1c',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <WarningOutlined /> Warning: No physical room linked
                            </div>
                          )}

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingTop: 8,
                              borderTop: '1px solid #f4ebe1',
                              marginTop: 'auto',
                            }}
                          >
                            <span style={{ fontSize: 12, color: '#8c735f' }}>Rate per night:</span>
                            <span style={{ fontWeight: 700, color: '#3d2d23', fontSize: 15 }}>
                              {vnd.format(price)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Boarding Date Range */}
                <div style={{ marginBottom: 18 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#3d2d23',
                      marginBottom: 8,
                    }}
                  >
                    Check-in & Check-out Dates <span style={{ color: '#dc2626' }}>*</span>
                  </label>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <RangePicker
                      format="DD/MM/YYYY"
                      style={{
                        borderRadius: 10,
                        border: '1.5px solid #eeddc8',
                        height: 42,
                        minWidth: 280,
                        backgroundColor: '#ffffff',
                      }}
                      disabledDate={(current) => current && current.isBefore(dayjs().startOf('day'))}
                      value={boardingDates}
                      onChange={(dates) => setBoardingDates(dates as [Dayjs, Dayjs])}
                      placeholder={['Check-in date (14:00)', 'Check-out date (12:00)']}
                    />

                    {boardingDates && boardingDates[0] && boardingDates[1] && (
                      <span
                        style={{
                          backgroundColor: '#faf6f0',
                          border: '1px solid #eeddc8',
                          color: '#785839',
                          borderRadius: 999,
                          padding: '6px 14px',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        Stay duration: {stayDays} day(s) · {Math.max(1, stayDays - 1)} night(s)
                      </span>
                    )}
                  </div>
                </div>

                {/* Diet Add-on Selector */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#3d2d23',
                      marginBottom: 6,
                    }}
                  >
                    Tailored Nutrition & Diet Add-on (Optional)
                  </label>
                  <Select
                    className="haven-custom-select"
                    allowClear
                    style={{ width: '100%', maxWidth: 450 }}
                    placeholder="Choose a culinary nutrition plan (Optional)"
                    value={selectedDietId}
                    onChange={(val) => setSelectedDietId(val)}
                    options={[
                      {
                        value: '',
                        label: 'Standard Meal (No customized culinary add-on)',
                      },
                      ...dietServices.map((d) => {
                        const price = selectedPet ? getPriceForPet(d, selectedPet.weight) : 0
                        return {
                          value: d.id,
                          label: `${d.name} (+${vnd.format(price)} / day)`,
                        }
                      }),
                    ]}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Concierge Notes */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1.5px solid #eeddc8',
              borderRadius: 20,
              padding: '24px 28px',
              boxShadow: '0 4px 18px rgba(61,45,35,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: '#faf6f0',
                  border: '1.5px solid #eeddc8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#785839',
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                4
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#3d2d23',
                  }}
                >
                  Front Desk & Care Notes (Optional)
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#8c735f' }}>
                  Document pet behavioral quirks, medication schedule, or parent requests
                </p>
              </div>
            </div>

            <TextArea
              placeholder="e.g. Pet is sensitive around paws, requires grain-free treats only, check-in belongings logged..."
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                borderRadius: 10,
                border: '1.5px solid #eeddc8',
                padding: '10px 14px',
                backgroundColor: '#ffffff',
              }}
            />
          </div>
        </div>

        {/* Right Column: Sticky Reservation Summary */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1.5px solid #eeddc8',
              borderRadius: 20,
              padding: '24px 26px',
              boxShadow: '0 8px 30px rgba(61,45,35,0.08)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
                paddingBottom: 14,
                borderBottom: '1px solid #eeddc8',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 19,
                  fontWeight: 700,
                  color: '#3d2d23',
                }}
              >
                Reservation Summary
              </h3>
              <span
                style={{
                  backgroundColor: '#faf6f0',
                  border: '1px solid #eeddc8',
                  color: '#785839',
                  borderRadius: 999,
                  padding: '2px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Walk-in Desk
              </span>
            </div>

            {/* Guest Details */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8c735f', marginBottom: 6 }}>
                Guest & Companion
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#3d2d23' }}>
                {selectedCustomer ? selectedCustomer.fullName : '— No customer selected —'}
              </div>
              <div style={{ fontSize: 12.5, color: '#785839', marginTop: 2 }}>
                {selectedPet ? (
                  <span>
                    🐾 {selectedPet.name} ({isPetCat(selectedPet.species) ? 'Cat' : 'Dog'} · {selectedPet.weight} kg)
                  </span>
                ) : (
                  '— No pet selected —'
                )}
              </div>
            </div>

            {/* Category & Schedule */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                backgroundColor: '#fdfbf7',
                border: '1px solid #eeddc8',
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#3d2d23' }}>
                {category === 'Grooming' ? <ScissorOutlined /> : <HomeOutlined />}
                <span>{category === 'Grooming' ? 'Botanical Grooming & Spa' : 'Sanctuary Hotel Boarding'}</span>
              </div>
              <div style={{ color: '#8c735f', fontSize: 12, marginTop: 4 }}>
                {category === 'Grooming' ? (
                  appointmentAt ? (
                    <span>
                      📅 Appointment: <strong>{appointmentAt.format('DD/MM/YYYY · HH:mm')}</strong>
                    </span>
                  ) : (
                    <span style={{ color: '#b45309' }}>Select appointment date & time</span>
                  )
                ) : boardingDates && boardingDates[0] && boardingDates[1] ? (
                  <span>
                    📅 {boardingDates[0].format('DD/MM/YYYY')} – {boardingDates[1].format('DD/MM/YYYY')} ({stayDays} days)
                  </span>
                ) : (
                  <span style={{ color: '#b45309' }}>Select check-in & check-out dates</span>
                )}
              </div>
            </div>

            {/* Line Items Breakdown */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8c735f', marginBottom: 8 }}>
                Itemized Line Items ({lineItems.length})
              </div>

              {lineItems.length === 0 ? (
                <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', padding: '6px 0' }}>
                  No services selected yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {lineItems.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 13,
                        color: '#3d2d23',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: '#8c735f' }}>{item.type}</div>
                      </div>
                      <div style={{ fontWeight: 700 }}>{vnd.format(item.total)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ height: 1, backgroundColor: '#eeddc8', margin: '14px 0' }} />

            {/* Estimated Total */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#3d2d23' }}>
                  Total Estimated:
                </div>
                <div style={{ fontSize: 11.5, color: '#8c735f' }}>Due at check-out counter</div>
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#3d2d23',
                }}
              >
                {vnd.format(totalEstimatedCost)}
              </div>
            </div>

            {/* Payment Method Badge */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                backgroundColor: '#faf6f0',
                border: '1px solid #eeddc8',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: '#785839',
              }}
            >
              <DollarCircleOutlined style={{ fontSize: 15, color: '#785839' }} />
              <div>
                <strong>Pay at Counter:</strong> Walk-in settlement upon pet handover.
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button
                type="primary"
                loading={saving}
                disabled={!canCreate || saving}
                onClick={handleCreateBooking}
                style={{
                  height: 44,
                  borderRadius: 999,
                  backgroundColor: '#3d2d23',
                  borderColor: '#3d2d23',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: 14,
                  boxShadow: '0 4px 14px rgba(61,45,35,0.2)',
                }}
              >
                Create Walk-in Booking
              </Button>

              <Button
                onClick={() => navigate(base)}
                disabled={saving}
                style={{
                  height: 40,
                  borderRadius: 999,
                  border: '1.5px solid #eeddc8',
                  color: '#785839',
                  fontWeight: 600,
                  backgroundColor: '#ffffff',
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
