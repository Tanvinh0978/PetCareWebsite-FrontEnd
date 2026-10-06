export interface CustomerDTO {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  isActive: boolean;
  createdAt: string;
  totalPets: number;
}

export interface CustomerDetailDTO {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCustomerDTO {
  email: string;
  password?: string;
  fullName: string;
  phoneNumber: string;
  address?: string;
}

export interface UpdateCustomerDTO {
  id: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
}
