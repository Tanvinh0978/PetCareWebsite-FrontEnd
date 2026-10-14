import axiosClient from './axiosClient';

const VNPAY_BOOKING_IDS_KEY = 'petcare.vnpay.pending-booking-ids';

const readPendingVnpayBookingIds = (): string[] => {
  try {
    const ids = JSON.parse(localStorage.getItem(VNPAY_BOOKING_IDS_KEY) || '[]');
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

export const rememberVnpayBooking = (bookingId: string) => {
  if (!bookingId || typeof localStorage === 'undefined') return;
  try {
    const ids = new Set(readPendingVnpayBookingIds());
    ids.add(bookingId);
    localStorage.setItem(VNPAY_BOOKING_IDS_KEY, JSON.stringify([...ids]));
  } catch {
    // Keep booking creation working even if browser storage is unavailable.
  }
};

export const hasRememberedVnpayChoice = (bookingId: string) =>
  readPendingVnpayBookingIds().includes(bookingId);

export const forgetVnpayBooking = (bookingId?: string) => {
  if (typeof localStorage === 'undefined') return;
  try {
    if (!bookingId) {
      localStorage.removeItem(VNPAY_BOOKING_IDS_KEY);
      return;
    }
    localStorage.setItem(VNPAY_BOOKING_IDS_KEY, JSON.stringify(readPendingVnpayBookingIds().filter((id) => id !== bookingId)));
  } catch {
    // Best effort cleanup only.
  }
};

export interface BookingItemPayload {
  petId: string;
  serviceId: string;
  scheduledStartAt: string;
  scheduledEndAt?: string | null;
  quantity: number;
}

export interface CreateBookingPayload {
  customerId?: string;
  voucherCode?: string;
  paymentChoice?: string;
  bookingItems: BookingItemPayload[];
}

export interface BookingListItem {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  itemsCount: number;
  totalPrice: number;
  status: number | string; // 0: Pending, 1: Partially_Completed, 2: Completed, 3: Cancelled
  paymentChoice?: string;
  createdAt: string;
  bookingType?: 'Grooming' | 'Boarding' | string;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  serviceNames?: string[];
}

export interface BookingDetailItem {
  id: string;
  petId: string;
  petName: string;
  petSpecies: number | string;
  petWeight: number;
  serviceId: string;
  serviceName: string;
  serviceType: number | string;
  scheduledStartAt: string;
  scheduledEndAt?: string | null;
  quantity: number;
  unitPrice: number;
  assignedPrice: number;
  status: number | string;
  roomId?: string;
  roomName?: string;
  staffId?: string;
  staffName?: string;
  resultNote?: string;
  resultImageUrl?: string;
}

export interface BookingDetail {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  voucherId?: string;
  voucherCode?: string;
  discountAmount: number;
  totalPrice: number;
  status: number | string;
  paymentChoice?: string;
  cancellationReason?: string;
  createdAt: string;
  bookingItems: BookingDetailItem[];
}

export interface CheckoutSummaryItem {
  itemId: string;
  petId: string;
  petName: string;
  serviceId: string;
  serviceName: string;
  serviceType: number | string;
  roomId?: string | null;
  roomName?: string | null;
  staffId?: string | null;
  staffName?: string | null;
  quantity: number;
  unitPrice: number;
  assignedPrice: number;
  status: number | string;
  scheduledStartAt: string;
  scheduledEndAt?: string | null;
}

export interface CheckoutSummary {
  bookingId: string;
  bookingStatus: number | string;
  bookingCreatedAt: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: CheckoutSummaryItem[];
  subTotal: number;
  voucherCode?: string | null;
  discountAmount: number;
  totalPrice: number;
  totalPaid: number;
  remainingAmount: number;
  paymentStatus: string;
  canCheckout: boolean;
}

export interface CheckoutPayload {
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  amount: number | null;
  note?: string;
}

export interface BookingSearchParams {
  keyword?: string;
  status?: number;
  date?: string;
  pageNumber: number;
  pageSize: number;
}

export interface PagedBookings {
  items: BookingListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export const bookingService = {
  create: (payload: CreateBookingPayload) =>
    axiosClient.post<any, any>('/api/bookings', payload),

  fetchMyBookings: async (params?: {
    pageNumber?: number;
    pageSize?: number;
    status?: number | string;
    serviceDate?: string;
    serviceType?: number;
  }): Promise<PagedBookings> => {
    const res: any = await axiosClient.get('/api/bookings/my-bookings', { params });
    const paged = res?.result ?? res?.data ?? res;
    return {
      items: paged?.items ?? [],
      totalCount: paged?.totalCount ?? 0,
      pageNumber: paged?.pageNumber ?? 1,
      pageSize: paged?.pageSize ?? 10,
    };
  },

  fetchById: async (id: string): Promise<BookingDetail> => {
    const res: any = await axiosClient.get(`/api/bookings/${id}`);
    return res?.result ?? res?.data ?? res;
  },

  search: async (params: BookingSearchParams): Promise<PagedBookings> => {
    const res: any = await axiosClient.get('/api/bookings/search', { params });
    const paged = res?.result ?? res?.data?.result ?? res?.data ?? res;
    return {
      items: paged?.items ?? [],
      totalCount: paged?.totalCount ?? 0,
      pageNumber: paged?.pageNumber ?? params.pageNumber,
      pageSize: paged?.pageSize ?? params.pageSize,
    };
  },

  checkIn: (id: string) =>
    axiosClient.put(`/api/bookings/${id}/check-in`, {}),

  assignItem: (bookingId: string, itemId: string, payload: { staffId?: string; roomId?: string }) =>
    axiosClient.put(`/api/bookings/${bookingId}/items/${itemId}/status`, payload),

  getCheckoutSummary: async (id: string): Promise<any> => {
    const res: any = await axiosClient.get(`/api/bookings/${id}/checkout-summary`);
    return res?.result ?? res?.data?.result ?? res?.data ?? res;
  },

  checkout: (id: string, payload: CheckoutPayload) =>
    axiosClient.post(`/api/bookings/${id}/checkout`, payload),

  cancelBooking: async (id: string, cancellationReason = 'Customer requested cancellation'): Promise<any> => {
    return axiosClient.put(`/api/bookings/${id}/cancel`, { cancellationReason });
  },

  createVnpayUrl: async (bookingId: string): Promise<any> => {
    return axiosClient.post(`/api/bookings/${bookingId}/create-vnpay-url`, {});
  },

  verifyVnpayPayment: async (queryString: string): Promise<any> => {
    const qs = queryString ? (queryString.startsWith('?') ? queryString : `?${queryString}`) : '';
    return axiosClient.get(`/api/payments/vnpay-return${qs}`);
  },

  searchBookings: async (params?: {
    keyword?: string;
    status?: number | string;
    dateFrom?: string;
    dateTo?: string;
    serviceDate?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PagedBookings> => {
    const res: any = await axiosClient.get('/api/bookings/search', { params });
    const paged = res?.result ?? res?.data ?? res;
    return {
      items: paged?.items ?? [],
      totalCount: paged?.totalCount ?? 0,
      pageNumber: paged?.pageNumber ?? 1,
      pageSize: paged?.pageSize ?? 10,
    };
  },

  updateBookingStatus: async (id: string, payload: number | { status: number }): Promise<any> => {
    const body = typeof payload === 'number' ? { status: payload } : payload;
    return axiosClient.put(`/api/bookings/${id}/status`, body);
  },

  checkInBooking: async (id: string): Promise<any> => {
    return axiosClient.put(`/api/bookings/${id}/check-in`);
  },

  checkoutBooking: async (
    id: string,
    payload: { paymentMethod: string; amount?: number; transactionCode?: string; note?: string }
  ): Promise<any> => {
    return axiosClient.post(`/api/bookings/${id}/checkout`, payload);
  },
};
