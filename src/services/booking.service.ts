import axiosClient from './axiosClient';

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
  itemsCount: number;
  totalPrice: number;
  status: number | string; // 0: Pending, 1: Partially_Completed, 2: Completed, 3: Cancelled
  createdAt: string;
}

export interface BookingDetailItem {
  id: string;
  petId: string;
  petName: string;
  petSpecies: number;
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
  cancellationReason?: string;
  createdAt: string;
  bookingItems: BookingDetailItem[];
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

  fetchMyBookings: async (params?: { pageNumber?: number; pageSize?: number; status?: number | string }): Promise<PagedBookings> => {
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

  cancelBooking: async (id: string, cancellationReason = 'Customer requested cancellation'): Promise<any> => {
    return axiosClient.put(`/api/bookings/${id}/cancel`, { cancellationReason });
  },
};
