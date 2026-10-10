import React, { useState, useEffect } from 'react';
import { Steps, Form, DatePicker, Input, Button, Card, Typography, Spin, message, Row, Col, Divider, Tag, Empty } from 'antd';
import { CalendarOutlined, CheckCircleFilled, GiftOutlined, ClockCircleOutlined, InfoCircleOutlined, ShopOutlined, RightOutlined } from '@ant-design/icons';
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
  
  const [pets, setPets] = useState<any[]>([]);
  const [services, setServices] = useState<ServiceDTO[]>([]);
  const [serviceDetailsMap, setServiceDetailsMap] = useState<Record<string, any>>({});
  const [roomUnavailableMap, setRoomUnavailableMap] = useState<Record<string, string[]>>({});
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

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
    } catch (error) {}
  };

  const hasBoardingService = selectedServiceIds.some((id: string) => {
    const detail = serviceDetailsMap[id];
    return detail && (detail.serviceType === 'Boarding' || detail.roomTypeId != null);
  });

  const mergedUnavailableDates = selectedServiceIds.reduce((acc: string[], id: string) => {
    const dates = roomUnavailableMap[id] || [];
    return [...acc, ...dates];
  }, []);

  const disabledDate = (current: Dayjs) => {
    if (current && current < dayjs().startOf('day')) return true;
    return mergedUnavailableDates.includes(current.format('YYYY-MM-DD'));
  };

  const next = () => {
    if (currentStep === 0 && !selectedPetId) return message.warning('Please select a pet to continue.');
    if (currentStep === 1 && selectedServiceIds.length === 0) return message.warning('Please select at least one service.');
    if (currentStep === 2) {
      if (hasBoardingService && (!selectedDateRange || selectedDateRange.length < 2)) return message.warning('Please select a valid boarding period.');
      if (!hasBoardingService && !selectedDate) return message.warning('Please select an appointment date and time.');
    }
    setCurrentStep(currentStep + 1);
  };
  const prev = () => setCurrentStep(currentStep - 1);

  const calculateTotal = () => {
    let total = 0;
    const pet = pets.find(p => p.id === selectedPetId);
    if (!pet) return 0;
    selectedServiceIds.forEach((id: string) => {
      const detail = serviceDetailsMap[id];
      if (detail && detail.prices) {
        const priceObj = detail.prices.find((p: any) => (p.minWeight == null || p.minWeight <= pet.weight) && (p.maxWeight == null || p.maxWeight >= pet.weight));
        if (priceObj) total += priceObj.price;
      }
    });
    return total;
  };
  const totalAmount = calculateTotal();

  const onFinish = async (values: any) => {
    let startAt = hasBoardingService ? values.dateRange[0].toISOString() : values.date.toISOString();
    let endAt = hasBoardingService ? values.dateRange[1].toISOString() : null;

    const bookingItems = values.serviceIds.map((srvId: string) => ({
      petId: values.petId,
      serviceId: srvId,
      scheduledStartAt: startAt,
      scheduledEndAt: endAt,
      quantity: 1
    }));

    try {
      setSubmitting(true);
      await bookingService.create({ voucherCode: values.voucherCode, bookingItems });
      message.success('Booking created successfully! 🎉');
      navigate('/customer');
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleService = (id: string) => {
    const current = form.getFieldValue('serviceIds') || [];
    if (current.includes(id)) {
      form.setFieldsValue({ serviceIds: current.filter((x: string) => x !== id) });
    } else {
      form.setFieldsValue({ serviceIds: [...current, id] });
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>;

  const steps = [
    {
      title: 'Choose Pet',
      content: (
        <div className="step-container fade-in">
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <Title level={3} style={{ color: '#1e293b' }}>Who is coming today?</Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>Select the furry friend for this appointment</Text>
          </div>
          
          <Form.Item name="petId" rules={[{ required: true }]}>
             <Row gutter={[20, 20]} justify="center">
                {pets.length === 0 && <Empty description="No pets found. Please add a pet first." />}
                {pets.map(pet => {
                  const isSelected = selectedPetId === pet.id;
                  const isCat = pet.species === 1 || String(pet.species).toLowerCase() === 'cat';
                  return (
                    <Col xs={24} sm={12} md={8} key={pet.id}>
                      <div 
                        onClick={() => form.setFieldsValue({ petId: pet.id })}
                        style={{
                          background: isSelected ? '#ecfdf5' : '#fff',
                          border: `2px solid ${isSelected ? '#10b981' : '#e2e8f0'}`,
                          borderRadius: '16px',
                          padding: '20px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'center',
                          position: 'relative',
                          boxShadow: isSelected ? '0 10px 15px -3px rgba(16, 185, 129, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        {isSelected && <CheckCircleFilled style={{ position: 'absolute', top: 12, right: 12, fontSize: '20px', color: '#10b981' }} />}
                        <div style={{ fontSize: '50px', marginBottom: '10px' }}>{isCat ? '🐱' : '🐶'}</div>
                        <Title level={4} style={{ margin: 0, color: isSelected ? '#065f46' : '#1e293b' }}>{pet.name}</Title>
                        <Tag color={isCat ? 'purple' : 'blue'} style={{ marginTop: '8px', borderRadius: '12px' }}>
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
      title: 'Select Services',
      content: (
        <div className="step-container fade-in">
           <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <Title level={3} style={{ color: '#1e293b' }}>What does {pets.find(p => p.id === selectedPetId)?.name} need?</Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>You can select multiple services for this visit</Text>
          </div>

          <Form.Item name="serviceIds">
            <Row gutter={[16, 16]}>
              {services.map(srv => {
                const isSelected = selectedServiceIds.includes(srv.id);
                return (
                  <Col xs={24} sm={12} key={srv.id}>
                    <div 
                      onClick={() => handleToggleService(srv.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        padding: '16px',
                        background: isSelected ? '#f0fdf4' : '#fff',
                        border: `1px solid ${isSelected ? '#34d399' : '#e2e8f0'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 4px 12px rgba(52, 211, 153, 0.2)' : 'none'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '20px' }}>{srv.name.toLowerCase().includes('bath') ? '🛁' : srv.name.toLowerCase().includes('hotel') || srv.name.toLowerCase().includes('board') ? '🏨' : '✂️'}</span>
                          <Text strong style={{ fontSize: '16px', color: isSelected ? '#065f46' : '#0f172a' }}>{srv.name}</Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: '13px', display: 'block', paddingLeft: '28px' }}>
                          {srv.description || 'Professional pet care service'}
                        </Text>
                      </div>
                      <div style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', height: '100%' }}>
                        <div style={{ 
                          width: '24px', height: '24px', borderRadius: '50%', 
                          border: `2px solid ${isSelected ? '#10b981' : '#cbd5e1'}`,
                          background: isSelected ? '#10b981' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                        }}>
                          {isSelected && <CheckCircleFilled />}
                        </div>
                      </div>
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
      title: 'Schedule',
      content: (
        <div className="step-container fade-in">
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <Title level={3} style={{ color: '#1e293b' }}>When would you like to come?</Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              {hasBoardingService ? 'Please select a check-in and check-out date.' : 'Please select your preferred appointment time.'}
            </Text>
          </div>

          <div style={{ maxWidth: '500px', margin: '0 auto', background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px', fontSize: '48px', color: '#10b981' }}>
              <CalendarOutlined />
            </div>
            
            {hasBoardingService ? (
              <Form.Item name="dateRange" rules={[{ required: true, message: 'Please select dates' }]}>
                <RangePicker 
                  disabledDate={disabledDate} 
                  style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px' }} 
                  showTime={{ format: 'HH:mm' }} 
                  format="MMM DD, YYYY HH:mm"
                  size="large"
                />
              </Form.Item>
            ) : (
              <Form.Item name="date" rules={[{ required: true, message: 'Please select a date and time' }]}>
                <DatePicker 
                  style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px' }} 
                  showTime={{ format: 'HH:mm', minuteStep: 15 }} 
                  format="MMM DD, YYYY - hh:mm A" 
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                  size="large"
                />
              </Form.Item>
            )}

            <div style={{ marginTop: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px', display: 'flex', gap: '8px', color: '#64748b', fontSize: '13px' }}>
              <InfoCircleOutlined style={{ marginTop: '3px' }} />
              <span>Please arrive 10 minutes before your scheduled time. You can cancel up to 24 hours in advance.</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Confirm',
      content: (
        <div className="step-container fade-in">
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <Title level={3} style={{ color: '#1e293b' }}>Review & Confirm</Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>Double check your booking details</Text>
          </div>

          <Row gutter={24}>
            <Col xs={24} md={14}>
              <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '24px' }}>
                <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#0f172a' }}>
                  <ShopOutlined /> Booking Summary
                </Title>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px dashed #cbd5e1' }}>
                  <Text type="secondary">Pet Patient</Text>
                  <Text strong style={{ fontSize: '16px' }}>{pets.find(p => p.id === selectedPetId)?.name}</Text>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px dashed #cbd5e1' }}>
                  <Text type="secondary">Schedule</Text>
                  <div style={{ textAlign: 'right' }}>
                    <Text strong style={{ display: 'block' }}>
                       {hasBoardingService && selectedDateRange 
                        ? `${selectedDateRange[0]?.format('MMM DD, YYYY')}`
                        : selectedDate?.format('MMM DD, YYYY')}
                    </Text>
                    <Text type="secondary">
                       {hasBoardingService && selectedDateRange 
                        ? `${selectedDateRange[0]?.format('HH:mm')} → ${selectedDateRange[1]?.format('MMM DD HH:mm')}`
                        : selectedDate?.format('hh:mm A')}
                    </Text>
                  </div>
                </div>

                <div>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '12px' }}>Selected Services</Text>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedServiceIds.map((id: string) => {
                      const srv = services.find(s => s.id === id);
                      return (
                        <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                          <CheckCircleFilled style={{ color: '#10b981' }} />
                          <Text strong>{srv?.name}</Text>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={24} md={10}>
              <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <GiftOutlined /> Voucher & Payment
                </Title>
                
                <Form.Item name="voucherCode" style={{ marginBottom: 'auto' }}>
                  <Input 
                    prefix={<GiftOutlined style={{ color: '#94a3b8' }} />} 
                    placeholder="Enter discount code" 
                    size="large" 
                    style={{ borderRadius: '8px' }}
                  />
                </Form.Item>

                <div style={{ marginTop: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text type="secondary">Subtotal</Text>
                    <Text strong>{totalAmount > 0 ? `${totalAmount.toLocaleString()} đ` : 'Calculating...'}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <Text type="secondary">Tax</Text>
                    <Text strong>Included</Text>
                  </div>
                  <Divider style={{ margin: '16px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: '16px' }}>Total to pay</Text>
                    <Title level={3} style={{ margin: 0, color: '#059669' }}>
                      {totalAmount > 0 ? `${totalAmount.toLocaleString()} đ` : '---'}
                    </Title>
                  </div>
                  <Text type="secondary" style={{ display: 'block', textAlign: 'right', fontSize: '12px', marginTop: '4px' }}>
                    * Voucher applied at checkout
                  </Text>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      )
    }
  ];

  return (
    <div className="paw-bg-container" style={{ padding: '32px', maxWidth: '100%', minHeight: '80vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Title level={2} style={{ margin: 0, color: '#0f172a' }}>Book Appointment</Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>Follow simple steps to get your pet the best care</Text>
        </div>
      
      <Steps 
        current={currentStep} 
        items={steps.map(s => ({ title: s.title }))} 
        style={{ marginBottom: '40px' }} 
        size="small"
      />

      <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          
          <div style={{ minHeight: '350px' }}>
            {steps.map((step, index) => (
              <div key={index} style={{ display: currentStep === index ? 'block' : 'none' }}>
                {step.content}
              </div>
            ))}
          </div>

          <Divider style={{ margin: '32px 0 24px' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {currentStep > 0 ? (
              <Button onClick={prev} size="large" style={{ borderRadius: '8px', padding: '0 24px' }}>
                Go Back
              </Button>
            ) : <div />}
            
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={next} size="large" style={{ backgroundColor: '#059669', borderRadius: '8px', padding: '0 32px' }}>
                Continue <RightOutlined style={{ fontSize: '12px' }}/>
              </Button>
            )}
            
            {currentStep === steps.length - 1 && (
              <Button type="primary" htmlType="submit" size="large" loading={submitting} style={{ backgroundColor: '#059669', borderRadius: '8px', padding: '0 40px', height: '48px', fontSize: '16px' }}>
                Confirm Booking
              </Button>
            )}
          </div>
        </Form>
      </div>

      </div>
      <style>{`
        .paw-bg-container {
          background-color: #fafafa;
          background-image: url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23e2e8f0' fill-opacity='0.4' d='M25 45c-8 0-15-10-10-20 4-8 17-9 22 0 4 9-4 20-12 20zm25-15c-9 0-14-14-6-20 8-7 19 0 14 11-4 6-4 9-8 9zm25 15c-8 0-16-11-12-20 5-9 18-8 22 0 5 10-2 20-10 20zM50 85c-27 0-30-28-12-35 9-4 15-4 24 0 18 7 15 35-12 35z'/%3E%3C/svg%3E");
          background-attachment: fixed;
        }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default CreateBookingPage;
