import React, { useState, useEffect } from 'react';
import { Steps, Form, Select, DatePicker, Input, Button, Card, Typography, Spin, message, Row, Col, Divider, Radio, Checkbox, List, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import { petService } from '@/services/pet.service';
import { serviceService } from '@/services/service.service';
import { bookingService, CreateBookingPayload } from '@/services/booking.service';
import { roomService } from '@/services/room.service';
import type { ServiceDTO } from '@/types/service.types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const CreateBookingPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  
  // Data States
  const [pets, setPets] = useState<any[]>([]);
  const [services, setServices] = useState<ServiceDTO[]>([]);
  const [serviceDetailsMap, setServiceDetailsMap] = useState<Record<string, any>>({});
  const [roomUnavailableMap, setRoomUnavailableMap] = useState<Record<string, string[]>>({});
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Form Watchers
  const selectedPetId = Form.useWatch('petId', form);
  const selectedServiceIds = Form.useWatch('serviceIds', form) || [];
  const selectedDateRange = Form.useWatch('dateRange', form);
  const selectedDate = Form.useWatch('date', form);
  const voucherCode = Form.useWatch('voucherCode', form);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [petsRes, servicesData] = await Promise.all([
        petService.getMyPets(),
        serviceService.fetchActive()
      ]);
      
      const petsList = (petsRes as any).result || (petsRes as any).data || petsRes;
      setPets(Array.isArray(petsList) ? petsList : (petsList.items || []));
      setServices(servicesData);
    } catch (error) {
      message.error('Failed to load pets or services');
    } finally {
      setLoading(false);
    }
  };

  // When services are selected, fetch their details to get prices and check if boarding
  useEffect(() => {
    if (selectedServiceIds.length > 0) {
      selectedServiceIds.forEach((id: string) => {
        if (!serviceDetailsMap[id]) {
          fetchServiceDetailAndAvailability(id);
        }
      });
    }
  }, [selectedServiceIds]);

  const fetchServiceDetailAndAvailability = async (serviceId: string) => {
    try {
      const res = await serviceService.fetchById(serviceId);
      const detail = (res as any).result || (res as any).data || res;
      setServiceDetailsMap(prev => ({ ...prev, [serviceId]: detail }));

      const isBoarding = detail.serviceType === 'Boarding' || detail.roomTypeId != null;
      if (isBoarding) {
        const roomRes = await roomService.checkAvailability({
          serviceId: serviceId,
          month: dayjs().month() + 1,
          year: dayjs().year()
        });
        if (roomRes.result?.unavailableDates) {
          setRoomUnavailableMap(prev => ({ ...prev, [serviceId]: roomRes.result.unavailableDates }));
        }
      }
    } catch (error) {
      console.error(`Failed to fetch extra data for service ${serviceId}`);
    }
  };

  // Determine if any selected service is Boarding
  const hasBoardingService = selectedServiceIds.some((id: string) => {
    const detail = serviceDetailsMap[id];
    return detail && (detail.serviceType === 'Boarding' || detail.roomTypeId != null);
  });

  // Merge all unavailable dates from all selected boarding services
  const mergedUnavailableDates = selectedServiceIds.reduce((acc: string[], id: string) => {
    const dates = roomUnavailableMap[id] || [];
    return [...acc, ...dates];
  }, []);

  const disabledDate = (current: Dayjs) => {
    if (current && current < dayjs().startOf('day')) return true;
    const dateStr = current.format('YYYY-MM-DD');
    return mergedUnavailableDates.includes(dateStr);
  };

  // Navigation handlers
  const next = () => {
    if (currentStep === 0 && !selectedPetId) {
      message.error('Please select a pet to continue.');
      return;
    }
    if (currentStep === 1 && selectedServiceIds.length === 0) {
      message.error('Please select at least one service to continue.');
      return;
    }
    if (currentStep === 2) {
      if (hasBoardingService && (!selectedDateRange || selectedDateRange.length < 2)) {
        message.error('Please select a valid boarding period.');
        return;
      }
      if (!hasBoardingService && !selectedDate) {
        message.error('Please select an appointment date and time.');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const prev = () => setCurrentStep(currentStep - 1);

  // Subtotal Calculation
  const calculateTotal = () => {
    let total = 0;
    const pet = pets.find(p => p.id === selectedPetId);
    if (!pet) return 0;
    const petWeight = pet.weight || 0;

    selectedServiceIds.forEach((id: string) => {
      const detail = serviceDetailsMap[id];
      if (detail && detail.prices) {
        const applicablePrice = detail.prices.find((p: any) => 
          (p.minWeight == null || p.minWeight <= petWeight) &&
          (p.maxWeight == null || p.maxWeight >= petWeight)
        );
        if (applicablePrice) {
          total += applicablePrice.price;
        }
      }
    });
    return total;
  };

  const totalAmount = calculateTotal();

  const onFinish = async (values: any) => {
    let startAt, endAt;

    if (hasBoardingService) {
      startAt = values.dateRange[0].toISOString();
      endAt = values.dateRange[1].toISOString();
    } else {
      startAt = values.date.toISOString();
      endAt = null;
    }

    // Create 1 BookingItem per selected service
    const bookingItems = values.serviceIds.map((srvId: string) => ({
      petId: values.petId,
      serviceId: srvId,
      scheduledStartAt: startAt,
      scheduledEndAt: endAt,
      quantity: 1
    }));

    const payload: CreateBookingPayload = {
      voucherCode: values.voucherCode,
      bookingItems: bookingItems
    };

    try {
      setSubmitting(true);
      await bookingService.create(payload);
      message.success('Booking created successfully!');
      navigate('/customer');
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
  }

  const steps = [
    {
      title: 'Choose Pet',
      content: (
        <div style={{ marginTop: '24px' }}>
          <Form.Item name="petId" rules={[{ required: true, message: 'Select your pet' }]}>
            <Radio.Group style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                {pets.map(pet => (
                  <Col xs={24} sm={12} key={pet.id}>
                    <Radio.Button value={pet.id} style={{ width: '100%', height: 'auto', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{pet.name}</div>
                        <div style={{ color: '#64748b' }}>{pet.species === 1 ? 'Cat' : 'Dog'} • {pet.weight} kg</div>
                      </div>
                    </Radio.Button>
                  </Col>
                ))}
              </Row>
            </Radio.Group>
          </Form.Item>
        </div>
      )
    },
    {
      title: 'Select Services',
      content: (
        <div style={{ marginTop: '24px' }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
            You can select multiple services (e.g. Grooming + Nail Trimming).
          </Text>
          <Form.Item name="serviceIds" rules={[{ required: true, message: 'Select at least one service' }]}>
            <Checkbox.Group style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                {services.map(srv => (
                  <Col xs={24} sm={12} key={srv.id}>
                    <Card size="small" hoverable style={{ height: '100%' }}>
                      <Checkbox value={srv.id} style={{ width: '100%' }}>
                        <Text strong>{srv.name}</Text>
                        {srv.description && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{srv.description}</div>}
                      </Checkbox>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>
        </div>
      )
    },
    {
      title: 'Date & Time',
      content: (
        <div style={{ marginTop: '24px' }}>
          {hasBoardingService ? (
            <Form.Item name="dateRange" label="Boarding Period (Start & End)" rules={[{ required: true }]}>
              <RangePicker 
                disabledDate={disabledDate} 
                style={{ width: '100%' }} 
                showTime={{ format: 'HH:mm' }} 
                format="YYYY-MM-DD HH:mm"
              />
            </Form.Item>
          ) : (
            <Form.Item name="date" label="Appointment Date & Time" rules={[{ required: true }]}>
              <DatePicker 
                style={{ width: '100%' }} 
                showTime={{ format: 'HH:mm' }} 
                format="YYYY-MM-DD HH:mm" 
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>
          )}
        </div>
      )
    },
    {
      title: 'Confirm',
      content: (
        <div style={{ marginTop: '24px' }}>
          <Card size="small" title="Booking Summary" style={{ marginBottom: '16px' }}>
            <Row>
              <Col span={8}><Text type="secondary">Pet:</Text></Col>
              <Col span={16}><Text strong>{pets.find(p => p.id === selectedPetId)?.name}</Text></Col>
            </Row>
            <Divider style={{ margin: '12px 0' }} />
            <Row>
              <Col span={8}><Text type="secondary">Services:</Text></Col>
              <Col span={16}>
                {selectedServiceIds.map((id: string) => {
                  const srv = services.find(s => s.id === id);
                  return <Tag key={id} color="blue" style={{ marginBottom: '4px' }}>{srv?.name}</Tag>;
                })}
              </Col>
            </Row>
            <Divider style={{ margin: '12px 0' }} />
            <Row>
              <Col span={8}><Text type="secondary">Time:</Text></Col>
              <Col span={16}>
                {hasBoardingService && selectedDateRange 
                  ? `${selectedDateRange[0]?.format('YYYY-MM-DD HH:mm')} to ${selectedDateRange[1]?.format('YYYY-MM-DD HH:mm')}`
                  : selectedDate?.format('YYYY-MM-DD HH:mm')}
              </Col>
            </Row>
          </Card>

          <Form.Item name="voucherCode" label="Voucher Code (Optional)">
            <Input placeholder="Enter discount code" />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
            <Text type="secondary">Estimated Subtotal:</Text>
            <Title level={2} style={{ margin: 0, color: '#059669' }}>
              {totalAmount > 0 ? `${totalAmount.toLocaleString()} VND` : '---'}
            </Title>
          </div>
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: '32px' }}>Book an Appointment</Title>
      
      <Steps current={currentStep} items={steps.map(s => ({ title: s.title }))} style={{ marginBottom: '32px' }} />

      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          
          <div style={{ minHeight: '300px' }}>
            {steps[currentStep].content}
          </div>

          <Divider />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {currentStep > 0 ? (
              <Button onClick={prev} size="large">Previous</Button>
            ) : <div />}
            
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={next} size="large" style={{ backgroundColor: '#059669' }}>
                Next Step
              </Button>
            )}
            
            {currentStep === steps.length - 1 && (
              <Button type="primary" htmlType="submit" size="large" loading={submitting} style={{ backgroundColor: '#059669' }}>
                Confirm & Book
              </Button>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default CreateBookingPage;
