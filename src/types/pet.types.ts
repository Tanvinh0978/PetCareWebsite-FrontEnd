export enum PetSpecies {
  Dog = 0,
  Cat = 1,
}

export function isCat(species: unknown): boolean {
  if (species === 1 || species === '1') return true
  if (typeof species === 'string' && species.toLowerCase() === 'cat') return true
  return false
}

export function getPetSpeciesLabel(species: unknown): 'Dog' | 'Cat' {
  return isCat(species) ? 'Cat' : 'Dog'
}

export function getPetSpeciesIcon(species: unknown): '🐶' | '🐱' {
  return isCat(species) ? '🐱' : '🐶'
}

export const PetSpeciesText: Record<number | string, string> = {
  [PetSpecies.Dog]: 'Dog',
  [PetSpecies.Cat]: 'Cat',
  Dog: 'Dog',
  Cat: 'Cat',
  dog: 'Dog',
  cat: 'Cat',
}

export const PetSpeciesIcon: Record<number | string, string> = {
  [PetSpecies.Dog]: '🐶',
  [PetSpecies.Cat]: '🐱',
  Dog: '🐶',
  Cat: '🐱',
  dog: '🐶',
  cat: '🐱',
}

export interface PetDTO {
  id: string
  customerId: string
  ownerName?: string
  name: string
  species: string | number | PetSpecies
  breed?: string
  weight: number
  age?: number
  healthNotes?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreatePetDTO {
  customerId: string
  name: string
  species: string | number | PetSpecies
  breed?: string
  weight: number
  age?: number
  healthNotes?: string
}

export interface UpdatePetDTO {
  name: string
  species: string | number | PetSpecies
  breed?: string
  weight: number
  age?: number
  healthNotes?: string
}

export interface PetQueryParams {
  keyword?: string
  species?: string | number | PetSpecies
  pageIndex?: number
  pageSize?: number
  isActive?: boolean
}
