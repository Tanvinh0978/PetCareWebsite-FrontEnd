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
  fetchWithPagination: (params: {
    pageNumber?: number
    pageSize?: number
    roomTypeId?: string
    status?: string
    searchTerm?: string
  }) => {
    return get<IPagedResult<RoomDTO>>('/api/rooms', params)
  },

  fetchById: (id: string) => {
    return get<RoomDTO>(`/api/rooms/${id}`)
  },

  create: (data: { roomName: string; roomTypeId: string; status?: string }) => {
    return axiosClient.post<IBackendRes<string>, IBackendRes<string>>('/api/rooms', data)
  },

  update: (id: string, data: { roomName: string; roomTypeId: string }) => {
    return axiosClient.put<IBackendRes<string>, IBackendRes<string>>(`/api/rooms/${id}`, data)
  },

  updateStatus: (id: string, status: string) => {
    return axiosClient.patch<IBackendRes<string>, IBackendRes<string>>(`/api/rooms/${id}/status`, { status })
  },

  checkAvailability: (params: {
    serviceId?: string
    roomTypeId?: string
    month?: number
    year?: number
    startDate?: string
    endDate?: string
  }) => {
    return get<any>('/api/rooms/check-availability', params)
  },

  delete: (id: string) => {
    return axiosClient.delete<IBackendRes<string>, IBackendRes<string>>(`/api/rooms/${id}`)
  }
}
