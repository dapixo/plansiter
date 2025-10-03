export type ServiceType = 'pet-sitting' | 'plant-sitting' | 'babysitting' | 'house-sitting' | 'other';

export interface Service {
  id: string;
  name: string;
  type: ServiceType;
  description?: string;
  pricePerHour?: number;
  pricePerDay?: number;
  pricePerNight?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
