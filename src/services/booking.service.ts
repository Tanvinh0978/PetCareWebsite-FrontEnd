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
  bookingItems: BookingItemPayload[];
}

export const bookingService = {
  create: (payload: CreateBookingPayload) =>
    axiosClient.post<IBackendRes<string>, IBackendRes<string>>('/api/bookings', payload),
};
