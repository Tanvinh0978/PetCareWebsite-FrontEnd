import axiosClient from './axiosClient'

const get = <T>(url: string, params?: object) =>
  axiosClient.get<IBackendRes<T>, IBackendRes<T>>(url, { params })

export interface RoomDTO {
  id: string
  roomName: string
  roomTypeId: string
  roomTypeName: string
  status: 'Available' | 'Maintenance' | 'Occupied'
  createdAt: string
}

export const roomService = {
  // Get rooms with pagination and filters
  fetchWithPagination: (params: {
    pageNumber?: number
    pageSize?: number
    roomTypeId?: string
    status?: string
    searchTerm?: string
  }) => {
    return get<IPagedResult<RoomDTO>>('/api/rooms', params)
  },

  // Get single room by ID
  fetchById: (id: string) => {
    return get<RoomDTO>(`/api/rooms/${id}`)
  },

  // Create new room
  create: (data: { roomName: string; roomTypeId: string; status?: string }) => {
    return axiosClient.post<IBackendRes<string>, IBackendRes<string>>('/api/rooms', data)
  },

  // Update existing room details (name, type)
  update: (id: string, data: { roomName: string; roomTypeId: string }) => {
    return axiosClient.put<IBackendRes<string>, IBackendRes<string>>(`/api/rooms/${id}`, data)
  },

  // Update room status
  updateStatus: (id: string, status: string) => {
    return axiosClient.patch<IBackendRes<string>, IBackendRes<string>>(`/api/rooms/${id}/status`, { status })
  },

  // Check availability
  checkAvailability: (params: { serviceId?: string; month?: number; year?: number }) => {
    return get<any>('/api/rooms/check-availability', params)
  },

  // Delete room
  delete: (id: string) => {
    return axiosClient.delete<IBackendRes<string>, IBackendRes<string>>(`/api/rooms/${id}`)
  }
}
