import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, DatePicker, Descriptions, Dropdown, Empty, Input, InputNumber, Modal, Select, Space, Spin, Table, Tag, Tooltip, Typography, message } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { CalendarOutlined, CheckOutlined, CloseOutlined, CreditCardOutlined, EyeOutlined, MoreOutlined, ReloadOutlined, UserSwitchOutlined, StopOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';
import { bookingService, type BookingDetail, type BookingDetailItem, type BookingListItem, type CheckoutSummary } from '@/services/booking.service';
import { roomService, type RoomDTO } from '@/services/room.service';
import { staffService } from '@/services/staff.service';
import type { StaffDTO } from '@/types/staff.types';
import { getApiErrorMessage } from '@/utils/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { hasPermission, PERMISSIONS } from '@/auth/permissionHelper';

const { Title, Text } = Typography;
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0);
const statusName = (status?: number | string) => {
  const value = String(status ?? '').toLowerCase();
  if (value === '0' || value === 'pending') return 'Pending';
  if (value === '1' || value === 'confirmed') return 'Confirmed';
  if (value === '2' || value === 'completed') return 'Completed';
  if (value === '3' || value === 'cancelled' || value === 'canceled') return 'Cancelled';
  if (value === '4' || value === 'no_show' || value === 'noshow') return 'No Show';
  if (value === 'checked_in' || value === 'checkedin') return 'Checked In';
  if (value === 'in_progress' || value === 'inprogress' || value === 'partially_completed') return 'In Progress';
  return String(status ?? 'Unknown');
};
const statusColor = (status: number | string) => ({
  Pending: 'gold',
  Confirmed: 'blue',
  'In Progress': 'processing',
  Completed: 'green',
  Cancelled: 'red',
  'No Show': 'purple',
}[statusName(status)] ?? 'default');
const canCheckIn = (status: number | string) => statusName(status) === 'Confirmed';
const canCancelByStatus = (status: number | string) => ['Pending', 'Confirmed'].includes(statusName(status));
const hasInProgressItem = (items: BookingDetailItem[] = []) => items.some((item) => {
  const value = String(item.status ?? '').toLowerCase();
  return value === '3' || value === 'in_progress' || value === 'inprogress';
});
const canCancelBooking = (booking: Pick<BookingDetail, 'status' | 'bookingItems'>) =>
  canCancelByStatus(booking.status) && !hasInProgressItem(booking.bookingItems);
const isBoardingType = (type: number | string) => String(type).toLowerCase() === 'boarding' || String(type) === '1';
const isCheckoutExemptItem = (status: number | string) => ['5', '6', 'cancelled', 'canceled', 'no_show', 'noshow'].includes(String(status).trim().toLowerCase());
const isTaskCompleted = (status: number | string) => ['4', 'completed'].includes(String(status).trim().toLowerCase());
const taskStatusName = (status: number | string) => {
  const value = String(status ?? '').trim().toLowerCase();
  return ({ '0': 'Pending', '1': 'Confirmed', '2': 'Checked In', '3': 'In Progress', '4': 'Completed', '5': 'Cancelled', '6': 'No Show' } as Record<string, string>)[value]
    ?? value.replace(/_/g, ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase());
};
const getCheckoutBlockers = (items: CheckoutSummary['items'] = []) => items.flatMap((item) => {
  if (isCheckoutExemptItem(item.status)) return [];
  const itemLabel = `${item.petName} · ${item.serviceName}`;
  const reasons: string[] = [];
  if (!item.staffId) reasons.push(`${itemLabel}: staff has not been assigned.`);
  if (isBoardingType(item.serviceType) && !item.roomId) reasons.push(`${itemLabel}: boarding room has not been assigned.`);
  if (!isTaskCompleted(item.status)) reasons.push(`${itemLabel}: task is not completed.`);
  return reasons;
});

export default function StaffBookingListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingBase = location.pathname.startsWith('/admin') ? '/admin/bookings' : '/staff/bookings';
  const currentUser = useAuthStore((s) => s.user);
  const canCreate = hasPermission(currentUser, PERMISSIONS.BOOKING_CREATE);
  const canCheckInPerm = hasPermission(currentUser, PERMISSIONS.BOOKING_CHECKIN);
  const canCancelPerm = hasPermission(currentUser, PERMISSIONS.BOOKING_CANCEL);
  const canAssignPerm = hasPermission(currentUser, PERMISSIONS.BOOKING_ASSIGN_STAFF);
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
  const [checkoutBlockers, setCheckoutBlockers] = useState<string[]>([]);
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
    if (statusName(detail?.status) !== 'Confirmed') {
      message.warning('Chỉ có thể phân công nhân viên sau khi đơn đặt lịch đã được Xác nhận (Confirmed).');
      return;
    }
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
      const expectedRole = isBoardingType(item.serviceType) ? 'boarding staff' : 'grooming staff';
      const matchingStaff = allStaff.filter((staff) => {
        const roles = staff.roles || [];
        const isAdmin = roles.some((r) => r.trim().toLowerCase() === 'admin');
        if (isAdmin) return false;
        return roles.some((role) => role.trim().toLowerCase() === expectedRole);
      });
      setStaffOptions(matchingStaff);
      const allRooms = roomRes.result?.items ?? [];
      setRoomOptions(allRooms.filter((room) => String(room.status).trim().toLowerCase() === 'available' || room.id === item.roomId));
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
    if (statusName(detail.status) !== 'Confirmed') {
      message.warning('Chỉ có thể phân công nhân viên sau khi đơn đặt lịch đã được Xác nhận (Confirmed).');
      return;
    }
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
        ...(isBoardingType(assignItem.serviceType) ? { roomId: selectedRoomId } : {}),
      });
      message.success(isBoardingType(assignItem.serviceType) ? 'Staff and room assignment saved.' : 'Staff assignment saved.');
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
    setCheckoutBlockers([]);
    setCheckoutLoading(true);
    setPaymentMethod('CASH');
    setNote('');
    try {
      const summary = await bookingService.getCheckoutSummary(id);
      setCheckoutSummary(summary);
      setCheckoutBlockers(getCheckoutBlockers(summary.items ?? []));
      setAmount((summary.remainingAmount ?? 0) > 0 ? summary.remainingAmount : null);
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Failed to load checkout summary.'));
      setCheckoutOpen(false);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const submitCheckout = async () => {
    if (!checkoutSummary) return;
    if (checkoutBlockers.length > 0) {
      message.warning('Complete all service tasks and assignments before checkout.');
      return;
    }
    if ((checkoutSummary.remainingAmount ?? 0) > 0 && amount === 0) {
      message.warning('Enter an amount greater than 0, or clear the field to collect the remaining balance.');
      return;
    }
    setCheckoutSaving(true);
    try {
      await bookingService.checkout(checkoutSummary.bookingId, {
        paymentMethod,
        // The API rejects an explicit zero. Null means "collect remaining";
        // when nothing remains, it lets the already-paid booking complete.
        amount: (checkoutSummary.remainingAmount ?? 0) > 0 ? amount : null,
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

  const handleMarkNoShow = async (id: string) => {
    try {
      await bookingService.markNoShow(id);
      message.success('Đã đánh dấu khách không đến (No-Show). Lịch hẹn và phòng đã được giải phóng.');
      await loadBookings();
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Không thể đánh dấu No-Show.'));
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
          ...(canCheckIn(row.status) && canCheckInPerm ? [{ key: 'check-in', label: 'Check in', icon: <CheckOutlined /> }] : []),
          ...(!['Completed', 'Cancelled', 'No Show'].includes(statusName(row.status)) ? [{ key: 'checkout', label: 'Checkout', icon: <CreditCardOutlined /> }] : []),
          ...(canCancelByStatus(row.status) && canCancelPerm ? [{ key: 'cancel', label: <span style={{ color: '#dc2626' }}>Cancel booking</span>, icon: <CloseOutlined /> }] : []),
          ...(statusName(row.status) === 'Confirmed' && canCancelPerm ? [{ key: 'no-show', label: <span style={{ color: '#7c3aed' }}>Mark No-Show</span>, icon: <StopOutlined /> }] : []),
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
                if (key === 'no-show') void handleMarkNoShow(row.id);
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
          {canCreate && (
            <Button type="primary" icon={<CalendarOutlined />} onClick={() => navigate(`${bookingBase}/new`)}>+ Create walk-in booking</Button>
          )}
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
            { value: 4, label: 'No Show' },
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

      <Modal
        title="Booking Details"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={detail ? <Space>
          {canCancelBooking(detail) && canCancelPerm && <Button danger onClick={() => { setCancelId(detail.id); setCancelReason(''); }}>Cancel booking</Button>}
          {statusName(detail.status) === 'Confirmed' && !hasInProgressItem(detail.bookingItems) && canCancelPerm && (
            <Button
              onClick={() => { setDetailOpen(false); void handleMarkNoShow(detail.id); }}
              style={{ color: '#7c3aed', borderColor: '#c4b5fd', backgroundColor: '#f5f3ff' }}
            >
              Mark No-Show
            </Button>
          )}
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </Space> : null}
        width={900}
      >
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
                {
                  title: 'Assignment',
                  key: 'assignment',
                  render: (_: unknown, item: BookingDetailItem) => {
                    if (!canAssignPerm) {
                      return (
                        <Tooltip title="Bạn không có quyền phân công nhân viên hoặc xếp phòng (Yêu cầu quyền BOOKING_ASSIGN_STAFF)">
                          <Button size="small" icon={<UserSwitchOutlined />} disabled>Assign</Button>
                        </Tooltip>
                      );
                    }
                    const isConfirmed = statusName(detail.status) === 'Confirmed';
                    return isConfirmed ? (
                      <Button size="small" icon={<UserSwitchOutlined />} onClick={() => void openAssignment(item)}>Assign</Button>
                    ) : (
                      <Tooltip title="Chỉ phân công sau khi đơn đã Xác nhận (Confirmed)">
                        <Button size="small" icon={<UserSwitchOutlined />} disabled>Assign</Button>
                      </Tooltip>
                    );
                  },
                },
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
            {isBoardingType(assignItem.serviceType) && <label>Room
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Select an available boarding room"
                value={selectedRoomId}
                onChange={setSelectedRoomId}
                options={roomOptions.map((room) => ({ value: room.id, label: `${room.roomName} · ${room.roomTypeName}` }))}
                style={{ width: '100%', marginTop: 6 }}
              />
            </label>}
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
        okButtonProps={{ disabled: !checkoutSummary?.canCheckout || checkoutBlockers.length > 0 }}
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
                { title: 'Task status', dataIndex: 'status', key: 'status', render: (value: number | string) => <Tag color={isTaskCompleted(value) ? 'green' : isCheckoutExemptItem(value) ? 'default' : 'gold'}>{taskStatusName(value)}</Tag> },
                { title: 'Room', dataIndex: 'roomName', key: 'room', render: (value: string) => value || '—' },
                { title: 'Staff', dataIndex: 'staffName', key: 'staff', render: (value: string) => value || '—' },
                { title: 'Amount', dataIndex: 'assignedPrice', key: 'amount', render: (value: number) => money(value) },
              ]}
              scroll={{ x: 500 }}
            />
            {checkoutBlockers.length > 0 && (
              <Alert
                type="warning"
                showIcon
                message="Checkout is unavailable until every active task is assigned and completed."
                description={<ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>{checkoutBlockers.map((reason) => <li key={reason}>{reason}</li>)}</ul>}
                style={{ marginTop: 12 }}
              />
            )}
            {!checkoutSummary.canCheckout && <Text type="danger">This booking cannot be checked out.</Text>}
            <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              <label>Payment method
                <Select value={paymentMethod} onChange={setPaymentMethod} style={{ width: '100%' }} options={[{ value: 'CASH', label: 'Cash' }, { value: 'BANK_TRANSFER', label: 'Bank transfer' }]} />
              </label>
              {(checkoutSummary.remainingAmount ?? 0) > 0 ? (
                <label>Amount to collect (leave empty to collect remaining balance)
                  <InputNumber min={1} max={checkoutSummary.remainingAmount} value={amount} onChange={setAmount} style={{ width: '100%' }} />
                </label>
              ) : (
                <Text type="success">This booking is fully paid. Complete checkout without collecting additional payment.</Text>
              )}
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
