import { petService } from '@/services/pet.service'
import type { PetDTO, CreatePetDTO, UpdatePetDTO, PetQueryParams } from '@/types/pet.types'

export const getPetList = (params?: PetQueryParams) => petService.fetchWithPagination(params)
export const getPetById = (id: string) => petService.fetchById(id)
export const getPetsByCustomerId = (customerId: string) => petService.fetchByCustomerId(customerId)
export const createPet = (data: CreatePetDTO) => petService.create(data)
export const updatePet = (id: string, data: UpdatePetDTO) => petService.update(id, data)
export const deletePet = (id: string) => petService.delete(id)
