import axiosClient from './axiosClient';

export const petService = {
  getAllPets: async () => {
    // Note: The backend doesn't have a GetMyPets endpoint, so we fetch all and filter on frontend
    return axiosClient.get<any, IBackendRes<IPagedResult<any>>>('/Pets?PageSize=100');
  },
  getPetById: async (id: string) => {
    return axiosClient.get<any, IBackendRes<any>>(`/Pets/${id}`);
  },
  createPet: async (data: any) => {
    return axiosClient.post<any, IBackendRes<string>>('/Pets', data);
  },
  updatePet: async (id: string, data: any) => {
    return axiosClient.put<any, IBackendRes<string>>(`/Pets/${id}`, data);
  },
  deletePet: async (id: string) => {
    return axiosClient.delete<any, IBackendRes<string>>(`/Pets/${id}`);
  },
};