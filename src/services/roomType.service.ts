import axiosClient from './axiosClient'

const get = <T>(url: string, params?: object) =>
  axiosClient.get<IBackendRes<T>, IBackendRes<T>>(url, { params })

export interface RoomTypeDTO {
  id: string
  name: string
  description?: string
  totalRooms: number
}

export interface RoomSummaryDTO {
  id: string
  name: string
  status: string
}

export interface RoomTypeDetailDTO extends RoomTypeDTO {
  rooms: RoomSummaryDTO[]
}

export const roomTypeService = {
  // Get all room types
  fetchAll: (searchTerm?: string) => {
    return get<RoomTypeDTO[]>('/api/roomtypes', searchTerm ? { searchTerm } : undefined)
  },

  // Get single room type by ID
  fetchById: (id: string) => {
    return get<RoomTypeDetailDTO>(`/api/roomtypes/${id}`)
  },

  // Create new room type
  create: (data: { name: string; description?: string }) => {
    return axiosClient.post<IBackendRes<string>, IBackendRes<string>>('/api/roomtypes', data)
  },

  // Update existing room type
  update: (id: string, data: { name: string; description?: string }) => {
    return axiosClient.put<IBackendRes<string>, IBackendRes<string>>(`/api/roomtypes/${id}`, data)
  },

  // Delete room type
  delete: (id: string) => {
    return axiosClient.delete<IBackendRes<string>, IBackendRes<string>>(`/api/roomtypes/${id}`)
  }
}
