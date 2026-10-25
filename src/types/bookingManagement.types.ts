export interface SearchBookingsParams {
  keyword?: string
  status?: number | string
  dateFrom?: string
  dateTo?: string
  serviceDate?: string
  pageNumber?: number
  pageSize?: number
}

export interface CheckoutItemSummaryDTO {
  itemId: string
  petId: string
  petName: string
  serviceId: string
  serviceName: string
  serviceType: number | string
  roomId?: string
  roomName?: string
  staffId?: string
  staffName?: string
  quantity: number
  unitPrice: number
  assignedPrice: number
  status: number | string
  scheduledStartAt: string
  scheduledEndAt?: string | null
  resultNote?: string | null
}

export interface PaymentTransactionDTO {
  id: string
  amount: number
  paymentMethod: string
  transactionCode?: string
  paymentType: string
  status: string
  note?: string
  createdAt: string
}

export interface CheckoutSummaryDTO {
  bookingId: string
  bookingStatus: number | string
  bookingCreatedAt: string
  customerId: string
  customerName: string
  customerPhone: string
  customerEmail: string
  items: CheckoutItemSummaryDTO[]
  subTotal: number
  voucherId?: string
  voucherCode?: string
  discountAmount: number
  originalTotalPrice?: number
  lateFee?: number
  lateHours?: number
  lateFeeReason?: string
  totalPrice: number
  totalPaid: number
  remainingAmount: number
  paymentStatus: string // "UNPAID" | "PARTIALLY_PAID" | "PAID"
  canCheckout: boolean
  restrictionReason?: string
  paymentHistory: PaymentTransactionDTO[]
}

export interface CheckoutBookingPayload {
  paymentMethod: string // "CASH" | "BANK_TRANSFER" | "CARD" | "VNPAY"
  amount?: number
  transactionCode?: string
  note?: string
}

export interface UpdateBookingStatusPayload {
  status: number // 1: Confirmed, 3: Cancelled, etc.
}
