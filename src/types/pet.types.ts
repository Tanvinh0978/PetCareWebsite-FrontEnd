export interface IPet {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  gender: string;
  notes?: string;
  imageUrl?: string;
  customerId?: number;
}
