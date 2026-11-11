import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  DatePicker,
  Input,
  Select,
  Spin,
  message,
} from 'antd'
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  DollarCircleOutlined,
  GiftOutlined,
  HomeOutlined,
  PhoneOutlined,
  ScissorOutlined,
  TagOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { bookingService, type BookingItemPayload } from '@/services/booking.service'
import { customerService } from '@/services/customer.service'
import { petService } from '@/services/pet.service'
import { serviceService } from '@/services/service.service'
import { voucherService } from '@/services/voucher.service'
import { DogIcon, CatIcon } from '@/components/common/PetIcons'
import type { CustomerDTO } from '@/types/customer.types'
import type { PetDTO } from '@/types/pet.types'
import type { ServiceDTO } from '@/types/service.types'
import type { VoucherDTO } from '@/types/voucher.types'
import { getApiErrorMessage } from '@/utils/apiError'
import { useAuthStore } from '@/store/useAuthStore'
import { hasPermission, PERMISSIONS } from '@/auth/permissionHelper'
import { isServiceCompatibleWithPet, getRoomTierInfo, isPetCat } from '@/utils/petServiceFilter'

const { RangePicker } = DatePicker
const { TextArea } = Input

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

type BookingCategory = 'Grooming' | 'Boarding'

interface PetServiceConfig {
  groomingIds: string[]
  boardingId?: string
  dietId?: string
}

export default function CounterBookingPage() {
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

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([])
  const [activePetTab, setActivePetTab] = useState<string>('')
  const [category, setCategory] = useState<BookingCategory>('Grooming')

  const [petServices, setPetServices] = useState<Record<string, PetServiceConfig>>({})

  const [appointmentAt, setAppointmentAt] = useState<Dayjs | null>(null)
  const [boardingDates, setBoardingDates] = useState<[Dayjs, Dayjs] | null>(null)

  const [voucherInput, setVoucherInput] = useState<string>('')
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherDTO | null>(null)
  const [checkingVoucher, setCheckingVoucher] = useState(false)
  const [voucherError, setVoucherError] = useState<string | null>(null)

  const [note, setNote] = useState<string>('')

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

  useEffect(() => {
    if (!selectedCustomerId) {
      setPets([])
      setSelectedPetIds([])
      setActivePetTab('')
      setPetServices({})
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
            setSelectedPetIds([activePets[0].id])
            setActivePetTab(activePets[0].id)
          } else {
            setSelectedPetIds([])
            setActivePetTab('')
          }
          setPetServices({})
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

  useEffect(() => {
    if (selectedPetIds.length > 0) {
      if (!selectedPetIds.includes(activePetTab)) {
        setActivePetTab(selectedPetIds[0])
      }
    } else {
      setActivePetTab('')
    }
  }, [selectedPetIds, activePetTab])

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  )

  const activePet = useMemo(
    () => pets.find((p) => p.id === activePetTab) || null,
    [pets, activePetTab]
  )

  const togglePetSelection = (petId: string) => {
    setSelectedPetIds((prev) => {
      if (prev.includes(petId)) {
        const next = prev.filter((id) => id !== petId)
        setPetServices((currentConfig) => {
          const copy = { ...currentConfig }
          delete copy[petId]
          return copy
        })
        return next
      } else {
        return [...prev, petId]
      }
    })
  }

  const selectAllPets = () => {
    const allIds = pets.map((p) => p.id)
    setSelectedPetIds(allIds)
    if (allIds.length > 0) setActivePetTab(allIds[0])
  }

  const clearPetSelection = () => {
    setSelectedPetIds([])
    setActivePetTab('')
    setPetServices({})
  }

  const getPriceForPet = (service: ServiceDTO, petWeight: number) => {
    if (!service.prices || service.prices.length === 0) return 0
    const priceObj = service.prices.find(
      (p) =>
        (p.minWeight == null || p.minWeight <= petWeight) &&
        (p.maxWeight == null || p.maxWeight >= petWeight)
    )
    return priceObj ? priceObj.price : 0
  }

  const groomingServicesForActivePet = useMemo(() => {
    return services.filter((s) => {
      const type = String(s.serviceType || '').toLowerCase()
      const isGrooming = type === 'grooming' || type === 'care' || type === '0'
      if (!isGrooming) return false
      if (!activePet) return true
      return isServiceCompatibleWithPet(s, activePet.species)
    })
  }, [services, activePet])

  const boardingServicesForActivePet = useMemo(() => {
    return services.filter((s) => {
      const type = String(s.serviceType || '').toLowerCase()
      const isBoarding = type === 'boarding' || type === '1'
      if (!isBoarding) return false
      if (!activePet) return true
      return isServiceCompatibleWithPet(s, activePet.species)
    })
  }, [services, activePet])

  const dietServices = useMemo(() => {
    return services.filter((s) => {
      const type = String(s.serviceType || '').toLowerCase()
      return type === 'diet' || type === '2'
    })
  }, [services])

  const stayDays = useMemo(() => {
    if (!boardingDates || boardingDates.length < 2 || !boardingDates[0] || !boardingDates[1]) {
      return 1
    }
    return Math.max(1, boardingDates[1].startOf('day').diff(boardingDates[0].startOf('day'), 'day'))
  }, [boardingDates])

  const toggleGroomingForActivePet = (srvId: string) => {
    if (!activePet) return
    const petId = activePet.id
    setPetServices((prev) => {
      const current = prev[petId]?.groomingIds || []
      const updated = current.includes(srvId)
        ? current.filter((id) => id !== srvId)
        : [...current, srvId]
      return {
        ...prev,
        [petId]: {
          ...prev[petId],
          groomingIds: updated,
        },
      }
    })
  }

  const setBoardingSuiteForActivePet = (suiteId: string) => {
    if (!activePet) return
    const petId = activePet.id
    setPetServices((prev) => ({
      ...prev,
      [petId]: {
        ...prev[petId],
        boardingId: suiteId,
      },
    }))
  }

  const setDietForActivePet = (dietId?: string) => {
    if (!activePet) return
    const petId = activePet.id
    setPetServices((prev) => ({
      ...prev,
      [petId]: {
        ...prev[petId],
        dietId: dietId || undefined,
      },
    }))
  }

  const { lineItemsByPet, totalEstimatedCost } = useMemo(() => {
    let sum = 0
    const grouped: Record<
      string,
      {
        pet: PetDTO
        items: Array<{ name: string; type: string; unitPrice: number; total: number }>
        subtotal: number
      }
    > = {}

    selectedPetIds.forEach((petId) => {
      const pet = pets.find((p) => p.id === petId)
      if (!pet) return

      const srvConfig = petServices[petId]
      const petItems: Array<{ name: string; type: string; unitPrice: number; total: number }> = []
      let petSubtotal = 0

      if (category === 'Grooming' && srvConfig?.groomingIds) {
        srvConfig.groomingIds.forEach((gId) => {
          const srv = services.find((s) => s.id === gId)
          if (srv) {
            const unitPrice = getPriceForPet(srv, pet.weight)
            petItems.push({
              name: srv.name,
              type: 'Grooming Treatment',
              unitPrice,
              total: unitPrice,
            })
            petSubtotal += unitPrice
            sum += unitPrice
          }
        })
      } else if (category === 'Boarding') {
        if (srvConfig?.boardingId) {
          const suite = services.find((s) => s.id === srvConfig.boardingId)
          if (suite) {
            const unitPrice = getPriceForPet(suite, pet.weight)
            const total = unitPrice * stayDays
            petItems.push({
              name: suite.name,
              type: `Suite (${stayDays} day${stayDays > 1 ? 's' : ''})`,
              unitPrice,
              total,
            })
            petSubtotal += total
            sum += total
          }
        }
        if (srvConfig?.dietId) {
          const diet = services.find((s) => s.id === srvConfig.dietId)
          if (diet) {
            const unitPrice = getPriceForPet(diet, pet.weight)
            const total = unitPrice * stayDays
            petItems.push({
              name: `Diet: ${diet.name}`,
              type: `Diet (${stayDays} day${stayDays > 1 ? 's' : ''})`,
              unitPrice,
              total,
            })
            petSubtotal += total
            sum += total
          }
        }
      }

      if (petItems.length > 0) {
        grouped[petId] = {
          pet,
          items: petItems,
          subtotal: petSubtotal,
        }
      }
    })

    return { lineItemsByPet: grouped, totalEstimatedCost: sum }
  }, [selectedPetIds, pets, petServices, category, services, stayDays])

  const voucherDiscount = useMemo(() => {
    if (!appliedVoucher || totalEstimatedCost <= 0) return 0
    const isPercent =
      String(appliedVoucher.discountType).toLowerCase() === 'percentage' ||
      String(appliedVoucher.discountType) === '0'
    if (isPercent) {
      return Math.round((totalEstimatedCost * appliedVoucher.discountValue) / 100)
    } else {
      return Math.min(totalEstimatedCost, appliedVoucher.discountValue)
    }
  }, [appliedVoucher, totalEstimatedCost])

  const finalTotalCost = Math.max(0, totalEstimatedCost - voucherDiscount)

  const handleApplyVoucher = async () => {
    const code = voucherInput.trim().toUpperCase()
    if (!code) {
      message.warning('Please enter a voucher code.')
      return
    }
    setCheckingVoucher(true)
    setVoucherError(null)
    try {
      const res: any = await voucherService.search({
        keyword: code,
        isValidOnly: true,
        pageSize: 10,
      })
      const data = res?.result ?? res?.data ?? res
      const items: VoucherDTO[] = data?.items ?? (Array.isArray(data) ? data : [])
      const found = items.find(
        (v) => v.code.trim().toUpperCase() === code && v.isValid
      )
      if (found) {
        setAppliedVoucher(found)
        message.success(`Privilege voucher "${found.code}" applied successfully!`)
      } else {
        setVoucherError('Voucher code is invalid, expired, or fully redeemed.')
        message.error('Voucher code is invalid or expired.')
      }
    } catch (err: any) {
      setVoucherError(err?.message || 'Could not verify voucher.')
      message.error('Could not verify voucher.')
    } finally {
      setCheckingVoucher(false)
    }
  }

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null)
    setVoucherInput('')
    setVoucherError(null)
    message.info('Voucher removed.')
  }

  const handleQuickTime = (hours: number, minutes: number) => {
    const baseDate = appointmentAt || dayjs()
    const target = baseDate.hour(hours).minute(minutes).second(0)
    setAppointmentAt(target)
  }

  const handleCreateBooking = async () => {
    if (!canCreate) {
      return message.error('You do not have permission to create bookings (BOOKING_CREATE).')
    }
    if (!selectedCustomerId) {
      return message.warning('Please select a customer for this walk-in booking.')
    }
    if (selectedPetIds.length === 0) {
      return message.warning('Please select at least 1 pet companion.')
    }

    if (category === 'Grooming') {
      if (!appointmentAt) {
        return message.warning('Please select an appointment date and time for grooming.')
      }
      if (appointmentAt.isBefore(dayjs())) {
        return message.warning('The appointment time must be in the future.')
      }
    } else {
      if (!boardingDates || boardingDates.length < 2 || !boardingDates[0] || !boardingDates[1]) {
        return message.warning('Please select check-in and check-out dates for boarding.')
      }
    }

    const bookingItems: BookingItemPayload[] = []

    for (const petId of selectedPetIds) {
      const pet = pets.find((p) => p.id === petId)
      const petName = pet ? `"${pet.name}"` : 'one of the pets'
      const config = petServices[petId]

      if (category === 'Grooming') {
        if (!config || !config.groomingIds || config.groomingIds.length === 0) {
          setActivePetTab(petId)
          return message.warning(`Please select at least 1 grooming service for ${petName}.`)
        }
        config.groomingIds.forEach((srvId) => {
          bookingItems.push({
            petId,
            serviceId: srvId,
            scheduledStartAt: appointmentAt!.format('YYYY-MM-DDTHH:mm:ss'),
            scheduledEndAt: null,
            quantity: 1,
          })
        })
      } else {
        if (!config || !config.boardingId) {
          setActivePetTab(petId)
          return message.warning(`Please choose a boarding room or suite for ${petName}.`)
        }

        const selectedSuite = services.find((s) => s.id === config.boardingId)
        if (!selectedSuite?.roomTypeId) {
          return message.error(
            `Boarding service "${selectedSuite?.name}" for ${petName} has no room type linked. Please choose another room.`
          )
        }

        const isSameDay = boardingDates![0].isSame(boardingDates![1], 'day')
        const startHour = isSameDay ? 8 : 14
        const endHour = isSameDay ? 18 : 12

        const scheduledStartAt = boardingDates![0]
          .startOf('day')
          .add(startHour, 'hour')
          .format('YYYY-MM-DDTHH:mm:ss')
        const scheduledEndAt = boardingDates![1]
          .startOf('day')
          .add(endHour, 'hour')
          .format('YYYY-MM-DDTHH:mm:ss')

        bookingItems.push({
          petId,
          serviceId: config.boardingId,
          scheduledStartAt,
          scheduledEndAt,
          quantity: stayDays,
        })

        if (config.dietId) {
          bookingItems.push({
            petId,
            serviceId: config.dietId,
            scheduledStartAt,
            scheduledEndAt,
            quantity: stayDays,
          })
        }
      }
    }

    setSaving(true)
    try {
      await bookingService.create({
        customerId: selectedCustomerId,
        voucherCode: appliedVoucher ? appliedVoucher.code : voucherInput.trim() || undefined,
        paymentChoice: 'PAY_AT_COUNTER',
        bookingItems,
      })

      message.success(`Walk-in booking created for ${selectedPetIds.length} pet(s)! Payment due at counter.`)
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
            Create a concierge reservation for walk-in or phone guests with multi-pet support.
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
                  Guest & Pet Companions
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#8c735f' }}>
                  Select the registered pet owner and choose one or multiple pets for this reservation
                </p>
              </div>
            </div>

            {/* Customer Selector */}
            <div style={{ marginBottom: 20 }}>
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
                placeholder="Search by customer name, phone, or email..."
                optionFilterProp="label"
                value={selectedCustomerId}
                onChange={(val) => {
                  setSelectedCustomerId(val)
                }}
                options={customers.map((c) => ({
                  value: c.id,
                  label: `${c.fullName} · ${c.phoneNumber || c.email}`,
                }))}
              />
            </div>

            {/* Pet Companions Multi-select */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#3d2d23',
                  }}
                >
                  Select Pet Companions <span style={{ color: '#dc2626' }}>*</span>
                </label>

                {selectedCustomerId && pets.length > 1 && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={selectAllPets}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#785839',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Select All
                    </button>
                    <span style={{ color: '#eeddc8' }}>|</span>
                    <button
                      type="button"
                      onClick={clearPetSelection}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#8c735f',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {!selectedCustomerId ? (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 12,
                    backgroundColor: '#fdfbf7',
                    border: '1px solid #eeddc8',
                    color: '#8c735f',
                    fontSize: 13,
                    textAlign: 'center',
                  }}
                >
                  Please choose a customer first to load their registered pets.
                </div>
              ) : petsLoading ? (
                <div style={{ padding: '16px', textAlign: 'center' }}>
                  <Spin size="small" />
                  <span style={{ marginLeft: 8, color: '#8c735f', fontSize: 13 }}>Loading pets...</span>
                </div>
              ) : pets.length === 0 ? (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 12,
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    color: '#92400e',
                    fontSize: 13,
                  }}
                >
                  This customer does not have any active pets registered. Please add a pet in Pet Management first.
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {pets.map((pet) => {
                    const isSelected = selectedPetIds.includes(pet.id)
                    const isCat = isPetCat(pet.species)

                    return (
                      <div
                        key={pet.id}
                        onClick={() => togglePetSelection(pet.id)}
                        style={{
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 18px',
                          borderRadius: 999,
                          backgroundColor: isSelected ? '#3d2d23' : '#faf6f0',
                          color: isSelected ? '#ffffff' : '#3d2d23',
                          border: isSelected ? '1.5px solid #3d2d23' : '1.5px solid #eeddc8',
                          boxShadow: isSelected ? '0 3px 10px rgba(61,45,35,0.18)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : '#ffffff',
                            border: isSelected ? 'none' : '1px solid #eeddc8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isSelected ? '#ffffff' : '#785839',
                            fontSize: 14,
                          }}
                        >
                          {isCat ? <CatIcon size={16} /> : <DogIcon size={16} />}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <strong style={{ fontSize: 14 }}>{pet.name}</strong>
                          <span style={{ fontSize: 12, opacity: 0.85 }}>
                            ({isCat ? 'Cat' : 'Dog'} · {pet.weight} kg)
                          </span>
                        </div>

                        {isSelected && (
                          <span
                            style={{
                              marginLeft: 4,
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              backgroundColor: '#ffffff',
                              color: '#3d2d23',
                              fontSize: 11,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
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

          {/* Section 3: Experience Details & Scheduling Per Pet */}
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
                    ? 'Configure Grooming Services per Pet'
                    : 'Configure Boarding Suites & Nutrition per Pet'}
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#8c735f' }}>
                  Tailor individual services for each companion and specify scheduling dates
                </p>
              </div>
            </div>

            {selectedPetIds.length === 0 ? (
              <div
                style={{
                  padding: '28px',
                  borderRadius: 14,
                  backgroundColor: '#fdfbf7',
                  border: '1.5px solid #eeddc8',
                  textAlign: 'center',
                  color: '#8c735f',
                  fontSize: 13.5,
                  marginBottom: 18,
                }}
              >
                Please select at least 1 pet companion in Step 1 above to configure treatments.
              </div>
            ) : (
              <div>
                {/* Pet Selection Tabs (when multiple pets selected) */}
                {selectedPetIds.length > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                      marginBottom: 20,
                      paddingBottom: 14,
                      borderBottom: '1px solid #eeddc8',
                    }}
                  >
                    {selectedPetIds.map((petId) => {
                      const pet = pets.find((p) => p.id === petId)
                      if (!pet) return null
                      const isCat = isPetCat(pet.species)
                      const isActive = activePetTab === pet.id
                      const config = petServices[petId]
                      const hasServices =
                        category === 'Grooming'
                          ? Boolean(config?.groomingIds && config.groomingIds.length > 0)
                          : Boolean(config?.boardingId)

                      return (
                        <button
                          type="button"
                          key={pet.id}
                          onClick={() => setActivePetTab(pet.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 18px',
                            borderRadius: 999,
                            fontSize: 13,
                            fontWeight: isActive ? 700 : 500,
                            backgroundColor: isActive ? '#3d2d23' : '#faf6f0',
                            color: isActive ? '#ffffff' : '#785839',
                            border: isActive ? '1.5px solid #3d2d23' : '1.5px solid #eeddc8',
                            boxShadow: isActive ? '0 2px 8px rgba(61,45,35,0.18)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isCat ? <CatIcon size={16} /> : <DogIcon size={16} />}
                          <span>{pet.name}</span>
                          <span style={{ fontSize: 11, opacity: 0.85 }}>({pet.weight} kg)</span>
                          {hasServices && (
                            <span
                              style={{
                                backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : '#ecfdf5',
                                color: isActive ? '#ffffff' : '#047857',
                                padding: '1px 6px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              ✓
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Active Pet Header Info */}
                {activePet && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#fdfbf7',
                      border: '1px solid #eeddc8',
                      borderRadius: 12,
                      padding: '10px 16px',
                      marginBottom: 16,
                      fontSize: 13,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#785839', fontWeight: 600 }}>Currently configuring:</span>
                      <strong>{activePet.name}</strong>
                      <span style={{ color: '#8c735f' }}>
                        ({isPetCat(activePet.species) ? 'Feline' : 'Canine'}{' '}
                        {activePet.breed ? `· ${activePet.breed}` : ''})
                      </span>
                    </div>
                    <span
                      style={{
                        backgroundColor: '#faf6f0',
                        border: '1px solid #eeddc8',
                        color: '#785839',
                        fontWeight: 700,
                        padding: '2px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                      }}
                    >
                      {activePet.weight} kg tier
                    </span>
                  </div>
                )}

                {/* A. GROOMING FLOW FOR ACTIVE PET */}
                {category === 'Grooming' && activePet && (
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
                      Select Treatments for {activePet.name} <span style={{ color: '#dc2626' }}>*</span>
                    </label>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: 12,
                        marginBottom: 20,
                      }}
                    >
                      {groomingServicesForActivePet.map((srv) => {
                        const isSelected =
                          petServices[activePet.id]?.groomingIds?.includes(srv.id) || false
                        const price = getPriceForPet(srv, activePet.weight)

                        return (
                          <div
                            key={srv.id}
                            onClick={() => toggleGroomingForActivePet(srv.id)}
                            style={{
                              cursor: 'pointer',
                              borderRadius: 12,
                              padding: '14px 16px',
                              backgroundColor: isSelected ? '#faf6f0' : '#ffffff',
                              border: isSelected ? '2px solid #3d2d23' : '1.5px solid #eeddc8',
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
                                {activePet.weight} kg rate
                              </span>
                              <span style={{ fontWeight: 700, color: '#3d2d23', fontSize: 14 }}>
                                {vnd.format(price)}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* B. BOARDING FLOW FOR ACTIVE PET */}
                {category === 'Boarding' && activePet && (
                  <div style={{ marginBottom: 20 }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#3d2d23',
                        marginBottom: 10,
                      }}
                    >
                      Select Suite for {activePet.name} <span style={{ color: '#dc2626' }}>*</span>
                    </label>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: 14,
                        marginBottom: 16,
                      }}
                    >
                      {boardingServicesForActivePet.map((suite) => {
                        const isSelected = petServices[activePet.id]?.boardingId === suite.id
                        const tier = getRoomTierInfo(suite.roomTypeName, suite.name)
                        const price = getPriceForPet(suite, activePet.weight)

                        return (
                          <div
                            key={suite.id}
                            onClick={() => setBoardingSuiteForActivePet(suite.id)}
                            style={{
                              cursor: 'pointer',
                              borderRadius: 14,
                              padding: '16px 18px',
                              backgroundColor: isSelected ? '#faf6f0' : '#ffffff',
                              border: isSelected ? '2px solid #3d2d23' : '1.5px solid #eeddc8',
                              boxShadow: isSelected ? '0 4px 14px rgba(61,45,35,0.08)' : 'none',
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

                    {/* Diet Add-on Selector for Active Pet */}
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
                        Diet Add-on for {activePet.name} (Optional)
                      </label>
                      <Select
                        className="haven-custom-select"
                        allowClear
                        style={{ width: '100%', maxWidth: 450 }}
                        placeholder="Choose a culinary nutrition plan (Optional)"
                        value={petServices[activePet.id]?.dietId || ''}
                        onChange={(val) => setDietForActivePet(val || undefined)}
                        options={[
                          {
                            value: '',
                            label: 'Standard Meal (No customized culinary add-on)',
                          },
                          ...dietServices.map((d) => {
                            const price = getPriceForPet(d, activePet.weight)
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

                {/* SHARED SCHEDULE SECTION */}
                <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1.5px solid #eeddc8' }}>
                  {category === 'Grooming' ? (
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#3d2d23',
                          marginBottom: 8,
                        }}
                      >
                        Appointment Date & Time (Shared for all pets) <span style={{ color: '#dc2626' }}>*</span>
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
                  ) : (
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#3d2d23',
                          marginBottom: 8,
                        }}
                      >
                        Boarding Check-in & Check-out Dates (Shared stay) <span style={{ color: '#dc2626' }}>*</span>
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
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Voucher & Concierge Notes */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1.5px solid #eeddc8',
              borderRadius: 20,
              padding: '24px 28px',
              boxShadow: '0 4px 18px rgba(61,45,35,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
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
                  Privilege Voucher & Front Desk Notes
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#8c735f' }}>
                  Apply customer promo code and document pet care instructions or requests
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Voucher Code Input */}
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
                  <GiftOutlined style={{ color: '#785839', marginRight: 4 }} /> Promo / Privilege Voucher (Optional)
                </label>

                {appliedVoucher ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#fdfbf7',
                      border: '1.5px solid #eeddc8',
                      borderRadius: 12,
                      padding: '12px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          backgroundColor: '#faf6f0',
                          border: '1px solid #eeddc8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#785839',
                          fontSize: 16,
                          flexShrink: 0,
                        }}
                      >
                        <GiftOutlined />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              fontFamily: "'Playfair Display', serif",
                              fontSize: 16,
                              fontWeight: 700,
                              color: '#3d2d23',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {appliedVoucher.code}
                          </span>
                          <span
                            style={{
                              backgroundColor: '#faf6f0',
                              border: '1px solid #eeddc8',
                              color: '#785839',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '1px 8px',
                            }}
                          >
                            Applied
                          </span>
                        </div>
                        <div style={{ fontSize: 12.5, color: '#785839', marginTop: 2 }}>
                          {String(appliedVoucher.discountType).toLowerCase() === 'percentage'
                            ? `Privilege discount: -${appliedVoucher.discountValue}% off order total`
                            : `Privilege discount: -${vnd.format(appliedVoucher.discountValue)} off order total`}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      style={{
                        padding: '5px 14px',
                        borderRadius: 999,
                        backgroundColor: '#ffffff',
                        border: '1px solid #fecaca',
                        color: '#dc2626',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div style={{ maxWidth: 460 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Enter voucher code (e.g. SANCTUARY10)"
                        value={voucherInput}
                        onChange={(e) => {
                          setVoucherInput(e.target.value)
                          setVoucherError(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleApplyVoucher()
                          }
                        }}
                        style={{
                          flex: 1,
                          height: 42,
                          borderRadius: 10,
                          border: '1.5px solid #eeddc8',
                          padding: '0 14px',
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#3d2d23',
                          textTransform: 'uppercase',
                          outline: 'none',
                          backgroundColor: '#ffffff',
                        }}
                      />
                      <Button
                        loading={checkingVoucher}
                        onClick={handleApplyVoucher}
                        style={{
                          height: 42,
                          borderRadius: 10,
                          backgroundColor: '#3d2d23',
                          borderColor: '#3d2d23',
                          color: '#ffffff',
                          fontWeight: 600,
                          padding: '0 20px',
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                    {voucherError && (
                      <div
                        style={{
                          color: '#dc2626',
                          fontSize: 12,
                          marginTop: 6,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <WarningOutlined />
                        <span>{voucherError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Care Notes (Full width on its own line) */}
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
                  Front Desk & Care Notes (Optional)
                </label>
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
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8c735f', marginBottom: 4 }}>
                Customer
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#3d2d23' }}>
                {selectedCustomer ? selectedCustomer.fullName : '— No customer selected —'}
              </div>
              {selectedCustomer?.phoneNumber && (
                <div style={{ fontSize: 12, color: '#785839', marginTop: 1 }}>
                  📞 {selectedCustomer.phoneNumber}
                </div>
              )}
            </div>

            {/* Selected Pets */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8c735f', marginBottom: 6 }}>
                Companions ({selectedPetIds.length})
              </div>
              {selectedPetIds.length === 0 ? (
                <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                  No pets selected
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedPetIds.map((pId) => {
                    const pet = pets.find((p) => p.id === pId)
                    if (!pet) return null
                    return (
                      <span
                        key={pId}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor: '#faf6f0',
                          border: '1px solid #eeddc8',
                          color: '#785839',
                          borderRadius: 999,
                          padding: '2px 10px',
                        }}
                      >
                        {isPetCat(pet.species) ? <CatIcon size={14} /> : <DogIcon size={14} />}
                        {pet.name} ({pet.weight}kg)
                      </span>
                    )
                  })}
                </div>
              )}
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

            {/* Line Items Breakdown Grouped by Pet */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8c735f', marginBottom: 8 }}>
                Itemized Line Items
              </div>

              {Object.keys(lineItemsByPet).length === 0 ? (
                <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', padding: '6px 0' }}>
                  No services configured yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Object.values(lineItemsByPet).map(({ pet, items, subtotal }) => (
                    <div
                      key={pet.id}
                      style={{
                        backgroundColor: '#fdfbf7',
                        border: '1px solid #eeddc8',
                        borderRadius: 12,
                        padding: '10px 12px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontWeight: 700,
                          fontSize: 13,
                          color: '#3d2d23',
                          marginBottom: 6,
                          paddingBottom: 4,
                          borderBottom: '1px dashed #eeddc8',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          {isPetCat(pet.species) ? <CatIcon size={14} /> : <DogIcon size={14} />}
                          {pet.name}
                        </span>
                        <span style={{ color: '#785839' }}>{vnd.format(subtotal)}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {items.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: 12,
                              color: '#5c4033',
                            }}
                          >
                            <span>{item.name}</span>
                            <span style={{ fontWeight: 600 }}>{vnd.format(item.total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ height: 1, backgroundColor: '#eeddc8', margin: '14px 0' }} />

            {/* Subtotal */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
                marginBottom: 6,
                color: '#8c735f',
              }}
            >
              <span>Subtotal:</span>
              <span style={{ fontWeight: 600, color: '#3d2d23' }}>{vnd.format(totalEstimatedCost)}</span>
            </div>

            {/* Voucher Discount (View only in Summary) */}
            {appliedVoucher && voucherDiscount > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  marginBottom: 6,
                  color: '#b45309',
                  fontWeight: 600,
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <GiftOutlined style={{ color: '#785839' }} /> Voucher ({appliedVoucher.code}):
                </span>
                <span style={{ fontWeight: 700 }}>-{vnd.format(voucherDiscount)}</span>
              </div>
            )}

            {/* Estimated Total */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 16,
                marginTop: appliedVoucher && voucherDiscount > 0 ? 8 : 4,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#3d2d23' }}>
                  Total Estimated:
                </div>
                <div style={{ fontSize: 11.5, color: '#8c735f' }}>
                  {appliedVoucher ? 'After privilege voucher' : 'Due at check-out counter'}
                </div>
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#3d2d23',
                }}
              >
                {vnd.format(finalTotalCost)}
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
                {selectedPetIds.length > 1
                  ? `Create Booking (${selectedPetIds.length} Pets)`
                  : 'Create Walk-in Booking'}
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
