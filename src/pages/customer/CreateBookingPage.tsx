import React, { useState, useEffect } from 'react';
import { Steps, Form, DatePicker, Input, Button, Typography, Spin, message, Row, Col, Divider, Tag, Empty, Tabs, Checkbox, Radio, Card } from 'antd';
import { CalendarOutlined, CheckCircleFilled, GiftOutlined, InfoCircleOutlined, ShopOutlined, RightOutlined, LeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import { petService } from '@/services/pet.service';
import { serviceService } from '@/services/service.service';
import { bookingService } from '@/services/booking.service';
import { roomService } from '@/services/room.service';
import type { ServiceDTO } from '@/types/service.types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const CreateBookingPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  
  const [pets, setPets] = useState<any[]>([]);
  const [services, setServices] = useState<ServiceDTO[]>([]);
  const [roomUnavailableMap, setRoomUnavailableMap] = useState<Record<string, string[]>>({});
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // New state to separate flows
  const [bookingType, setBookingType] = useState<'Grooming' | 'Boarding' | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const [petServices, setPetServices] = useState<Record<string, { groomingIds?: string[], boardingId?: string, dietId?: string }>>({});
  const selectedPetIds: string[] = Form.useWatch('petIds', form) || [];
  const groomingDate = Form.useWatch('groomingDate', form);
  const boardingDateRange = Form.useWatch('boardingDateRange', form);
  const voucherCode = Form.useWatch('voucherCode', form);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [petsRes, servicesData] = await Promise.all([
        petService.fetchMyPets(true),
        serviceService.fetchActive()
      ]);
      const petsList = (petsRes as any).result || (petsRes as any).data || petsRes;
      setPets(Array.isArray(petsList) ? petsList : (petsList.items || []));
      
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

  let hasGrooming = false;
  let hasBoarding = false;
  const boardingServiceIds = new Set<string>();

  Object.values(petServices).forEach((srv: any) => {
    if (srv?.groomingIds?.length > 0) hasGrooming = true;
    if (srv?.boardingId) {
      hasBoarding = true;
      boardingServiceIds.add(srv.boardingId);
    }
  });

  useEffect(() => {
    if (bookingType === 'Boarding') {
      const fetchAvailability = async () => {
        for (const bId of Array.from(boardingServiceIds)) {
          if (!roomUnavailableMap[bId]) {
            try {
              const roomRes = await roomService.checkAvailability({
                serviceId: bId,
                month: dayjs().month() + 1,
                year: dayjs().year()
              });
              if (roomRes.result?.unavailableDates) {
                setRoomUnavailableMap(prev => ({ ...prev, [bId]: roomRes.result.unavailableDates }));
              }
            } catch (e) {}
          }
        }
      };
      fetchAvailability();
    }
  }, [boardingServiceIds, roomUnavailableMap, bookingType]);

  const mergedUnavailableDates = Array.from(boardingServiceIds).reduce((acc: string[], id: string) => {
    const dates = roomUnavailableMap[id] || [];
    return [...acc, ...dates];
  }, []);

  const disabledDate = (current: Dayjs) => {
    if (current && current < dayjs().startOf('day')) return true;
    return mergedUnavailableDates.includes(current.format('YYYY-MM-DD'));
  };

  const next = () => {
    if (currentStep === 0 && selectedPetIds.length === 0) return message.warning('Please select at least 1 pet.');
    if (currentStep === 1) {
      if (bookingType === 'Grooming' && !hasGrooming) return message.warning('Please select at least 1 grooming service.');
      if (bookingType === 'Boarding' && !hasBoarding) return message.warning('Please select a room for the hotel.');
    }
    if (currentStep === 2) {
      if (bookingType === 'Boarding' && (!boardingDateRange || boardingDateRange.length < 2)) return message.warning('Please select a boarding period (Check-in and Check-out).');
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
    const bookingItems: any[] = [];
    
    selectedPetIds.forEach(petId => {
      const srvs = petServices[petId];
      if (!srvs) return;
      
      if (bookingType === 'Grooming' && srvs.groomingIds && srvs.groomingIds.length > 0) {
        srvs.groomingIds.forEach((gId: string) => {
          bookingItems.push({
            petId,
            serviceId: gId,
            scheduledStartAt: values.groomingDate.toISOString(),
            scheduledEndAt: null,
            quantity: 1
          });
        });
      }
      
      if (bookingType === 'Boarding') {
        if (srvs.boardingId) {
          bookingItems.push({
            petId,
            serviceId: srvs.boardingId,
            scheduledStartAt: values.boardingDateRange[0].toISOString(),
            scheduledEndAt: values.boardingDateRange[1].toISOString(),
            quantity: 1
          });
        }
  
        if (srvs.dietId) {
          bookingItems.push({
            petId,
            serviceId: srvs.dietId,
            scheduledStartAt: values.boardingDateRange[0].toISOString(),
            scheduledEndAt: values.boardingDateRange[1].toISOString(),
            quantity: 1
          });
        }
      }
    });

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

  const handleTogglePet = (id: string) => {
    const current = form.getFieldValue('petIds') || [];
    if (current.includes(id)) {
      form.setFieldsValue({ petIds: current.filter((x: string) => x !== id) });
    } else {
      form.setFieldsValue({ petIds: [...current, id] });
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>;

  // Flow Selection Screen
  if (bookingType === null) {
    return (
      <div style={{ padding: '40px 16px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <Title level={2} style={{ marginBottom: '40px', color: '#1e293b' }}>What would you like to book today?</Title>
        <Row gutter={[24, 24]} justify="center">
          <Col xs={24} md={11}>
            <Card 
              hoverable 
              onClick={() => {
                setBookingType('Grooming');
                setCurrentStep(0);
              }}
              style={{ borderRadius: '16px', border: '2px solid #e2e8f0', height: '100%', transition: 'all 0.3s' }}
              bodyStyle={{ padding: '32px', display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✂️</div>
              <Title level={3} style={{ color: '#059669' }}>Grooming & Spa</Title>
              <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '24px' }}>Pet beauty care</Text>
              <ul style={{ textAlign: 'left', color: '#475569', marginBottom: '32px', listStyleType: 'none', padding: 0, flex: 1 }}>
                <li style={{ marginBottom: '12px' }}>✓ Haircut & styling</li>
                <li style={{ marginBottom: '12px' }}>✓ Bath & dry</li>
                <li style={{ marginBottom: '12px' }}>✓ Ear & nail cleaning</li>
              </ul>
              <Button type="primary" size="large" block style={{ backgroundColor: '#059669', borderRadius: '8px' }}>Book Now</Button>
            </Card>
          </Col>
          <Col xs={24} md={11}>
            <Card 
              hoverable 
              onClick={() => {
                setBookingType('Boarding');
                setCurrentStep(0);
              }}
              style={{ borderRadius: '16px', border: '2px solid #e2e8f0', height: '100%', transition: 'all 0.3s' }}
              bodyStyle={{ padding: '32px', display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏨</div>
              <Title level={3} style={{ color: '#059669' }}>Pet Hotel</Title>
              <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '24px' }}>Pet boarding & care</Text>
              <ul style={{ textAlign: 'left', color: '#475569', marginBottom: '32px', listStyleType: 'none', padding: 0, flex: 1 }}>
                <li style={{ marginBottom: '12px' }}>✓ Day/night boarding</li>
                <li style={{ marginBottom: '12px' }}>✓ Air-conditioned rooms</li>
                <li style={{ marginBottom: '12px' }}>✓ 24/7 care & nutrition</li>
              </ul>
              <Button type="primary" size="large" block style={{ backgroundColor: '#059669', borderRadius: '8px' }}>Book Now</Button>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  const groomingOptions = services.filter(s => s.serviceType === 'Grooming' || s.serviceType === 'Care');
  const boardingOptions = services.filter(s => s.serviceType === 'Boarding');
  const dietOptions = services.filter(s => s.serviceType === 'Diet');

  const steps = [
    {
      title: 'Choose Pets',
      content: (
        <div className="step-container fade-in">
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <Title level={3} style={{ color: '#1e293b' }}>
              Choose Pets for {bookingType === 'Grooming' ? 'Spa' : 'Hotel'}
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>You can select one or multiple pets</Text>
          </div>
          
          <Form.Item name="petIds" rules={[{ required: true, message: 'Please select at least 1 pet' }]}>
             <Row gutter={[20, 20]} justify="center">
                {pets.length === 0 && <Empty description="No pets found. Please add a pet first." />}
                {pets.map(pet => {
                  const isSelected = selectedPetIds.includes(pet.id);
                  const isCat = pet.species === 1 || String(pet.species).toLowerCase() === 'cat';
                  return (
                    <Col xs={12} sm={8} md={6} key={pet.id}>
                      <div 
                        onClick={() => handleTogglePet(pet.id)}
                        style={{
                          background: isSelected ? '#ecfdf5' : '#fff',
                          border: `2px solid ${isSelected ? '#10b981' : '#e2e8f0'}`,
                          borderRadius: '16px',
                          padding: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'center',
                          position: 'relative',
                          boxShadow: isSelected ? '0 10px 15px -3px rgba(16, 185, 129, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        {isSelected && <CheckCircleFilled style={{ position: 'absolute', top: 12, right: 12, fontSize: '20px', color: '#10b981' }} />}
                        <div style={{ fontSize: '36px', marginBottom: '10px' }}>{isCat ? '🐱' : '🐶'}</div>
                        <Title level={5} style={{ margin: 0, color: isSelected ? '#065f46' : '#1e293b' }}>{pet.name}</Title>
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
      title: bookingType === 'Grooming' ? 'Select Services' : 'Select Room & Diet',
      content: (
        <div className="step-container fade-in">
           <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <Title level={3} style={{ color: '#1e293b' }}>
              {bookingType === 'Grooming' ? 'Select Spa Services' : 'Select Room & Diet'}
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>Select for each pet, price is automatically calculated based on weight</Text>
          </div>

          <Tabs 
            type="card"
            items={selectedPetIds.map(petId => {
              const pet = pets.find(p => p.id === petId);
              if (!pet) return { key: petId, label: 'Unknown' };
              const isCat = pet.species === 1 || String(pet.species).toLowerCase() === 'cat';
              const pServices = petServices[petId] || {};

              return {
                key: petId,
                label: `[ ${isCat ? '🐱' : '🐶'} Tab ${pet.name} (${pet.weight}kg) ]`,
                children: (
                  <div style={{ padding: '16px', background: '#fff', borderRadius: '0 0 8px 8px', border: '1px solid #f0f0f0', borderTop: 'none' }}>
                    
                    {bookingType === 'Grooming' && (
                      <div style={{ marginBottom: '24px' }}>
                        <Title level={5} style={{ color: '#059669', marginBottom: '16px' }}>✂️ Grooming & Spa Services</Title>
                        <Checkbox.Group 
                          style={{ width: '100%' }}
                          value={pServices.groomingIds || []}
                          onChange={(vals) => setPetServices(prev => ({ ...prev, [petId]: { ...prev[petId], groomingIds: vals as string[] } }))}
                        >
                          <Row gutter={[16, 16]}>
                            {groomingOptions.map(srv => {
                              const price = getPriceForPet(srv, pet.weight);
                              return (
                                <Col span={24} key={srv.id}>
                                  <Checkbox value={srv.id} style={{ display: 'flex', alignItems: 'center', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: pServices.groomingIds?.includes(srv.id) ? '#f0fdf4' : '#fff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginLeft: '8px' }}>
                                      <Text strong>{srv.name}</Text>
                                      <Text strong style={{ color: '#059669' }}>{price.toLocaleString()} VND</Text>
                                    </div>
                                  </Checkbox>
                                </Col>
                              );
                            })}
                          </Row>
                        </Checkbox.Group>
                      </div>
                    )}

                    {bookingType === 'Boarding' && (
                      <div>
                        <Title level={5} style={{ color: '#059669', marginBottom: '16px' }}>🏨 Pet Hotel (Boarding Room)</Title>
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
                            {boardingOptions.map(srv => {
                              const price = getPriceForPet(srv, pet.weight);
                              return (
                                <Col span={24} key={srv.id}>
                                  <Radio value={srv.id} style={{ display: 'flex', alignItems: 'center', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: pServices.boardingId === srv.id ? '#f0fdf4' : '#fff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginLeft: '8px' }}>
                                      <Text strong>{srv.name}</Text>
                                      <Text strong style={{ color: '#059669' }}>{price.toLocaleString()} VND / day</Text>
                                    </div>
                                  </Radio>
                                </Col>
                              );
                            })}
                          </Row>
                        </Radio.Group>
                        
                        {pServices.boardingId && (
                          <div style={{ marginTop: '12px' }}>
                             <Button type="link" danger onClick={() => {
                                setPetServices(prev => ({ ...prev, [petId]: { ...prev[petId], boardingId: undefined, dietId: undefined } }));
                             }}>
                                Clear room selection
                             </Button>
                          </div>
                        )}

                        {pServices.boardingId && dietOptions.length > 0 && (
                          <div style={{ marginTop: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                            <Text strong style={{ display: 'block', marginBottom: '12px' }}>Additional diet service (Optional):</Text>
                            <Radio.Group 
                              style={{ width: '100%' }}
                              value={pServices.dietId}
                              onChange={(e) => setPetServices(prev => ({ ...prev, [petId]: { ...prev[petId], dietId: e.target.value } }))}
                            >
                              <Row gutter={[16, 16]}>
                                {dietOptions.map(srv => {
                                  const price = getPriceForPet(srv, pet.weight);
                                  return (
                                    <Col span={24} key={srv.id}>
                                      <Radio value={srv.id}>
                                        {srv.name} - <Text style={{ color: '#059669' }}>{price.toLocaleString()} VND / day</Text>
                                      </Radio>
                                    </Col>
                                  );
                                })}
                              </Row>
                            </Radio.Group>
                            <div style={{ marginTop: '8px' }}>
                              <Button type="link" size="small" onClick={() => setPetServices(prev => ({ ...prev, [petId]: { ...prev[petId], dietId: undefined } }))}>
                                 Clear diet selection
                              </Button>
                            </div>
                          </div>
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
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <Title level={3} style={{ color: '#1e293b', margin: '0 0 8px 0' }}>Select Schedule</Title>
            <Text type="secondary" style={{ fontSize: '15px' }}>
              Please select the date and time for the {bookingType === 'Grooming' ? 'spa visit' : 'hotel stay'}
            </Text>
          </div>

          <div style={{ maxWidth: '500px', margin: '0 auto', background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ textAlign: 'center', marginBottom: '12px', fontSize: '36px', color: '#10b981' }}>
              <CalendarOutlined />
            </div>
            
            {bookingType === 'Grooming' && (
              <div style={{ marginBottom: '0' }}>
                <Title level={5} style={{ margin: '0 0 8px 0' }}>Grooming Appointment:</Title>
                <Form.Item name="groomingDate" rules={[{ required: true, message: 'Please select a date and time' }]} style={{ marginBottom: '16px' }}>
                  <DatePicker 
                    style={{ width: '100%', padding: '10px', fontSize: '15px', borderRadius: '8px' }} 
                    showTime={{ format: 'HH:mm', minuteStep: 15 }} 
                    format="MMM DD, YYYY - HH:mm" 
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                    size="large"
                    placeholder="Select a date and time for drop-off"
                  />
                </Form.Item>
              </div>
            )}

            {bookingType === 'Boarding' && (
              <div style={{ marginBottom: '0' }}>
                <Title level={5} style={{ margin: '0 0 8px 0' }}>Boarding Appointment:</Title>
                <Form.Item name="boardingDateRange" rules={[{ required: true, message: 'Please select check-in and check-out dates' }]} style={{ marginBottom: '16px' }}>
                  <RangePicker 
                    disabledDate={disabledDate} 
                    style={{ width: '100%', padding: '10px', fontSize: '15px', borderRadius: '8px' }} 
                    showTime={{ format: 'HH:mm' }} 
                    format="MMM DD, YYYY HH:mm"
                    size="large"
                    placeholder={['Check-in', 'Check-out']}
                  />
                </Form.Item>
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
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <Title level={5} style={{ color: '#1e293b', margin: 0 }}>Confirm & Summary</Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>Double check your booking details</Text>
          </div>

          <Row gutter={16}>
            <Col xs={24} md={14}>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)', marginBottom: '16px' }}>
                <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#0f172a' }}>
                  <ShopOutlined /> Order Summary
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
                    <div key={petId} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px dashed #cbd5e1' }}>
                      <Text strong style={{ fontSize: '16px', color: '#0f172a', display: 'block', marginBottom: '12px' }}>
                        {isCat ? '🐱' : '🐶'} {pet.name} ({pet.weight}kg):
                      </Text>
                      
                      <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {bookingType === 'Grooming' && srvs.groomingIds?.map((gId: string) => {
                          const s = services.find(x => x.id === gId);
                          if (!s) return null;
                          const price = getPriceForPet(s, pet.weight);
                          return (
                            <div key={gId} style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Text>{s.name} <Text type="secondary">({groomingDate?.format('DD/MM HH:mm')})</Text></Text>
                              <Text strong>{price.toLocaleString()} VND</Text>
                            </div>
                          );
                        })}
                        
                        {bookingType === 'Boarding' && srvs.boardingId && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            {(() => {
                               const s = services.find(x => x.id === srvs.boardingId);
                               const price = s ? getPriceForPet(s, pet.weight) * boardingDays : 0;
                               return (
                                 <>
                                   <Text>{s?.name} <Text type="secondary">({boardingDateRange?.[0]?.format('DD/MM')} - {boardingDateRange?.[1]?.format('DD/MM')})</Text></Text>
                                   <Text strong>{price.toLocaleString()} VND</Text>
                                 </>
                               )
                            })()}
                          </div>
                        )}

                        {bookingType === 'Boarding' && srvs.dietId && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            {(() => {
                               const s = services.find(x => x.id === srvs.dietId);
                               const price = s ? getPriceForPet(s, pet.weight) * boardingDays : 0;
                               return (
                                 <>
                                   <Text>{s?.name}</Text>
                                   <Text strong>{price.toLocaleString()} VND</Text>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: '16px' }}>Total amount</Text>
                    <Title level={3} style={{ margin: 0, color: '#059669' }}>
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
    <div style={{ padding: '16px', maxWidth: '100%', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>Book Appointment</Title>
          <Tag color="cyan" style={{ fontSize: '14px', padding: '4px 12px', marginTop: '8px', borderRadius: '12px' }}>
             {bookingType === 'Grooming' ? '✂️ Grooming & Spa' : '🏨 Pet Hotel'}
          </Tag>
        </div>
      
      <Steps 
        current={currentStep} 
        items={steps.map(s => ({ title: s.title }))} 
        style={{ marginBottom: '24px' }} 
        size="small"
      />

      <div className="paw-bg-card" style={{ borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          
          <div style={{ minHeight: 'auto', marginBottom: '16px' }}>
            {steps.map((step, index) => (
              <div key={index} style={{ display: currentStep === index ? 'block' : 'none' }}>
                {step.content}
              </div>
            ))}
          </div>

          <Divider style={{ margin: '32px 0 24px' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button onClick={prev} size="large" style={{ borderRadius: '8px', padding: '0 24px' }}>
              <LeftOutlined style={{ fontSize: '12px' }}/> Back
            </Button>
            
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
        .paw-bg-card {
          background-color: #ffffff;
          background-image: url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23f1f5f9' fill-opacity='0.6' d='M25 45c-8 0-15-10-10-20 4-8 17-9 22 0 4 9-4 20-12 20zm25-15c-9 0-14-14-6-20 8-7 19 0 14 11-4 6-4 9-8 9zm25 15c-8 0-16-11-12-20 5-9 18-8 22 0 5 10-2 20-10 20zM50 85c-27 0-30-28-12-35 9-4 15-4 24 0 18 7 15 35-12 35z'/%3E%3C/svg%3E");
        }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default CreateBookingPage;
