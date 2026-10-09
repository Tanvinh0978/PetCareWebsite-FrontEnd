import axiosClient from './axiosClient';

export const petService = {
  getAllPets: async () => {
    // Note: The backend doesn't have a GetMyPets endpoint, so we fetch all and filter on frontend
    return axiosClient.get<any, any>('/api/Pets?PageSize=100');
  },
  getPetById: async (id: string) => {
    return axiosClient.get<any, any>(`/api/Pets/${id}`);
  },
  createPet: async (data: any) => {
    return axiosClient.post<any, any>('/api/Pets', data);
  },
  updatePet: async (id: string, data: any) => {
    return axiosClient.put<any, any>(`/api/Pets/${id}`, data);
  },
  deletePet: async (id: string) => {
    return axiosClient.delete<any, any>(`/api/Pets/${id}`);
  },
};