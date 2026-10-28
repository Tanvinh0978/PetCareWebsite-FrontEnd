import React, { useState, useEffect, useMemo } from 'react';
import { DogIcon, CatIcon, PawIcon } from '@/components/common/PetIcons'
import { Steps, Form, DatePicker, Input, Button, Typography, Spin, message, Row, Col, Divider, Tag, Empty, Tabs, Checkbox, Radio, Card, Space, Alert } from 'antd';
import { ScissorOutlined, HomeOutlined, LoginOutlined, LogoutOutlined, CalendarOutlined, CheckCircleFilled, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, GiftOutlined, InfoCircleOutlined, ShopOutlined, RightOutlined, LeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import { petService } from '@/services/pet.service';
import { serviceService } from '@/services/service.service';
import { bookingService, rememberVnpayBooking } from '@/services/booking.service';
import { roomService } from '@/services/room.service';
import type { ServiceDTO } from '@/types/service.types';
import { isServiceCompatibleWithPet, getRoomTierInfo, isPetCat } from '@/utils/petServiceFilter';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const CreateBookingPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  
  const [pets, setPets] = useState<any[]>([]);
  const [services, setServices] = useState<ServiceDTO[]>([]);
  const [roomUnavailableMap, setRoomUnavailableMap] = useState<Record<string, string[]>>({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [rangeAvailability, setRangeAvailability] = useState<{
    isAvailable: boolean;
    message?: string;
    fullyBookedDates?: string[];
  } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // New state to separate flows
  const [bookingType, setBookingType] = useState<'Grooming' | 'Boarding' | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [activePetTab, setActivePetTab] = useState<string>('');

  const [petServices, setPetServices] = useState<Record<string, { groomingIds?: string[], boardingId?: string, dietId?: string }>>({});
  const selectedPetIds: string[] = Form.useWatch('petIds', form) || [];
  const groomingDate = Form.useWatch('groomingDate', form);
  const boardingDateRange = Form.useWatch('boardingDateRange', form);
  const voucherCode = Form.useWatch('voucherCode', form);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (bookingType === 'Boarding') {
      form.setFieldValue('paymentChoice', 'VNPAY');
    } else if (bookingType === 'Grooming') {
      form.setFieldValue('paymentChoice', 'PAY_AT_COUNTER');
    }
  }, [bookingType, form]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [petsRes, servicesData] = await Promise.all([
        petService.fetchMyPets(true),
        serviceService.fetchActive()
      ]);
      const petsList = (petsRes as any).result || (petsRes as any).data || petsRes;
      const rawPets = Array.isArray(petsList) ? petsList : (petsList.items || []);
      setPets(rawPets.filter((p: any) => p.isActive !== false && !p.isDeleted));
      
      const servicesWithDetails = await Promise.all(
        servicesData.map(async (srv) => {
          try {
            const detailRes: any = await serviceService.fetchById(srv.id);
            return detailRes.result || detailRes.data || detailRes;
          } catch {
            return srv;
          }
        })
      );
      setServices(servicesWithDetails);
    } catch (error) {
      message.error('Failed to load pets or services');
    } finally {
      setLoading(false);
    }
  };

  const getPriceForPet = (service: ServiceDTO, petWeight: number) => {
    if (!service.prices || service.prices.length === 0) return 0;
    const priceObj = service.prices.find(p => 
      (p.minWeight == null || p.minWeight <= petWeight) && 
      (p.maxWeight == null || p.maxWeight >= petWeight)
    );
    return priceObj ? priceObj.price : 0;
  };

  const { hasGrooming, hasBoarding, boardingServiceIds } = useMemo(() => {
    let groomingSelected = false;
    const boardingIds = new Set<string>();
    Object.values(petServices).forEach((srv: any) => {
      if (srv?.groomingIds?.length > 0) groomingSelected = true;
      if (srv?.boardingId) boardingIds.add(srv.boardingId);
    });
    return { hasGrooming: groomingSelected, hasBoarding: boardingIds.size > 0, boardingServiceIds: boardingIds };
  }, [petServices]);

    const unconfiguredPets = useMemo(() => {
    return selectedPetIds
      .map(id => pets.find(p => p.id === id))
      .filter((pet): pet is any => {
        if (!pet) return false;
        const srvs = petServices[pet.id];
        if (bookingType === 'Grooming') {
          return !srvs || !srvs.groomingIds || srvs.groomingIds.length === 0;
        }
        if (bookingType === 'Boarding') {
          return !srvs || !srvs.boardingId;
        }
        return false;
      });
  }, [selectedPetIds, pets, petServices, bookingType]);

  const hasMissingPetServices = unconfiguredPets.length > 0;

  useEffect(() => {
    if (selectedPetIds.length > 0 && !selectedPetIds.includes(activePetTab)) {
      setActivePetTab(selectedPetIds[0]);
    }
  }, [selectedPetIds, activePetTab]);

  const boardingServiceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    selectedPetIds.forEach(petId => {
      const bId = petServices[petId]?.boardingId;
      if (bId) {
        counts[bId] = (counts[bId] || 0) + 1;
      }
    });
    return counts;
  }, [selectedPetIds, petServices]);

  useEffect(() => {
    if (bookingType === 'Boarding' && boardingServiceIds.size > 0) {
      let isMounted = true;
      const fetchAvailability = async () => {
        const newMap: Record<string, string[]> = {};
        for (const bId of Array.from(boardingServiceIds)) {
          const boardingService = services.find((service) => service.id === bId);
          if (boardingService?.roomTypeId) {
            try {
              const requiredCount = boardingServiceCounts[bId] || 1;
              const roomRes: any = await roomService.checkAvailability({
                serviceId: bId,
                startDate: dayjs().startOf('day').format('YYYY-MM-DD'),
                endDate: dayjs().add(90, 'day').format('YYYY-MM-DD')
              });
              const resData = roomRes?.result || roomRes?.data || roomRes;
              if (resData?.dailyAvailabilities && Array.isArray(resData.dailyAvailabilities)) {
                const unavail = resData.dailyAvailabilities
                  .filter((d: any) => (d.availableRooms ?? 0) < requiredCount || !d.isAvailable)
                  .map((d: any) => dayjs(d.date).format('YYYY-MM-DD'));
                newMap[bId] = unavail;
              }
            } catch (e) {
              console.error('Failed to load room calendar availability', e);
            }
          }
        }
        if (isMounted) {
          setRoomUnavailableMap(newMap);
        }
      };
      fetchAvailability();
      return () => { isMounted = false; };
    }
  }, [boardingServiceIds, boardingServiceCounts, bookingType, services]);

  const mergedUnavailableDates = useMemo(() => {
    return Array.from(boardingServiceIds).reduce((acc: string[], id: string) => {
      const dates = roomUnavailableMap[id] || [];
      return [...acc, ...dates];
    }, []);
  }, [boardingServiceIds, roomUnavailableMap]);

  const disabledDate = (current: Dayjs) => {
    if (!current) return false;
    if (current < dayjs().startOf('day')) return true;
    return mergedUnavailableDates.includes(current.format('YYYY-MM-DD'));
  };

  useEffect(() => {
    if (bookingType !== 'Boarding' || !boardingDateRange || boardingDateRange.length < 2 || !boardingDateRange[0] || !boardingDateRange[1]) {
      setRangeAvailability(null);
      setCheckingAvailability(false);
      return;
    }

    if (boardingServiceIds.size === 0) {
      setRangeAvailability(null);
      setCheckingAvailability(false);
      return;
    }

    let isMounted = true;
    const checkRange = async () => {
      setCheckingAvailability(true);
      try {
        const startDateStr = boardingDateRange[0].format('YYYY-MM-DD');
        const endDateStr = boardingDateRange[1].format('YYYY-MM-DD');

        let allAvailable = true;
        const fullyBookedSet = new Set<string>();

        for (const bId of Array.from(boardingServiceIds)) {
          const boardingService = services.find(s => s.id === bId);
          if (!boardingService?.roomTypeId) continue;

          const requiredCount = boardingServiceCounts[bId] || 1;
          const roomRes: any = await roomService.checkAvailability({
            serviceId: bId,
            startDate: startDateStr,
            endDate: endDateStr
          });

          const resData = roomRes?.result || roomRes?.data || roomRes;
          if (resData?.dailyAvailabilities && Array.isArray(resData.dailyAvailabilities)) {
            for (const daily of resData.dailyAvailabilities) {
              const available = daily.availableRooms ?? 0;
              if (available < requiredCount || !daily.isAvailable) {
                allAvailable = false;
                fullyBookedSet.add(dayjs(daily.date).format('DD/MM/YYYY'));
              }
            }
          } else if (resData?.isFullRangeAvailable === false) {
            allAvailable = false;
          }
        }

        if (!isMounted) return;

        if (allAvailable) {
          setRangeAvailability({
            isAvailable: true,
            message: 'Rooms are available for your selected dates! You can proceed with your booking.'
          });
        } else {
          const bookedDatesList = Array.from(fullyBookedSet);
          setRangeAvailability({
            isAvailable: false,
            fullyBookedDates: bookedDatesList,
            message: bookedDatesList.length > 0
              ? `No rooms available on: ${bookedDatesList.slice(0, 5).join(', ')}${bookedDatesList.length > 5 ? '...' : ''}. Please choose different dates.`
              : 'No rooms available for your selected dates. Please choose different dates or select another room type.'
          });
        }
      } catch (err) {
        console.error('Failed to verify date range availability', err);
        if (isMounted) {
          setRangeAvailability({
            isAvailable: false,
            message: 'Unable to verify room availability for the selected dates. Please try again.'
          });
        }
      } finally {
        if (isMounted) {
          setCheckingAvailability(false);
        }
      }
    };

    checkRange();

    return () => {
      isMounted = false;
    };
  }, [boardingDateRange, boardingServiceIds, boardingServiceCounts, bookingType, services]);

  const next = () => {
    if (currentStep === 0 && selectedPetIds.length === 0) return message.warning('Please select at least 1 pet.');
    if (currentStep === 1) {
      if (unconfiguredPets.length > 0) {
        const firstUnconfigured = unconfiguredPets[0];
        if (firstUnconfigured) {
          setActivePetTab(firstUnconfigured.id);
        }
        const petNames = unconfiguredPets.map(p => `"${p.name}"`).join(', ');
        return message.warning(
          bookingType === 'Boarding'
            ? `Please select a boarding room for ${petNames} before proceeding.`
            : `Please select at least 1 care service for ${petNames} before proceeding.`
        );
      }

      if (bookingType === 'Boarding') {
        const unlinkedService = Array.from(boardingServiceIds)
          .map((id) => services.find((service) => service.id === id))
          .find((service) => !service?.roomTypeId);
        if (unlinkedService) {
          return message.error(`Boarding service "${unlinkedService.name}" has no room type linked. Please contact the store to configure this service.`);
        }
      }
    }
    if (currentStep === 2) {
      if (bookingType === 'Boarding') {
        if (!boardingDateRange || boardingDateRange.length < 2) {
          return message.warning('Please select a boarding period (Check-in and Check-out).');
        }
        if (checkingAvailability) {
          return message.loading('Checking room availability, please wait...');
        }
        if (rangeAvailability && !rangeAvailability.isAvailable) {
          return message.error(rangeAvailability.message || 'No rooms available for the selected dates. Please choose another date range.');
        }
      }
      if (bookingType === 'Grooming' && !groomingDate) return message.warning('Please select a date and time for Grooming.');
    }
    setCurrentStep(currentStep + 1);
  };
  
  const prev = () => {
    if (currentStep === 0) {
      setBookingType(null); // Go back to flow selection
      setPetServices({}); // Reset services
      form.resetFields();
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateTotal = () => {
    let total = 0;
    selectedPetIds.forEach(petId => {
      const pet = pets.find(p => p.id === petId);
      if (!pet) return;
      const srvs = petServices[petId];
      if (!srvs) return;
      
      if (bookingType === 'Grooming' && srvs.groomingIds) {
        srvs.groomingIds.forEach((id: string) => {
          const s = services.find(x => x.id === id);
          if (s) total += getPriceForPet(s, pet.weight);
        });
      }
      
      if (bookingType === 'Boarding') {
        if (srvs.boardingId) {
          const s = services.find(x => x.id === srvs.boardingId);
          if (s) {
            let days = 1;
            if (boardingDateRange && boardingDateRange.length === 2) {
               days = Math.max(1, boardingDateRange[1].diff(boardingDateRange[0], 'day'));
            }
            total += getPriceForPet(s, pet.weight) * days;
          }
        }
        if (srvs.dietId) {
           const s = services.find(x => x.id === srvs.dietId);
           if (s) {
              let days = 1;
              if (boardingDateRange && boardingDateRange.length === 2) {
                 days = Math.max(1, boardingDateRange[1].diff(boardingDateRange[0], 'day'));
              }
              total += getPriceForPet(s, pet.weight) * days;
           }
        }
      }
    });
    return total;
  };
  const totalAmount = calculateTotal();

  const onFinish = async (values: any) => {
    if (hasMissingPetServices) {
      const petNames = unconfiguredPets.map(p => `"${p?.name}"`).join(', ');
      message.error(`Please select services for ${petNames} before confirming your booking.`);
      setCurrentStep(1);
      if (unconfiguredPets[0]) setActivePetTab(unconfiguredPets[0].id);
      return;
    }
    if (bookingType === 'Boarding') {
      const unlinkedService = Array.from(boardingServiceIds)
        .map((id) => services.find((service) => service.id === id))
        .find((service) => !service?.roomTypeId);
      if (unlinkedService) {
        message.error(`Boarding service "${unlinkedService.name}" has no room type linked. Please contact the store to configure this service.`);
        return;
      }
    }

    const bookingItems: any[] = [];
    
    selectedPetIds.forEach(petId => {
      const srvs = petServices[petId];
      if (!srvs) return;
      
      if (bookingType === 'Grooming' && srvs.groomingIds && srvs.groomingIds.length > 0) {
        srvs.groomingIds.forEach((gId: string) => {
          bookingItems.push({
            petId,
            serviceId: gId,
            scheduledStartAt: values.groomingDate.format('YYYY-MM-DDTHH:mm:ss'),
            scheduledEndAt: null,
            quantity: 1
          });
        });
      }
      
      if (bookingType === 'Boarding') {
        let boardingDays = 1;
        if (values.boardingDateRange && values.boardingDateRange.length === 2) {
          boardingDays = Math.max(1, values.boardingDateRange[1].diff(values.boardingDateRange[0], 'day'));
        }

        const isSameDay = values.boardingDateRange[0].isSame(values.boardingDateRange[1], 'day');
        const startHour = isSameDay ? 8 : 14;
        const endHour = isSameDay ? 18 : 12;

        const scheduledStartAt = values.boardingDateRange[0].startOf('day').add(startHour, 'hour').format('YYYY-MM-DDTHH:mm:ss');
        const scheduledEndAt = values.boardingDateRange[1].startOf('day').add(endHour, 'hour').format('YYYY-MM-DDTHH:mm:ss');

        if (srvs.boardingId) {
          bookingItems.push({
            petId,
            serviceId: srvs.boardingId,
            scheduledStartAt,
            scheduledEndAt,
            quantity: boardingDays
          });
        }
  
        if (srvs.dietId) {
          bookingItems.push({
            petId,
            serviceId: srvs.dietId,
            scheduledStartAt,
            scheduledEndAt,
            quantity: boardingDays
          });
        }
      }
    });

    try {
      setSubmitting(true);
      const customerId = localStorage.getItem('petcare.customerId');
      const paymentChoice = bookingType === 'Boarding' ? 'VNPAY' : (values.paymentChoice || 'PAY_AT_COUNTER');
      const payload: any = {
        voucherCode: values.voucherCode?.trim() || undefined,
        paymentChoice,
        bookingItems,
      };
      if (customerId && customerId.trim()) {
        payload.customerId = customerId.trim();
      }
      const res: any = await bookingService.create(payload);

      if (paymentChoice === 'VNPAY') {
        const createdBooking = res?.result ?? res?.data?.result ?? res?.data ?? res;
        let paymentUrl = createdBooking?.paymentUrl || res?.paymentUrl || null;
        const newBookingId = createdBooking?.bookingId || createdBooking?.id || res?.bookingId || res?.id;
        if (newBookingId) rememberVnpayBooking(String(newBookingId));
        if (!paymentUrl && newBookingId) {
          try {
            const vnpayRes: any = await bookingService.createVnpayUrl(newBookingId);
            paymentUrl = vnpayRes?.result?.paymentUrl || vnpayRes?.data?.paymentUrl || vnpayRes?.paymentUrl || (typeof vnpayRes?.result === 'string' ? vnpayRes.result : null);
          } catch (vnpErr) {
            console.error('Error creating VNPay URL:', vnpErr);
          }
        }
        if (paymentUrl) {
          message.loading({ content: 'Redirecting to VNPay...', key: 'vnpay-nav' });
          window.location.href = paymentUrl;
          return;
        }
        if (newBookingId) {
          message.warning('Your booking was created. You can restart VNPay payment from My Bookings.');
          navigate('/customer/bookings');
          return;
        }
      }

      message.success('Booking created successfully!');
      navigate('/customer/bookings');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to create booking';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePet = (id: string) => {
    const current = form.getFieldValue('petIds') || [];
    if (current.includes(id)) {
      form.setFieldsValue({ petIds: current.filter((x: string) => x !== id) });
      setPetServices(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      form.setFieldsValue({ petIds: [...current, id] });
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>;

  // Flow Selection Screen
  if (bookingType === null) {
    return (
      <div className="booking-page-wrap">
        <div className="booking-hero-header">
          <div className="hero-pill-badge" style={{ margin: '0 auto 1rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><PawIcon size={14} style={{ color: 'var(--primary)' }} /> Haven &amp; Hound · Sanctuary Concierge</span>
          </div>
          <h1 className="booking-page-title">Reserve a Sanctuary Experience</h1>
          <p className="booking-page-subtitle">
            Choose between our tailored botanical spa treatments and luxury climate-controlled hotel suites.
          </p>
        </div>
        <Row gutter={[28, 28]} justify="center">
          <Col xs={24} md={12}>
            <div 
              className="booking-flow-card"
              onClick={() => {
                setBookingType('Grooming');
                setCurrentStep(0);
              }}
              style={{ padding: '36px 30px', display: 'flex', flexDirection: 'column' }}
            >
              <div className="booking-flow-icon"><ScissorOutlined style={{ fontSize: "32px", color: "var(--secondary)" }} /></div>
              <h2 className="booking-flow-title" style={{ textAlign: 'center' }}>Botanical Grooming &amp; Spa</h2>
              <Text type="secondary" style={{ fontSize: '15px', display: 'block', textAlign: 'center', color: 'var(--secondary)', fontWeight: 600, marginBottom: '20px' }}>
                Bespoke styling and therapeutic bathing
              </Text>
              <ul className="booking-flow-list" style={{ flex: 1 }}>
                <li><span className="check">✓</span> Gentle botanical bath &amp; warm blow-dry</li>
                <li><span className="check">✓</span> Breed-specific trimming &amp; luxury coat styling</li>
                <li><span className="check">✓</span> Ear cleansing, nail filing &amp; paw nourishment</li>
                <li><span className="check">✓</span> Calming aromatics &amp; low-stress handling</li>
              </ul>
              <button type="button" className="btn" style={{ width: '100%', padding: '0.8rem 1.5rem', fontSize: '1rem', marginTop: 'auto' }}>
                Book Spa Service →
              </button>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div 
              className="booking-flow-card"
              onClick={() => {
                setBookingType('Boarding');
                setCurrentStep(0);
              }}
              style={{ padding: '36px 30px', display: 'flex', flexDirection: 'column' }}
            >
              <div className="booking-flow-icon"><HomeOutlined style={{ fontSize: "32px", color: "var(--secondary)" }} /></div>
              <h2 className="booking-flow-title" style={{ textAlign: 'center' }}>Sanctuary Hotel Suites</h2>
              <Text type="secondary" style={{ fontSize: '15px', display: 'block', textAlign: 'center', color: 'var(--secondary)', fontWeight: 600, marginBottom: '20px' }}>
                Overnight boarding with attentive hospitality
              </Text>
              <ul className="booking-flow-list" style={{ flex: 1 }}>
                <li><span className="check">✓</span> Private climate-controlled suites &amp; soft orthopedic bedding</li>
                <li><span className="check">✓</span> 24/7 dedicated caregiver attention &amp; health checks</li>
                <li><span className="check">✓</span> Tailored nutrition, dining plans &amp; fresh treats</li>
                <li><span className="check">✓</span> Daily play sessions &amp; regular photo updates</li>
              </ul>
              <button type="button" className="btn" style={{ width: '100%', padding: '0.8rem 1.5rem', fontSize: '1rem', marginTop: 'auto' }}>
                Book a Suite →
              </button>
            </div>
          </Col>
        </Row>
      </div>
    );
  }

  const groomingOptions = services.filter(s => {
    const t = String(s.serviceType || '').toLowerCase();
    return t === 'grooming' || t === 'care';
  });
  const boardingOptions = services.filter(s => String(s.serviceType || '').toLowerCase() === 'boarding');
  const dietOptions = services.filter(s => String(s.serviceType || '').toLowerCase() === 'diet');


  // Sanctuary Spa operating hours: 08:00 - 20:00 (8 AM to 8 PM)
  const disabledGroomingTime = (selectedDate: Dayjs | null) => {
    const now = dayjs();
    const OPEN_HOUR = 8;
    const CLOSE_HOUR = 20;

    const offHours: number[] = [];
    for (let h = 0; h < 24; h++) {
      if (h < OPEN_HOUR || h > CLOSE_HOUR) {
        offHours.push(h);
      }
    }

    if (!selectedDate || !selectedDate.isSame(now, 'day')) {
      return {
        disabledHours: () => offHours,
        disabledMinutes: () => [],
      };
    }

    // Today: only future hours & minutes
    const currentHour = now.hour();
    const currentMinute = now.minute();
    const disabledHoursList = new Set(offHours);

    for (let h = 0; h < currentHour; h++) {
      disabledHoursList.add(h);
    }
    // If we are past 45 minutes of current hour, disable current hour
    if (currentMinute > 45) {
      disabledHoursList.add(currentHour);
    }

    return {
      disabledHours: () => Array.from(disabledHoursList).sort((a, b) => a - b),
      disabledMinutes: (selectedHour: number) => {
        if (selectedHour === currentHour) {
          const disabledMins: number[] = [];
          for (let m = 0; m <= currentMinute; m += 15) {
            if (m < 60) disabledMins.push(m);
          }
          return disabledMins;
        }
        return [];
      },
    };
  };

  const steps = [
    {
      title: 'Choose Pets',
      content: (
        <div className="step-container fade-in">
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <Title level={3} style={{ fontFamily: 'var(--font-heading)', color: 'var(--slate-900)', margin: '0 0 6px 0' }}>
              Select Your Companions
            </Title>
            <Text type="secondary" style={{ fontSize: '15px', color: 'var(--slate-600)' }}>
              Choose one or multiple pets for this {bookingType === 'Grooming' ? 'spa visit' : 'hotel stay'}
            </Text>
          </div>
          
          <Form.Item name="petIds" rules={[{ required: true, message: 'Please select at least 1 pet' }]}>
             <Row gutter={[20, 20]} justify="center">
                {pets.length === 0 && <Empty description="No pets found. Please add a pet in My Pets first." />}
                {pets.map(pet => {
                  const isSelected = selectedPetIds.includes(pet.id);
                  const isCat = pet.species === 1 || String(pet.species).toLowerCase() === 'cat';
                  return (
                    <Col xs={12} sm={8} md={6} key={pet.id}>
                      <div 
                        onClick={() => handleTogglePet(pet.id)}
                        className={`pet-select-card ${isSelected ? 'selected' : ''}`}
                      >
                        {isSelected && (
                          <CheckCircleFilled 
                            style={{ 
                              position: 'absolute', 
                              top: 12, 
                              right: 12, 
                              fontSize: '20px', 
                              color: 'var(--secondary)' 
                            }} 
                          />
                        )}
                        <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {pet.imageUrl ? (
                            <img
                              src={pet.imageUrl}
                              alt={pet.name}
                              style={{
                                width: 68,
                                height: 68,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: `2.5px solid ${isSelected ? 'var(--secondary)' : 'var(--slate-200)'}`,
                                display: 'block',
                                transition: 'border-color 0.2s ease',
                              }}
                            />
                          ) : (
                            <div style={{ 
                              fontSize: '34px', 
                              width: 68,
                              height: 68, 
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary-light)',
                              border: `1.5px solid ${isSelected ? 'var(--secondary)' : 'var(--slate-200)'}`,
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center' 
                            }}>
                              {isCat ? <CatIcon size={32} style={{ color: '#7e22ce' }} /> : <DogIcon size={32} style={{ color: '#1d4ed8' }} />}
                            </div>
                          )}
                        </div>
                        <Title level={5} style={{ margin: 0, color: 'var(--slate-900)', fontFamily: 'var(--font-sans)', fontWeight: 700 }}>
                          {pet.name}
                        </Title>
                        <Tag style={{ 
                          marginTop: '8px', 
                          borderRadius: '999px',
                          background: isSelected ? 'var(--accent-light)' : 'var(--slate-100)',
                          color: isSelected ? 'var(--secondary)' : 'var(--slate-700)',
                          border: '1px solid var(--slate-200)',
                          fontWeight: 600,
                          fontSize: '12px',
                          padding: '2px 10px',
                        }}>
                          {pet.weight} kg
                        </Tag>
                      </div>
                    </Col>
                  );
                })}
              </Row>
          </Form.Item>
        </div>
      )
    },
    {
      title: bookingType === 'Grooming' ? 'Select Services' : 'Select Suite & Diet',
      content: (
        <div className="step-container fade-in">
           <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <Title level={3} style={{ fontFamily: 'var(--font-heading)', color: 'var(--slate-900)', margin: '0 0 6px 0' }}>
              {bookingType === 'Grooming' ? 'Select Spa & Grooming Treatments' : 'Select Suite & Nutrition Plan'}
            </Title>
            <Text type="secondary" style={{ fontSize: '15px', color: 'var(--slate-600)' }}>
              Select options for each pet; pricing is tailored automatically based on your pet's weight
            </Text>
          </div>

          <Tabs 
            type="card"
            className="booking-tabs"
            activeKey={activePetTab || selectedPetIds[0]}
            onChange={(key) => setActivePetTab(key)}
            items={selectedPetIds.map(petId => {
              const pet = pets.find(p => p.id === petId);
              if (!pet) return { key: petId, label: 'Unknown' };
              const isCat = isPetCat(pet.species);
              const pServices = petServices[petId] || {};
              const petGroomingOptions = groomingOptions.filter(srv => isServiceCompatibleWithPet(srv, pet.species));
              const petBoardingOptions = boardingOptions.filter(srv => isServiceCompatibleWithPet(srv, pet.species));
              const petDietOptions = dietOptions.filter(srv => isServiceCompatibleWithPet(srv, pet.species));

              const isPetConfigured = bookingType === 'Grooming'
                ? Boolean(pServices.groomingIds && pServices.groomingIds.length > 0)
                : Boolean(pServices.boardingId);

              return {
                key: petId,
                label: (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600 }}>{pet.name}</span>
                    <Tag color={isCat ? 'purple' : 'blue'} style={{ fontSize: '11px', margin: 0, padding: '0 6px', borderRadius: 4, fontWeight: 500 }}>
                      {isCat ? 'Cat' : 'Dog'} · {pet.weight}kg
                    </Tag>
                    {isPetConfigured ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#faf2e9',
                        color: '#785839',
                        border: '1px solid #eeddc8',
                        fontSize: '11px',
                        marginLeft: '4px'
                      }} title="Service configured">✓</span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        background: '#fef3c7',
                        color: '#b45309',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        marginLeft: '4px'
                      }} title="Pending configuration">Not selected</span>
                    )}
                  </span>
                ),
                children: (
                  <div style={{ padding: '22px 20px', background: 'var(--paper-card)', borderRadius: '0 0 14px 14px', border: '1px solid var(--slate-200)', borderTop: 'none' }}>
                    
                    {bookingType === 'Grooming' && (
                      <div style={{ marginBottom: '24px' }}>
                        <Title level={4} style={{ color: 'var(--slate-900)', fontFamily: 'var(--font-heading)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ScissorOutlined style={{ color: 'var(--secondary)', fontSize: '20px' }} /> Botanical Grooming &amp; Spa Treatments
                        </Title>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '10px',
                          marginBottom: '16px',
                          padding: '10px 14px',
                          background: isCat ? '#faf5ff' : '#fdf9f3',
                          border: `1px solid ${isCat ? '#e9d5ff' : '#eeddc8'}`,
                          borderRadius: '10px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircleFilled style={{ color: isCat ? '#7e22ce' : '#c69f7b', fontSize: '16px' }} />
                            <span style={{ fontWeight: 600, color: isCat ? '#7e22ce' : '#785839', fontSize: '0.92rem' }}>
                              {isCat ? 'Spa & grooming treatments tailored for Cats' : 'Spa & grooming treatments tailored for Dogs'}
                            </span>
                          </div>
                          <Tag style={{ 
                            fontWeight: 600, 
                            borderRadius: '6px', 
                            margin: 0,
                            background: isCat ? '#faf5ff' : '#faf2e9',
                            borderColor: isCat ? '#e9d5ff' : '#eeddc8',
                            color: isCat ? '#7e22ce' : '#785839'
                          }}>
                            {isCat ? 'Cat' : 'Dog'} • {pet.weight} kg
                          </Tag>
                        </div>

                        {petGroomingOptions.length === 0 ? (
                          <div style={{ padding: '28px', textAlign: 'center', background: 'var(--slate-50)', borderRadius: '12px', border: '1px dashed var(--slate-300)' }}>
                            <p style={{ margin: 0, color: 'var(--slate-600)' }}>
                              No grooming treatments currently available for {isCat ? 'Cats' : 'Dogs'}.
                            </p>
                          </div>
                        ) : (
                          <Checkbox.Group 
                            style={{ width: '100%' }}
                            value={pServices.groomingIds || []}
                            onChange={(vals) => setPetServices(prev => ({ ...prev, [petId]: { ...prev[petId], groomingIds: vals as string[] } }))}
                          >
                            <Row gutter={[16, 16]}>
                              {petGroomingOptions.map(srv => {
                                const price = getPriceForPet(srv, pet.weight);
                                const isItemChecked = pServices.groomingIds?.includes(srv.id);
                                return (
                                  <Col span={24} key={srv.id}>
                                    <Checkbox 
                                      value={srv.id} 
                                      className="treatment-checkbox"
                                      style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        padding: '16px 18px', 
                                        border: `1.5px solid ${isItemChecked ? 'var(--secondary)' : 'var(--slate-200)'}`, 
                                        borderRadius: '14px', 
                                        background: isItemChecked ? 'var(--primary-light)' : 'var(--paper-card)',
                                        transition: 'all 0.2s ease',
                                        width: '100%',
                                        boxShadow: isItemChecked ? '0 2px 8px rgba(120,88,57,0.08)' : 'none',
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '16px', marginLeft: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 auto', minWidth: 0 }}>
                                          {srv.imageUrl ? (
                                            <img
                                              src={srv.imageUrl}
                                              alt={srv.name}
                                              style={{ width: 56, height: 56, borderRadius: '12px', objectFit: 'cover', border: '1.5px solid #eeddc8', flexShrink: 0 }}
                                            />
                                          ) : (
                                            <div style={{ width: 56, height: 56, borderRadius: '12px', backgroundColor: '#faf2e9', color: '#785839', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1.5px solid #eeddc8' }}>
                                              <ScissorOutlined style={{ fontSize: '24px' }} />
                                            </div>
                                          )}
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <Text strong style={{ fontSize: '1.02rem', color: '#3d2d23', display: 'block', lineHeight: 1.3 }}>{srv.name}</Text>
                                            {srv.description && (
                                              <div style={{ fontSize: '13px', color: '#64748b', marginTop: 3, lineHeight: 1.4 }}>{srv.description}</div>
                                            )}
                                          </div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap', marginLeft: 'auto', paddingLeft: '8px' }}>
                                          <Text strong style={{ color: 'var(--secondary)', fontSize: '1.1rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                            {price.toLocaleString()} VND
                                          </Text>
                                        </div>
                                      </div>
                                    </Checkbox>
                                  </Col>
                                );
                              })}
                            </Row>
                          </Checkbox.Group>
                        )}
                      </div>
                    )}

                    {bookingType === 'Boarding' && (
                      <div>
                        <Title level={4} style={{ color: 'var(--slate-900)', fontFamily: 'var(--font-heading)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <HomeOutlined style={{ color: 'var(--secondary)', fontSize: '20px' }} /> Sanctuary Suites &amp; Rooms
                        </Title>

                        {/* Species header banner */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '12px',
                          marginBottom: '20px',
                          padding: '12px 18px',
                          background: isCat ? '#faf5ff' : '#fdf9f3',
                          border: `1.5px solid ${isCat ? '#e9d5ff' : '#eeddc8'}`,
                          borderRadius: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <CheckCircleFilled style={{ color: isCat ? '#7e22ce' : '#c69f7b', fontSize: '18px' }} />
                            <div>
                              <Text strong style={{ color: isCat ? '#7e22ce' : '#785839', fontSize: '0.98rem' }}>
                                {isCat ? 'Cat-Friendly Sanctuary Suites' : 'Dog-Friendly Resort & Suites'}
                              </Text>
                              <div style={{ fontSize: '12.5px', color: 'var(--slate-600)' }}>
                                {isCat
                                  ? 'Quiet, multi-tier vertical cabins designed specifically for feline comfort'
                                  : 'Spacious, secure accommodations with regular play areas for canines'}
                              </div>
                            </div>
                          </div>
                          <Tag style={{ 
                            fontWeight: 600, 
                            padding: '4px 12px', 
                            borderRadius: '8px', 
                            fontSize: '12px', 
                            margin: 0,
                            background: isCat ? '#faf5ff' : '#faf2e9',
                            borderColor: isCat ? '#e9d5ff' : '#eeddc8',
                            color: isCat ? '#7e22ce' : '#785839'
                          }}>
                            {isCat ? 'Feline Resident' : 'Canine Resident'} • {pet.weight} kg
                          </Tag>
                        </div>

                        {petBoardingOptions.length === 0 ? (
                          <div style={{ padding: '36px', textAlign: 'center', background: 'var(--slate-50)', borderRadius: '14px', border: '1px dashed var(--slate-300)' }}>
                            <HomeOutlined style={{ fontSize: '2.5rem', color: '#94a3b8', display: 'block', marginBottom: '10px' }} />
                            <Title level={4} style={{ color: 'var(--slate-800)', marginBottom: '8px' }}>
                              No boarding suites available for {isCat ? 'Cats' : 'Dogs'}
                            </Title>
                            <p style={{ margin: 0, color: 'var(--slate-600)', fontSize: '0.95rem', maxWidth: '460px', marginInline: 'auto' }}>
                              There are currently no active boarding services linked to {isCat ? 'Cat' : 'Dog'} room types.<br />
                              Please contact our front desk for personal assistance.
                            </p>
                          </div>
                        ) : (
                          <>
                            <Radio.Group 
                              style={{ width: '100%' }}
                              value={pServices.boardingId}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPetServices(prev => ({ 
                                  ...prev, 
                                  [petId]: { 
                                    ...prev[petId], 
                                    boardingId: val,
                                    ...(val ? {} : { dietId: undefined })
                                  } 
                                }));
                              }}
                            >
                              <Row gutter={[16, 16]}>
                                {petBoardingOptions.map(srv => {
                                  const price = getPriceForPet(srv, pet.weight);
                                  const isItemChecked = pServices.boardingId === srv.id;
                                  const tier = getRoomTierInfo(srv.roomTypeName, srv.name);

                                  return (
                                    <Col xs={24} md={petBoardingOptions.length >= 3 ? 8 : 12} key={srv.id} style={{ display: 'flex' }}>
                                      <div 
                                        onClick={() => {
                                          setPetServices(prev => ({ 
                                            ...prev, 
                                            [petId]: { 
                                              ...prev[petId], 
                                              boardingId: srv.id
                                            } 
                                          }));
                                        }}
                                        style={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                          justifyContent: 'space-between',
                                          width: '100%',
                                          cursor: 'pointer',
                                          padding: '16px',
                                          borderRadius: '14px',
                                          border: `2px solid ${isItemChecked ? tier.accentColor : 'var(--slate-200)'}`,
                                          background: isItemChecked ? 'var(--primary-light)' : 'var(--paper-card)',
                                          boxShadow: isItemChecked ? '0 4px 14px rgba(0, 0, 0, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.03)',
                                          transition: 'all 0.25s ease',
                                          position: 'relative',
                                          overflow: 'hidden'
                                        }}
                                      >
                                        <div>
                                          {/* Top Badge + Radio */}
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <span style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '5px',
                                              padding: '3px 10px',
                                              borderRadius: '999px',
                                              fontSize: '0.78rem',
                                              fontWeight: 700,
                                              background: tier.badgeBg,
                                              color: tier.badgeColor,
                                              border: `1px solid ${tier.badgeBorder}`
                                            }}>
                                              {tier.badgeText}
                                            </span>
                                            <Radio value={srv.id} checked={isItemChecked} style={{ pointerEvents: 'none' }} />
                                          </div>

                                          {/* Media + Title */}
                                          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                                            {srv.imageUrl ? (
                                              <img
                                                src={srv.imageUrl}
                                                alt={srv.name}
                                                style={{ width: 52, height: 52, borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--slate-200)', flexShrink: 0 }}
                                              />
                                            ) : (
                                              <div style={{
                                                width: 52,
                                                height: 52,
                                                borderRadius: '10px',
                                                background: tier.badgeBg,
                                                color: tier.badgeColor,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.5rem',
                                                flexShrink: 0
                                              }}>
                                                <HomeOutlined style={{ fontSize: '22px' }} />
                                              </div>
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                              <Text strong style={{ fontSize: '1rem', color: 'var(--slate-900)', display: 'block', lineHeight: 1.3 }}>
                                                {srv.name}
                                              </Text>
                                              {srv.roomTypeName && (
                                                <span style={{ fontSize: '12px', color: 'var(--slate-500)', display: 'block', marginTop: '2px' }}>
                                                  Category: <strong>{srv.roomTypeName}</strong>
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          {/* Description */}
                                          {srv.description && (
                                            <p style={{
                                              fontSize: '13px',
                                              color: 'var(--slate-600)',
                                              margin: '0 0 12px 0',
                                              lineHeight: 1.45,
                                              display: '-webkit-box',
                                              WebkitLineClamp: 3,
                                              WebkitBoxOrient: 'vertical',
                                              overflow: 'hidden'
                                            }}>
                                              {srv.description}
                                            </p>
                                          )}

                                          {/* Feature Highlights */}
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
                                            {tier.features.slice(0, 2).map((feat, fIdx) => (
                                              <span key={fIdx} style={{
                                                fontSize: '11px',
                                                padding: '2px 7px',
                                                borderRadius: '4px',
                                                background: 'var(--slate-100)',
                                                color: 'var(--slate-600)'
                                              }}>
                                                ✓ {feat}
                                              </span>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Price Footer */}
                                        <div style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'baseline',
                                          paddingTop: '10px',
                                          borderTop: '1px solid var(--slate-100)',
                                          marginTop: 'auto'
                                        }}>
                                          <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Price / day:</span>
                                          <Text strong style={{ color: isItemChecked ? tier.accentColor : 'var(--secondary)', fontSize: '1.1rem', fontWeight: 700 }}>
                                            {price.toLocaleString()} VND
                                          </Text>
                                        </div>
                                      </div>
                                    </Col>
                                  );
                                })}
                              </Row>
                            </Radio.Group>
                            
                            {pServices.boardingId && (
                              <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                                 <Button 
                                   type="link" 
                                   danger 
                                   onClick={() => {
                                      setPetServices(prev => ({ ...prev, [petId]: { ...prev[petId], boardingId: undefined, dietId: undefined } }));
                                   }}
                                   style={{ padding: 0, fontWeight: 600, color: 'var(--danger)' }}
                                 >
                                    Clear room selection
                                 </Button>
                              </div>
                            )}

                            {pServices.boardingId && petDietOptions.length > 0 && (
                              <div style={{ marginTop: '20px', padding: '16px 20px', background: 'var(--slate-50)', borderRadius: '12px', border: '1px solid var(--slate-200)' }}>
                                <Text strong style={{ display: 'block', marginBottom: '12px', color: 'var(--slate-800)', fontSize: '14px' }}>
                                  Additional Nutrition &amp; Diet Plan (Optional):
                                </Text>
                                <Radio.Group 
                                  style={{ width: '100%' }}
                                  value={pServices.dietId}
                                  onChange={(e) => setPetServices(prev => ({ ...prev, [petId]: { ...prev[petId], dietId: e.target.value } }))}
                                >
                                  <Row gutter={[16, 12]}>
                                    {petDietOptions.map(srv => {
                                      const price = getPriceForPet(srv, pet.weight);
                                      return (
                                        <Col span={24} key={srv.id}>
                                          <Radio value={srv.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                              {srv.imageUrl && (
                                                <img
                                                  src={srv.imageUrl}
                                                  alt={srv.name}
                                                  style={{ width: 28, height: 28, borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--slate-200)' }}
                                                />
                                              )}
                                              <span style={{ color: 'var(--slate-800)', fontWeight: 500 }}>
                                                {srv.name} — <Text strong style={{ color: 'var(--secondary)' }}>{price.toLocaleString()} VND / day</Text>
                                              </span>
                                            </span>
                                          </Radio>
                                        </Col>
                                      );
                                    })}
                                  </Row>
                                </Radio.Group>
                                <div style={{ marginTop: '10px' }}>
                                  <Button 
                                    type="link" 
                                    size="small" 
                                    onClick={() => setPetServices(prev => ({ ...prev, [petId]: { ...prev[petId], dietId: undefined } }))}
                                    style={{ padding: 0, fontSize: '13px', color: 'var(--slate-600)' }}
                                  >
                                    Remove diet plan
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              };
            })}
          />
        </div>
      )
    },
    {
      title: 'Schedule',
      content: (
        <div className="step-container fade-in">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Title level={3} style={{ fontFamily: 'var(--font-heading)', color: 'var(--slate-900)', margin: '0 0 6px 0' }}>
              Select Schedule &amp; Timing
            </Title>
            <Text type="secondary" style={{ fontSize: '15px', color: 'var(--slate-600)' }}>
              Please select the date and time for your companion's {bookingType === 'Grooming' ? 'spa appointment' : 'hotel stay'}
            </Text>
          </div>

          <div style={{ maxWidth: '520px', margin: '0 auto', background: 'var(--paper-card)', padding: '28px', borderRadius: '16px', border: '1px solid var(--slate-200)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--primary-light)',
                color: 'var(--secondary)',
                fontSize: 28,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid var(--primary-border)',
                boxShadow: 'var(--shadow-xs)'
              }}>
                <CalendarOutlined />
              </div>
            </div>
            
            {bookingType === 'Grooming' && (
              <div style={{ marginBottom: '16px' }}>
                <Title level={5} style={{ margin: '0 0 8px 0', color: 'var(--slate-900)', fontFamily: 'var(--font-heading)' }}>
                  Grooming Drop-off Date &amp; Time:
                </Title>
                <Form.Item name="groomingDate" rules={[{ required: true, message: 'Please select an appointment date and time' }]} style={{ marginBottom: '16px' }}>
                  <DatePicker 
                    style={{ width: '100%', padding: '10px 14px', fontSize: '15px', borderRadius: '10px', borderColor: 'var(--slate-300)' }} 
                    showTime={{ 
                      format: 'HH:mm', 
                      minuteStep: 15, 
                      hideDisabledOptions: true,
                      defaultValue: dayjs('08:00', 'HH:mm')
                    }} 
                    format="MMM DD, YYYY - HH:mm" 
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                    disabledTime={disabledGroomingTime}
                    size="large"
                    placeholder="Select arrival date & time (08:00 - 20:00)"
                  />
                </Form.Item>
              </div>
            )}

            {bookingType === 'Boarding' && (
              <div style={{ marginBottom: '16px' }}>
                <Title level={5} style={{ margin: '0 0 8px 0', color: 'var(--slate-900)', fontFamily: 'var(--font-heading)' }}>
                  Boarding Check-in &amp; Check-out Dates:
                </Title>
                <Form.Item name="boardingDateRange" rules={[{ required: true, message: 'Please select check-in and check-out dates' }]} style={{ marginBottom: '10px' }}>
                  <RangePicker 
                    disabledDate={disabledDate} 
                    style={{ width: '100%', padding: '10px 14px', fontSize: '15px', borderRadius: '10px', borderColor: 'var(--slate-300)' }} 
                    format="MMM DD, YYYY"
                    size="large"
                    placeholder={['Check-in date', 'Check-out date']}
                  />
                </Form.Item>

                <div style={{
                  marginBottom: '16px',
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                  color: '#475569'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    <CalendarOutlined style={{ color: '#0284c7' }} />
                    <span>Hotel Boarding Schedule Policy</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                    <span><LoginOutlined style={{ marginRight: 4, color: '#785839' }} />Check-in: <strong>From 14:00</strong></span>
                    <span><LogoutOutlined style={{ marginRight: 4, color: '#2563eb' }} />Check-out: <strong>Before 12:00</strong></span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px', fontStyle: 'italic' }}>
                    *Room is automatically allocated by pet weight &amp; tier. 12:00 - 14:00 window is reserved for daily sanitization.
                  </div>
                </div>

                {checkingAvailability && (
                  <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Spin size="small" />
                    <Text type="secondary" style={{ fontSize: '14px' }}>Checking room availability in real-time...</Text>
                  </div>
                )}

                {!checkingAvailability && rangeAvailability && (
                  <div style={{ marginBottom: '16px' }}>
                    {rangeAvailability.isAvailable ? (
                      <Alert
                        type="success"
                        showIcon
                        icon={<CheckCircleOutlined />}
                        style={{ borderRadius: '8px', border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4' }}
                        message={<Text strong style={{ color: '#166534', fontSize: '14px' }}>Rooms Available</Text>}
                        description={
                          <div style={{ color: '#15803d', fontSize: '13px', marginTop: '2px' }}>
                            {rangeAvailability.message}
                          </div>
                        }
                      />
                    ) : (
                      <Alert
                        type="error"
                        showIcon
                        icon={<CloseCircleOutlined />}
                        style={{ borderRadius: '8px', border: '1px solid #fecaca', backgroundColor: '#fef2f2' }}
                        message={<Text strong style={{ color: '#991b1b', fontSize: '14px' }}>Rooms Fully Booked</Text>}
                        description={
                          <div style={{ color: '#b91c1c', fontSize: '13px', marginTop: '2px' }}>
                            {rangeAvailability.message}
                          </div>
                        }
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', display: 'flex', gap: '8px', color: '#64748b', fontSize: '13px' }}>
              <InfoCircleOutlined style={{ marginTop: '3px' }} />
              <span>Please arrive 10 minutes before your appointment.</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Confirm',
      content: (
        <div className="step-container fade-in">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Title level={3} style={{ fontFamily: 'var(--font-heading)', color: 'var(--slate-900)', margin: '0 0 6px 0' }}>
              Confirm &amp; Summary
            </Title>
            <Text type="secondary" style={{ fontSize: '15px', color: 'var(--slate-600)' }}>
              Double-check your sanctuary booking details and select payment method
            </Text>
          </div>

          <Row gutter={20}>
            <Col xs={24} md={15}>
              <div style={{ background: 'var(--paper-card)', borderRadius: '16px', padding: '24px', border: '1px solid var(--slate-200)', boxShadow: 'var(--shadow-xs)', marginBottom: '16px' }}>
                <Title level={4} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontFamily: 'var(--font-heading)', color: 'var(--slate-900)' }}>
                  <ShopOutlined style={{ color: 'var(--secondary)' }} /> Booking Summary
                </Title>
                
                {selectedPetIds.map(petId => {
                  const pet = pets.find(p => p.id === petId);
                  const srvs = petServices[petId];
                  if (!pet || !srvs) return null;
                  const isCat = pet.species === 1 || String(pet.species).toLowerCase() === 'cat';
                  
                  let boardingDays = 1;
                  if (boardingDateRange && boardingDateRange.length === 2) {
                     boardingDays = Math.max(1, boardingDateRange[1].diff(boardingDateRange[0], 'day'));
                  }

                  return (
                    <div key={petId} style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px dashed #eeddc8' }}>
                      {/* Prominent Pet Dossier Header */}
                      <div 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '16px', 
                          marginBottom: '16px', 
                          background: isCat ? 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)' : 'linear-gradient(135deg, #fdf9f3 0%, #ffffff 100%)', 
                          padding: '14px 18px', 
                          borderRadius: '16px', 
                          border: `1.5px solid ${isCat ? '#e9d5ff' : '#eeddc8'}`,
                          boxShadow: '0 2px 8px rgba(61,45,35,0.04)'
                        }}
                      >
                        {pet.imageUrl ? (
                          <img
                            src={pet.imageUrl}
                            alt={pet.name}
                            style={{ 
                              width: 68, 
                              height: 68, 
                              borderRadius: '50%', 
                              objectFit: 'cover', 
                              border: `3px solid ${isCat ? '#e9d5ff' : '#eeddc8'}`, 
                              flexShrink: 0, 
                              boxShadow: '0 3px 10px rgba(61,45,35,0.12)' 
                            }}
                          />
                        ) : (
                          <div 
                            style={{ 
                              width: 68, 
                              height: 68, 
                              borderRadius: '50%', 
                              background: isCat ? '#f3e8ff' : '#faf2e9', 
                              color: isCat ? '#7e22ce' : '#785839', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              flexShrink: 0, 
                              border: `3px solid ${isCat ? '#e9d5ff' : '#eeddc8'}`,
                              boxShadow: '0 3px 10px rgba(61,45,35,0.12)' 
                            }}
                          >
                            {isCat ? <CatIcon size={36} /> : <DogIcon size={36} />}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3d2d23', lineHeight: 1.2 }}>
                            {pet.name}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <Tag style={{ 
                              borderRadius: '6px', 
                              margin: 0, 
                              background: isCat ? '#faf5ff' : '#faf2e9', 
                              borderColor: isCat ? '#e9d5ff' : '#eeddc8', 
                              color: isCat ? '#7e22ce' : '#785839', 
                              fontWeight: 700,
                              fontSize: '12px',
                              padding: '2px 9px' 
                            }}>
                              {isCat ? 'Feline Guest' : 'Canine Guest'} • {pet.weight} kg
                            </Tag>
                            {pet.breed && (
                              <span style={{ fontSize: '13px', color: '#8c7662' }}>
                                Breed: <strong style={{ color: '#3d2d23' }}>{pet.breed}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Booked Services Cards with 72x72 images & fixed right price */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {bookingType === 'Grooming' && srvs.groomingIds?.map((gId: string) => {
                          const s = services.find(x => x.id === gId);
                          if (!s) return null;
                          const price = getPriceForPet(s, pet.weight);
                          return (
                            <div 
                              key={gId} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between', 
                                gap: '16px', 
                                padding: '14px 18px', 
                                background: '#ffffff', 
                                borderRadius: '14px', 
                                border: '1px solid #eeddc8',
                                boxShadow: '0 2px 6px rgba(61,45,35,0.04)' 
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 auto', minWidth: 0 }}>
                                {s.imageUrl ? (
                                  <img
                                    src={s.imageUrl}
                                    alt={s.name}
                                    style={{ 
                                      width: 60, 
                                      height: 60, 
                                      borderRadius: 12, 
                                      objectFit: 'cover', 
                                      border: '1.5px solid #eeddc8', 
                                      flexShrink: 0,
                                      boxShadow: '0 2px 6px rgba(61,45,35,0.06)' 
                                    }}
                                  />
                                ) : (
                                  <div style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: '#faf2e9', color: '#785839', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1.5px solid #eeddc8' }}>
                                    <ScissorOutlined style={{ fontSize: '28px' }} />
                                  </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ color: '#3d2d23', fontWeight: 700, fontSize: '1.02rem', lineHeight: 1.35, marginBottom: 4 }}>
                                    {s.name}
                                  </div>
                                  <div style={{ color: '#8c7662', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                                    <CalendarOutlined style={{ color: '#c69f7b', fontSize: '14px', flexShrink: 0 }} />
                                    <span>Schedule: <strong style={{ color: '#3d2d23' }}>{groomingDate?.format('DD/MM/YYYY - HH:mm')}</strong></span>
                                  </div>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap', marginLeft: 'auto', paddingLeft: '8px' }}>
                                <span style={{ color: '#785839', fontSize: '1.12rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                  {price.toLocaleString()} VND
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        
                        {bookingType === 'Boarding' && srvs.boardingId && (
                          <div 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between', 
                              gap: '16px', 
                              padding: '14px 18px', 
                              background: '#ffffff', 
                              borderRadius: '14px', 
                              border: '1px solid #eeddc8',
                              boxShadow: '0 2px 6px rgba(61,45,35,0.04)' 
                            }}
                          >
                            {(() => {
                               const s = services.find(x => x.id === srvs.boardingId);
                               const price = s ? getPriceForPet(s, pet.weight) * boardingDays : 0;
                               return (
                                 <>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 auto', minWidth: 0 }}>
                                     {s?.imageUrl ? (
                                       <img
                                         src={s.imageUrl}
                                         alt={s.name}
                                         style={{ 
                                           width: 60, 
                                           height: 60, 
                                           borderRadius: 12, 
                                           objectFit: 'cover', 
                                           border: '1.5px solid #eeddc8', 
                                           flexShrink: 0,
                                           boxShadow: '0 2px 6px rgba(61,45,35,0.06)' 
                                         }}
                                       />
                                     ) : (
                                       <div style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: '#faf2e9', color: '#785839', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1.5px solid #eeddc8' }}>
                                         <HomeOutlined style={{ fontSize: '28px' }} />
                                       </div>
                                     )}
                                     <div style={{ flex: 1, minWidth: 0 }}>
                                       <div style={{ color: '#3d2d23', fontWeight: 700, fontSize: '1.02rem', lineHeight: 1.35, marginBottom: 4 }}>
                                         {s?.name}
                                       </div>
                                       <div style={{ color: '#8c7662', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                                         <CalendarOutlined style={{ color: '#c69f7b', fontSize: '14px', flexShrink: 0 }} />
                                         <span>{boardingDateRange?.[0]?.format('DD/MM/YYYY')} - {boardingDateRange?.[1]?.format('DD/MM/YYYY')} (<strong>{boardingDays} day{boardingDays > 1 ? 's' : ''}</strong>)</span>
                                       </div>
                                     </div>
                                   </div>
                                   <div style={{ textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap', marginLeft: 'auto', paddingLeft: '8px' }}>
                                     <span style={{ color: '#785839', fontSize: '1.12rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                       {price.toLocaleString()} VND
                                     </span>
                                   </div>
                                 </>
                               )
                            })()}
                          </div>
                        )}

                        {bookingType === 'Boarding' && srvs.dietId && (
                          <div 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between', 
                              gap: '16px', 
                              padding: '14px 18px', 
                              background: '#ffffff', 
                              borderRadius: '14px', 
                              border: '1px solid #eeddc8',
                              boxShadow: '0 2px 6px rgba(61,45,35,0.04)' 
                            }}
                          >
                            {(() => {
                               const s = services.find(x => x.id === srvs.dietId);
                               const price = s ? getPriceForPet(s, pet.weight) * boardingDays : 0;
                               return (
                                 <>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 auto', minWidth: 0 }}>
                                     {s?.imageUrl ? (
                                       <img
                                         src={s.imageUrl}
                                         alt={s.name}
                                         style={{ 
                                           width: 60, 
                                           height: 60, 
                                           borderRadius: 12, 
                                           objectFit: 'cover', 
                                           border: '1.5px solid #eeddc8', 
                                           flexShrink: 0,
                                           boxShadow: '0 2px 6px rgba(61,45,35,0.06)' 
                                         }}
                                       />
                                     ) : (
                                       <div style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: '#faf2e9', color: '#785839', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1.5px solid #eeddc8' }}>
                                         <ShopOutlined style={{ fontSize: '28px' }} />
                                       </div>
                                     )}
                                     <div style={{ flex: 1, minWidth: 0 }}>
                                       <div style={{ color: '#3d2d23', fontWeight: 700, fontSize: '1.02rem', lineHeight: 1.35, marginBottom: 4 }}>
                                         {s?.name}
                                       </div>
                                       <div style={{ color: '#8c7662', fontSize: '0.84rem' }}>
                                         Nutrition Diet Plan • <strong>{boardingDays} day{boardingDays > 1 ? 's' : ''}</strong>
                                       </div>
                                     </div>
                                   </div>
                                   <div style={{ textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap', marginLeft: 'auto', paddingLeft: '8px' }}>
                                     <span style={{ color: '#785839', fontSize: '1.12rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                       {price.toLocaleString()} VND
                                     </span>
                                   </div>
                                 </>
                               )
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

              </div>
            </Col>

            <Col xs={24} md={9}>
              <div style={{ background: 'var(--slate-50)', borderRadius: '16px', padding: '24px', border: '1px solid var(--slate-200)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Title level={4} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontFamily: 'var(--font-heading)', color: 'var(--slate-900)' }}>
                  <GiftOutlined style={{ color: 'var(--secondary)' }} /> Privileges &amp; Payment
                </Title>
                
                <Form.Item name="voucherCode" label={<Text strong style={{ color: 'var(--slate-800)' }}>Promo / Privilege Voucher</Text>} style={{ marginBottom: '20px' }}>
                  <Input 
                    prefix={<GiftOutlined style={{ color: 'var(--secondary)' }} />} 
                    placeholder="Enter privilege code" 
                    size="large" 
                    style={{ borderRadius: '10px', borderColor: 'var(--slate-300)' }}
                  />
                </Form.Item>

                <div style={{ marginBottom: '24px' }}>
                  <Text strong style={{ display: 'block', marginBottom: '10px', color: 'var(--slate-900)', fontSize: '15px' }}>
                    Payment Method
                  </Text>
                  <Form.Item name="paymentChoice" style={{ marginBottom: 0 }}>
                    <Radio.Group style={{ width: '100%' }}>
                      <Space direction="vertical" style={{ width: '100%' }} size={12}>
                        {bookingType !== 'Boarding' && (
                          <Radio 
                            value="PAY_AT_COUNTER" 
                            style={{ 
                              padding: '12px 14px', 
                              border: '1.5px solid var(--slate-200)', 
                              borderRadius: '12px', 
                              width: '100%', 
                              background: '#fff',
                              margin: 0,
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <div style={{ marginLeft: 6 }}>
                              <Text strong style={{ color: 'var(--slate-900)' }}>Pay at Counter</Text>
                              <div style={{ fontSize: '12.5px', color: 'var(--slate-600)' }}>Pay at the concierge desk when picking up your pet</div>
                            </div>
                          </Radio>
                        )}
                        <Radio 
                          value="VNPAY" 
                          style={{ 
                            padding: '12px 14px', 
                            border: '1.5px solid var(--slate-200)', 
                            borderRadius: '12px', 
                            width: '100%', 
                            background: '#fff',
                            margin: 0,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{ marginLeft: 6 }}>
                            <Text strong style={{ color: 'var(--slate-900)' }}>Online Payment via VNPay</Text>
                            <div style={{ fontSize: '12.5px', color: 'var(--slate-600)' }}>ATM card, mobile banking, or VNPay QR code</div>
                          </div>
                        </Radio>
                      </Space>
                    </Radio.Group>
                  </Form.Item>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '18px', borderTop: '1px solid var(--slate-300)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: '16px', color: 'var(--slate-800)' }}>Total Amount</Text>
                    <Title level={2} style={{ margin: 0, color: 'var(--secondary)', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                      {totalAmount > 0 ? `${totalAmount.toLocaleString()} VND` : '0 VND'}
                    </Title>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      )
    }
  ];

  return (
    <div className="booking-page-wrap">
      {/* Top Bar Switch & Brand */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <button
          type="button"
          onClick={() => {
            setBookingType(null);
            setCurrentStep(0);
            setPetServices({});
            form.resetFields();
          }}
          className="link"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.92rem', color: 'var(--secondary)', fontWeight: 600 }}
        >
          <LeftOutlined style={{ fontSize: '11px' }} /> Switch between Spa / Hotel
        </button>
        <div className="customer-role-badge">
          {bookingType === 'Grooming' ? 'Botanical Grooming & Spa' : 'Sanctuary Hotel Suites'}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 className="booking-page-title">
          Book Your {bookingType === 'Grooming' ? 'Spa Appointment' : 'Hotel Suite'}
        </h1>
        <p className="booking-page-subtitle">
          Complete the steps below to reserve tailored sanctuary care for your companion.
        </p>
      </div>
      
      <Steps 
        current={currentStep} 
        className="booking-steps"
        items={steps.map(s => ({ title: s.title }))} 
        style={{ marginBottom: '28px' }} 
        size="small"
      />

      <div className="booking-container-card">
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ paymentChoice: bookingType === 'Boarding' ? 'VNPAY' : 'PAY_AT_COUNTER' }}>
          
          <div style={{ minHeight: 'auto', marginBottom: '16px' }}>
            {steps.map((step, index) => (
              <div key={index} style={{ display: currentStep === index ? 'block' : 'none' }}>
                {step.content}
              </div>
            ))}
          </div>

          <Divider style={{ margin: '32px 0 24px', borderColor: 'var(--slate-200)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <button 
              type="button"
              onClick={prev} 
              className="btn-secondary" 
              style={{ borderRadius: 999, padding: '0.65rem 1.8rem' }}
            >
              <LeftOutlined style={{ fontSize: '12px' }}/> Back
            </button>
            
            {currentStep < steps.length - 1 && (
              <Button 
                type="primary" 
                onClick={next} 
                size="large" 
                disabled={currentStep === 2 && bookingType === 'Boarding' && (checkingAvailability || (rangeAvailability !== null && !rangeAvailability.isAvailable))}
                loading={currentStep === 2 && bookingType === 'Boarding' && checkingAvailability}
                style={{ 
                  background: (currentStep === 2 && bookingType === 'Boarding' && (checkingAvailability || (rangeAvailability !== null && !rangeAvailability.isAvailable))) 
                    ? undefined 
                    : 'linear-gradient(135deg, #785839 0%, #3d2d23 100%)', 
                  borderColor: '#3d2d23',
                  color: '#ffffff',
                  borderRadius: 999, 
                  padding: '0 34px',
                  height: 44,
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 14px rgba(61, 45, 35, 0.22)',
                }}
              >
                Continue <RightOutlined style={{ fontSize: '12px' }}/>
              </Button>
            )}
            
            {currentStep === steps.length - 1 && (
              <button 
                type="submit" 
                disabled={submitting || hasMissingPetServices} 
                className="btn" 
                style={{ 
                  borderRadius: 999, 
                  background: 'linear-gradient(135deg, #785839 0%, #3d2d23 100%)', 
                  padding: '0.75rem 2.5rem', 
                  fontSize: '1rem',
                  boxShadow: '0 4px 16px rgba(38, 24, 15, 0.25)',
                }}
              >
                {submitting ? 'Confirming Booking...' : 'Confirm Booking'}
              </button>
            )}
          </div>
        </Form>
      </div>

      <style>{`
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Ensure Checkbox spans 100% and label inner flexes full card width */
        .treatment-checkbox.ant-checkbox-wrapper {
          width: 100% !important;
          display: flex !important;
          align-items: center !important;
          box-sizing: border-box !important;
        }
        .treatment-checkbox.ant-checkbox-wrapper > span:last-child {
          flex: 1 1 0% !important;
          width: 100% !important;
          min-width: 0 !important;
          display: flex !important;
          box-sizing: border-box !important;
        }
      `}</style>
    </div>
  );
};

export default CreateBookingPage;
