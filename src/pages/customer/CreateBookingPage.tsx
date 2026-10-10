import React, { useState, useEffect } from 'react';
import { Form, Select, DatePicker, Input, Button, Card, Typography, Spin, message, Row, Col, Divider, Space } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
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

  // Watch entire items array to trigger re-calculation
  const itemsWatch = Form.useWatch('items', form) || [];

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

  // Fetch details and availability dynamically when a service is selected
  useEffect(() => {
    itemsWatch.forEach((item: any) => {
      if (item?.serviceId && !serviceDetailsMap[item.serviceId]) {
        fetchServiceDetailAndAvailability(item.serviceId);
      }
    });
  }, [itemsWatch]);

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

  const calculateTotal = () => {
    let total = 0;
    for (const item of itemsWatch) {
      if (!item || !item.petId || !item.serviceId) continue;
      
      const pet = pets.find(p => p.id === item.petId);
      const detail = serviceDetailsMap[item.serviceId];
      if (!pet || !detail) continue;

      const petWeight = pet.weight || 0;
      const prices = detail.prices || [];
      const applicablePrice = prices.find((p: any) => 
        (p.minWeight == null || p.minWeight <= petWeight) &&
        (p.maxWeight == null || p.maxWeight >= petWeight)
      );

      if (applicablePrice) {
        total += applicablePrice.price;
      }
    }
    return total;
  };

  const totalAmount = calculateTotal();

  const onFinish = async (values: any) => {
    if (!values.items || values.items.length === 0) {
      message.error('Please add at least one service.');
      return;
    }

    const bookingItems = [];

    for (let i = 0; i < values.items.length; i++) {
      const item = values.items[i];
      const service = services.find(s => s.id === item.serviceId);
      const isBoarding = service?.serviceType === 'Boarding' || service?.roomTypeId != null;

      let startAt, endAt;

      if (isBoarding) {
        if (!item.dateRange || item.dateRange.length < 2) {
          message.error(`Row ${i + 1}: Please select start and end dates for boarding.`);
          return;
        }
        startAt = item.dateRange[0].toISOString();
        endAt = item.dateRange[1].toISOString();
      } else {
        if (!item.date) {
          message.error(`Row ${i + 1}: Please select an appointment date.`);
          return;
        }
        startAt = item.date.toISOString();
        endAt = null;
      }

      bookingItems.push({
        petId: item.petId,
        serviceId: item.serviceId,
        scheduledStartAt: startAt,
        scheduledEndAt: endAt,
        quantity: 1
      });
    }

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

  const petOptions = pets.map(pet => ({
    label: `${pet.name} (${pet.weight}kg)`,
    value: pet.id
  }));

  const serviceOptions = services.map(srv => ({
    label: srv.name,
    value: srv.id
  }));

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>Book Services</Title>
      <Card>
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={onFinish}
          initialValues={{ items: [{}] }} // Start with one empty row
        >
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => {
                  const currentServiceId = itemsWatch[name]?.serviceId;
                  const currentService = services.find(s => s.id === currentServiceId);
                  const isBoarding = currentService?.serviceType === 'Boarding' || currentService?.roomTypeId != null;
                  
                  const disabledDate = (current: Dayjs) => {
                    if (current && current < dayjs().startOf('day')) return true;
                    if (!currentServiceId || !roomUnavailableMap[currentServiceId]) return false;
                    const dateStr = current.format('YYYY-MM-DD');
                    return roomUnavailableMap[currentServiceId].includes(dateStr);
                  };

                  return (
                    <div key={key} style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '16px', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <Text strong style={{ fontSize: '16px' }}>Item #{index + 1}</Text>
                        {fields.length > 1 && (
                          <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)}>
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      <Row gutter={16}>
                        <Col xs={24} md={12}>
                          <Form.Item 
                            {...restField} 
                            name={[name, 'petId']} 
                            label="Select Pet" 
                            rules={[{ required: true, message: 'Please select a pet' }]}
                          >
                            <Select placeholder="Choose your pet" options={petOptions} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item 
                            {...restField} 
                            name={[name, 'serviceId']} 
                            label="Select Service" 
                            rules={[{ required: true, message: 'Please select a service' }]}
                          >
                            <Select placeholder="Choose a service" options={serviceOptions} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        {isBoarding ? (
                          <Col xs={24}>
                            <Form.Item 
                              {...restField} 
                              name={[name, 'dateRange']} 
                              label="Boarding Period" 
                              rules={[{ required: true, message: 'Please select dates' }]}
                            >
                              <RangePicker 
                                disabledDate={disabledDate} 
                                style={{ width: '100%' }} 
                                showTime={{ format: 'HH:mm' }} 
                                format="YYYY-MM-DD HH:mm"
                              />
                            </Form.Item>
                          </Col>
                        ) : (
                          <Col xs={24}>
                            <Form.Item 
                              {...restField} 
                              name={[name, 'date']} 
                              label="Appointment Date & Time" 
                              rules={[{ required: true, message: 'Please select a date' }]}
                            >
                              <DatePicker 
                                style={{ width: '100%' }} 
                                showTime={{ format: 'HH:mm' }} 
                                format="YYYY-MM-DD HH:mm" 
                                disabledDate={(current) => current && current < dayjs().startOf('day')}
                              />
                            </Form.Item>
                          </Col>
                        )}
                      </Row>
                    </div>
                  );
                })}
                
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ height: '45px' }}>
                    Add another service
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Row gutter={16} style={{ marginTop: '24px' }}>
            <Col xs={24}>
              <Form.Item name="voucherCode" label="Voucher Code (Optional)">
                <Input placeholder="Enter voucher code if you have one" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <div style={{ marginBottom: '24px', textAlign: 'right' }}>
            <Text type="secondary">Estimated Subtotal:</Text>
            <Title level={3} style={{ margin: 0, color: '#059669' }}>
              {totalAmount > 0 ? `${totalAmount.toLocaleString()} VND` : '---'}
            </Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              * Voucher discount will be applied after submission (Preview currently unavailable).
            </Text>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={submitting} style={{ backgroundColor: '#059669' }}>
              Confirm All Bookings
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateBookingPage;
