import { useCallback, useEffect, useState } from 'react';
import { Button, DatePicker, Descriptions, Dropdown, Empty, Input, InputNumber, Modal, Select, Space, Spin, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { CalendarOutlined, CheckOutlined, CloseOutlined, CreditCardOutlined, EyeOutlined, MoreOutlined, ReloadOutlined, UserSwitchOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';
import { bookingService, type BookingDetail, type BookingDetailItem, type BookingListItem, type CheckoutSummary } from '@/services/booking.service';
import { roomService, type RoomDTO } from '@/services/room.service';
import { staffService } from '@/services/staff.service';
import type { StaffDTO } from '@/types/staff.types';
import { getApiErrorMessage } from '@/utils/apiError';

const { Title, Text } = Typography;
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0);
const statusName = (status: number | string) => {
  const value = String(status ?? '').toLowerCase();
  if (value === '0' || value === 'pending') return 'Pending';
  if (value === '1' || value === 'confirmed') return 'Confirmed';
  if (value === '2' || value === 'completed') return 'Completed';
  if (value === '3' || value === 'cancelled' || value === 'canceled') return 'Cancelled';
  if (value === 'checked_in' || value === 'checkedin') return 'Checked In';
  if (value === 'in_progress' || value === 'inprogress' || value === 'partially_completed') return 'In Progress';
  return String(status ?? 'Unknown');
};
const statusColor = (status: number | string) => ({ Pending: 'gold', Confirmed: 'blue', 'In Progress': 'processing', Completed: 'green', Cancelled: 'red' }[statusName(status)] ?? 'default');
const canCheckIn = (status: number | string) => ['Pending', 'Confirmed'].includes(statusName(status));
const canCancel = (status: number | string) => ['Pending', 'Confirmed'].includes(statusName(status));
const isBoardingType = (type: number | string) => String(type).toLowerCase() === 'boarding' || String(type) === '1';

export default function StaffBookingListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingBase = location.pathname.startsWith('/admin') ? '/admin/bookings' : '/staff/bookings';
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState<number>();
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [appointmentDate, setAppointmentDate] = useState<Dayjs | null>(dayjs());
  const [loading, setLoading] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [assignItem, setAssignItem] = useState<BookingDetailItem | null>(null);
  const [staffOptions, setStaffOptions] = useState<StaffDTO[]>([]);
  const [roomOptions, setRoomOptions] = useState<RoomDTO[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>();
  const [selectedRoomId, setSelectedRoomId] = useState<string>();
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignOptionsLoading, setAssignOptionsLoading] = useState(false);

  const [cancelId, setCancelId] = useState<string>();
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutSummary, setCheckoutSummary] = useState<CheckoutSummary | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSaving, setCheckoutSaving] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
  const [amount, setAmount] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await bookingService.search({ keyword: keyword || undefined, status, date: appointmentDate?.format('YYYY-MM-DD'), pageNumber, pageSize });
      setBookings([...result.items].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()));
      setTotalCount(result.totalCount);
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Failed to load bookings.'));
    } finally {
      setLoading(false);
    }
  }, [keyword, status, appointmentDate, pageNumber, pageSize]);

  useEffect(() => { void loadBookings(); }, [loadBookings]);

  const openDetails = async (id: string) => {
    setDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);
    try {
      setDetail(await bookingService.fetchById(id));
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Failed to load booking details.'));
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const openAssignment = async (item: BookingDetailItem) => {
    setAssignItem(item);
    setSelectedStaffId(item.staffId || undefined);
    setSelectedRoomId(item.roomId || undefined);
    setAssignOptionsLoading(true);
    try {
      const [staffRes, roomRes] = await Promise.all([
        staffService.fetchWithPagination({ status: 'active', pageNumber: 1, pageSize: 100 }),
        roomService.fetchWithPagination({ pageNumber: 1, pageSize: 100 }),
      ]);
      const allStaff = staffRes.items ?? [];
      const expectedRole = isBoardingType(item.serviceType) ? 'boarding' : 'grooming';
      const matchingStaff = allStaff.filter((staff) => staff.roles?.some((role) => role.toLowerCase().includes(expectedRole)));
      setStaffOptions(matchingStaff.length ? matchingStaff : allStaff);
      const allRooms = roomRes.result?.items ?? [];
      setRoomOptions(allRooms.filter((room) => String(room.status).toLowerCase() === 'available' || room.id === item.roomId));
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Could not load staff and rooms.'));
      setStaffOptions([]);
      setRoomOptions([]);
    } finally {
      setAssignOptionsLoading(false);
    }
  };

  const saveAssignment = async () => {
    if (!detail || !assignItem) return;
    if (!selectedStaffId) {
      message.warning('Select a staff member to assign this service.');
      return;
    }
    if (isBoardingType(assignItem.serviceType) && !selectedRoomId) {
      message.warning('Select a room for this boarding stay.');
      return;
    }
    setAssignLoading(true);
    try {
      await bookingService.assignItem(detail.id, assignItem.id, {
        staffId: selectedStaffId,
        ...(selectedRoomId ? { roomId: selectedRoomId } : {}),
      });
      message.success('Staff and room assignment saved.');
      setAssignItem(null);
      setDetail(await bookingService.fetchById(detail.id));
      await loadBookings();
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Assignment failed.'));
    } finally {
      setAssignLoading(false);
    }
  };

  const handleCheckIn = (booking: BookingListItem) => {
    Modal.confirm({
      title: 'Check in this booking?',
      content: `Confirm that ${booking.customerName} and their pet(s) have arrived.`,
      okText: 'Check in',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await bookingService.checkIn(booking.id);
          message.success('Booking checked in.');
          await loadBookings();
        } catch (error) {
          message.error(getApiErrorMessage(error, 'Check-in failed.'));
        }
      },
    });
  };

  const openCheckout = async (id: string) => {
    setCheckoutOpen(true);
    setCheckoutSummary(null);
    setCheckoutLoading(true);
    setPaymentMethod('CASH');
    setNote('');
    try {
      const summary = await bookingService.getCheckoutSummary(id);
      setCheckoutSummary(summary);
      setAmount(summary.remainingAmount ?? 0);
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Failed to load checkout summary.'));
      setCheckoutOpen(false);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const submitCheckout = async () => {
    if (!checkoutSummary) return;
    setCheckoutSaving(true);
    try {
      await bookingService.checkout(checkoutSummary.bookingId, {
        paymentMethod,
        amount,
        note: note.trim() || undefined,
      });
      message.success('Payment received and booking completed.');
      setCheckoutOpen(false);
      await loadBookings();
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Checkout failed.'));
    } finally {
      setCheckoutSaving(false);
    }
  };

  const submitCancellation = async () => {
    if (!cancelId || !cancelReason.trim()) return;
    setCancelLoading(true);
    try {
      await bookingService.cancelBooking(cancelId, cancelReason.trim());
      message.success('Booking cancelled.');
      setCancelId(undefined);
      setCancelReason('');
      await loadBookings();
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Cancellation failed.'));
    } finally {
      setCancelLoading(false);
    }
  };

  const columns: ColumnsType<BookingListItem> = [
    { title: 'No.', key: 'number', width: 75, render: (_: unknown, __: BookingListItem, index: number) => (pageNumber - 1) * pageSize + index + 1 },
    { title: 'Customer', dataIndex: 'customerName', key: 'customer', render: (_: string, row) => <div><div>{row.customerName}</div><Text type="secondary">{row.customerPhone || '—'}</Text></div> },
    { title: 'Pets / Services', dataIndex: 'itemsCount', key: 'itemsCount', render: (count: number) => count ?? 0 },
    { title: 'Total', dataIndex: 'totalPrice', key: 'totalPrice', render: (value: number) => money(value) },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (value: number | string) => <Tag color={statusColor(value)}>{statusName(value)}</Tag> },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (value: string) => value ? dayjs(value).format('MMM D, YYYY HH:mm') : '—' },
    {
      title: 'Actions', key: 'actions', render: (_: unknown, row) => {
        const items: MenuProps['items'] = [
          ...(canCheckIn(row.status) ? [{ key: 'check-in', label: 'Check in', icon: <CheckOutlined /> }] : []),
          ...(!['Completed', 'Cancelled'].includes(statusName(row.status)) ? [{ key: 'checkout', label: 'Checkout', icon: <CreditCardOutlined /> }] : []),
          ...(canCancel(row.status) ? [{ key: 'cancel', label: <span style={{ color: '#dc2626' }}>Cancel booking</span>, icon: <CloseOutlined /> }] : []),
        ];
        return (
          <Space size="small">
            <Button icon={<EyeOutlined />} onClick={() => void openDetails(row.id)}>Details</Button>
            {items.length > 0 && <Dropdown
              trigger={['click']}
              menu={{ items, onClick: ({ key }) => {
                if (key === 'check-in') handleCheckIn(row);
                if (key === 'checkout') void openCheckout(row.id);
                if (key === 'cancel') { setCancelId(row.id); setCancelReason(''); }
              } }}
            >
              <Button icon={<MoreOutlined />}>More</Button>
            </Dropdown>}
          </Space>
        );
      },
    },
  ];

  const onTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current) setPageNumber(pagination.current);
    if (pagination.pageSize) setPageSize(pagination.pageSize);
  };

  return (
    <section className="page wide">
      <div className="page-head">
        <div>
          <Title level={2} style={{ margin: 0 }}>Bookings</Title>
          <Text type="secondary">Search bookings, check in arrivals, and settle payments at checkout.</Text>
        </div>
        <Space wrap>
          <Button type="primary" icon={<CalendarOutlined />} onClick={() => navigate(`${bookingBase}/new`)}>+ Create walk-in booking</Button>
          <Button icon={<ReloadOutlined />} onClick={() => void loadBookings()} loading={loading}>Refresh</Button>
        </Space>
      </div>

      <Space wrap style={{ margin: '1rem 0' }}>
        <Input.Search
          allowClear
          placeholder="Search customer name or phone"
          value={keywordInput}
          onChange={(event) => setKeywordInput(event.target.value)}
          onSearch={(value) => { setPageNumber(1); setKeyword(value.trim()); }}
          style={{ width: 320 }}
        />
        <DatePicker
          value={appointmentDate}
          allowClear
          placeholder="Appointment date"
          onChange={(value) => { setPageNumber(1); setAppointmentDate(value); }}
        />
        <Select
          allowClear
          placeholder="All statuses"
          value={status}
          onChange={(value) => { setPageNumber(1); setStatus(value); }}
          options={[
            { value: 0, label: 'Pending' },
            { value: 1, label: 'Confirmed' },
            { value: 2, label: 'Completed' },
            { value: 3, label: 'Cancelled' },
          ]}
          style={{ width: 180 }}
        />
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={bookings}
        loading={loading}
        locale={{ emptyText: <Empty description="No bookings found" /> }}
        pagination={{ current: pageNumber, pageSize, total: totalCount, showSizeChanger: true, showTotal: (total) => `${total} bookings` }}
        onChange={onTableChange}
        scroll={{ x: 1100 }}
      />

      <Modal title="Booking Details" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={900}>
        {detailLoading ? <Spin /> : detail && (
          <>
            <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Customer">{detail.customerName}</Descriptions.Item>
              <Descriptions.Item label="Phone">{detail.customerPhone || '—'}</Descriptions.Item>
              <Descriptions.Item label="Created">{dayjs(detail.createdAt).format('MMM D, YYYY HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color={statusColor(detail.status)}>{statusName(detail.status)}</Tag></Descriptions.Item>
              <Descriptions.Item label="Total">{money(detail.totalPrice)}</Descriptions.Item>
              {detail.voucherCode && <Descriptions.Item label="Voucher">{detail.voucherCode} (−{money(detail.discountAmount)})</Descriptions.Item>}
              {detail.cancellationReason && <Descriptions.Item label="Cancellation reason" span={2}>{detail.cancellationReason}</Descriptions.Item>}
            </Descriptions>
            <Title level={5} style={{ marginTop: 20 }}>Pets, services, rooms, and assigned staff</Title>
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={detail.bookingItems ?? []}
              columns={[
                { title: 'Pet', dataIndex: 'petName', key: 'pet', render: (name: string, item) => <>{name}<br /><Text type="secondary">{item.petSpecies} · {item.petWeight} kg</Text></> },
                { title: 'Service', dataIndex: 'serviceName', key: 'service' },
                { title: 'Schedule', dataIndex: 'scheduledStartAt', key: 'schedule', render: (date: string, item) => <>{dayjs(date).format('MMM D, YYYY HH:mm')}{item.scheduledEndAt && <><br />to {dayjs(item.scheduledEndAt).format('MMM D, YYYY HH:mm')}</>}</> },
                { title: 'Room', dataIndex: 'roomName', key: 'room', render: (value: string) => value || '—' },
                { title: 'Staff', dataIndex: 'staffName', key: 'staff', render: (value: string) => value || '—' },
                { title: 'Assignment', key: 'assignment', render: (_: unknown, item: BookingDetailItem) => <Button size="small" icon={<UserSwitchOutlined />} onClick={() => void openAssignment(item)}>Assign</Button> },
                { title: 'Status', dataIndex: 'status', key: 'status', render: (value: number | string) => <Tag>{statusName(value)}</Tag> },
                { title: 'Price', dataIndex: 'assignedPrice', key: 'price', render: (value: number) => money(value) },
              ]}
              scroll={{ x: 750 }}
            />
          </>
        )}
      </Modal>

      <Modal
        title={<><UserSwitchOutlined /> Assign staff and room</>}
        open={Boolean(assignItem)}
        onCancel={() => setAssignItem(null)}
        onOk={() => void saveAssignment()}
        okText="Save assignment"
        confirmLoading={assignLoading}
        okButtonProps={{ disabled: assignOptionsLoading }}
        destroyOnClose
      >
        {assignItem && <>
          <p>Assign <Text strong>{assignItem.petName}</Text> · {assignItem.serviceName}</p>
          {assignOptionsLoading ? <Spin /> : <div style={{ display: 'grid', gap: 16 }}>
            <label>Staff member
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Select a staff member"
                value={selectedStaffId}
                onChange={setSelectedStaffId}
                options={staffOptions.map((staff) => ({ value: staff.id, label: `${staff.fullName} · ${staff.roles?.join(', ') || 'Staff'}` }))}
                style={{ width: '100%', marginTop: 6 }}
              />
            </label>
            <label>Room
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                placeholder={isBoardingType(assignItem.serviceType) ? 'Select an available boarding room' : 'Select a room (optional)'}
                value={selectedRoomId}
                onChange={setSelectedRoomId}
                options={roomOptions.map((room) => ({ value: room.id, label: `${room.roomName} · ${room.roomTypeName}` }))}
                style={{ width: '100%', marginTop: 6 }}
              />
            </label>
            {staffOptions.length === 0 && <Text type="warning">No active staff were returned by the staff API.</Text>}
            {roomOptions.length === 0 && isBoardingType(assignItem.serviceType) && <Text type="warning">No available rooms were returned by the rooms API.</Text>}
          </div>}
        </>}
      </Modal>

      <Modal
        title={<><CreditCardOutlined /> Checkout Summary</>}
        open={checkoutOpen}
        onCancel={() => setCheckoutOpen(false)}
        onOk={() => void submitCheckout()}
        okText="Collect payment & complete"
        confirmLoading={checkoutSaving}
        okButtonProps={{ disabled: !checkoutSummary?.canCheckout }}
        width={700}
      >
        {checkoutLoading ? <Spin /> : checkoutSummary && (
          <>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Customer">{checkoutSummary.customerName}</Descriptions.Item>
              <Descriptions.Item label="Phone">{checkoutSummary.customerPhone}</Descriptions.Item>
              <Descriptions.Item label="Total">{money(checkoutSummary.totalPrice)}</Descriptions.Item>
              <Descriptions.Item label="Already paid">{money(checkoutSummary.totalPaid)}</Descriptions.Item>
              <Descriptions.Item label="Remaining to collect" span={2}><Text strong>{money(checkoutSummary.remainingAmount)}</Text></Descriptions.Item>
            </Descriptions>
            <Table
              style={{ marginTop: 16 }}
              rowKey="itemId"
              size="small"
              pagination={false}
              dataSource={checkoutSummary.items ?? []}
              columns={[
                { title: 'Pet', dataIndex: 'petName', key: 'pet' },
                { title: 'Service', dataIndex: 'serviceName', key: 'service' },
                { title: 'Room', dataIndex: 'roomName', key: 'room', render: (value: string) => value || '—' },
                { title: 'Staff', dataIndex: 'staffName', key: 'staff', render: (value: string) => value || '—' },
                { title: 'Amount', dataIndex: 'assignedPrice', key: 'amount', render: (value: number) => money(value) },
              ]}
              scroll={{ x: 500 }}
            />
            {!checkoutSummary.canCheckout && <Text type="danger">This booking cannot be checked out.</Text>}
            <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              <label>Payment method
                <Select value={paymentMethod} onChange={setPaymentMethod} style={{ width: '100%' }} options={[{ value: 'CASH', label: 'Cash' }, { value: 'BANK_TRANSFER', label: 'Bank transfer' }]} />
              </label>
              <label>Amount to collect (leave empty to collect remaining balance)
                <InputNumber min={0} max={checkoutSummary.remainingAmount} value={amount} onChange={setAmount} style={{ width: '100%' }} />
              </label>
              <label>Note
                <Input.TextArea value={note} onChange={(event) => setNote(event.target.value)} placeholder="e.g. Cash collected at pickup" rows={2} />
              </label>
            </div>
          </>
        )}
      </Modal>

      <Modal
        title="Cancel booking"
        open={Boolean(cancelId)}
        onCancel={() => setCancelId(undefined)}
        onOk={() => void submitCancellation()}
        okText="Confirm cancellation"
        okButtonProps={{ danger: true, disabled: !cancelReason.trim() }}
        confirmLoading={cancelLoading}
      >
        <p>Enter a reason for cancelling this booking.</p>
        <Input.TextArea value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} rows={3} maxLength={500} />
      </Modal>
    </section>
  );
}
