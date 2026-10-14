export interface RevenueStats {
  todayRevenue: number
  thisMonthRevenue: number
  totalRevenue: number
}

export interface BookingStats {
  totalBookings: number
  todayBookings: number
  pendingBookings: number
  confirmedBookings: number
  completedBookings: number
  cancelledBookings: number
}

export interface RoomStats {
  totalRooms: number
  occupiedRooms: number
  availableRooms: number
  maintenanceRooms: number
  occupancyRate: number
}

export interface TodayOperations {
  todayCheckIns: number
  todayCheckOuts: number
  todayGroomingPending: number
  todayGroomingInProgress: number
  todayGroomingCompleted: number
  activeBoardingGuests: number
}

export interface CustomerStats {
  totalCustomers: number
  totalPets: number
}

export interface DailyRevenueTrend {
  date: string
  dateLabel: string
  revenue: number
  bookingCount: number
}

export interface RecentBookingItem {
  id: string
  customerName: string
  customerPhone: string
  petNames: string[]
  totalPrice: number
  status: number | string
  statusName?: string
  createdAt: string
  itemsCount: number
}

export interface DashboardStatsResponse {
  revenue: RevenueStats
  bookings: BookingStats
  rooms: RoomStats
  operations: TodayOperations
  customers: CustomerStats
  revenueTrend: DailyRevenueTrend[]
  recentBookings: RecentBookingItem[]
}
