import axiosClient from './axiosClient';
import { IPet } from '../types/pet.types';

export const petService = {
  getMyPets: async () => {
    return axiosClient.get<IBackendRes<IPet[]>>('/pets/my-pets');
  },
  createPet: async (data: Omit<IPet, 'id'>) => {
    return axiosClient.post<IBackendRes<IPet>>('/pets', data);
  },
  updatePet: async (id: number, data: Partial<IPet>) => {
    return axiosClient.put<IBackendRes<IPet>>(/pets/, data);
  },
  deletePet: async (id: number) => {
    return axiosClient.delete<IBackendRes<boolean>>(/pets/);
  },
};