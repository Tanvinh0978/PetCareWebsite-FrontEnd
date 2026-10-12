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
  status: number | string // Can be number (2, 3, 4) or string ('Checked_In', 'In_Progress', 'Completed')
  resultNote?: string | null
  beforeImageUrl?: string | null
  resultImageUrl?: string | null
}

export const normalizeStatus = (status: any): number => {
  if (typeof status === 'number') return status
  if (typeof status === 'string') {
    const s = status.toLowerCase().trim()
    if (s === 'pending' || s === '0') return 0
    if (s === 'confirmed' || s === '1') return 1
    if (s === 'checked_in' || s === 'checkedin' || s === '2') return 2
    if (s === 'in_progress' || s === 'inprogress' || s === '3') return 3
    if (s === 'completed' || s === '4') return 4
    if (s === 'cancelled' || s === 'canceled' || s === '5') return 5
    if (s === 'no_show' || s === 'noshow' || s === '6') return 6
  }
  return Number(status) || 0
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
