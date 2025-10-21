export type ServiceType = 'pet-sitting' | 'plant-sitting' | 'babysitting' | 'house-sitting' | 'other';

export interface Service {
  id: string;
  userId: string;
  name: string;
  type: ServiceType;
  description?: string;
  pricePerHour?: number;
  pricePerDay?: number;
  pricePerNight?: number;
  isActive: boolean;
  deletedAt?: Date; // null/undefined = active, Date = soft-deleted
  createdAt: Date;
  updatedAt: Date;
}
