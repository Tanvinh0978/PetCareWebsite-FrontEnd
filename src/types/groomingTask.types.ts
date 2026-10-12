export enum BookingItemStatus {
  Pending = 0,
  Confirmed = 1,
  CheckedIn = 2,
  InProgress = 3,
  Completed = 4,
  Cancelled = 5,
  NoShow = 6,
}

export enum PetSpecies {
  Dog = 0,
  Cat = 1,
  Bird = 2,
  Rabbit = 3,
  Other = 4,
}

export interface GroomingTaskResponseDTO {
  bookingId: string
  itemId: string
  customerId: string
  customerName: string
  customerPhone: string
  petId: string
  petName: string
  petSpecies: number // 0: Dog, 1: Cat
  petBreed?: string | null
  petWeight: number
  petHealthNotes?: string | null
  serviceId: string
  serviceName: string
  serviceType: number // 0: Grooming
  roomId?: string | null
  roomName?: string | null
  scheduledStartAt: string
  scheduledEndAt?: string | null
  durationMinutes: number
  status: number // 2: CheckedIn, 3: InProgress, 4: Completed
  resultNote?: string | null
  beforeImageUrl?: string | null
  resultImageUrl?: string | null
}

export interface GetGroomingTasksParams {
  date?: string // YYYY-MM-DD
  status?: number
  pageNumber?: number
  pageSize?: number
}

export interface UpdateGroomingTaskStatusPayload {
  status: number
  resultNote?: string | null
  beforeImageUrl?: string | null
  resultImageUrl?: string | null
  staffId?: string | null
  roomId?: string | null
}
