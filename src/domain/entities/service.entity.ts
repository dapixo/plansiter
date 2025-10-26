import { CareType } from './user-preferences.entity';

export type PriceType = 'per-visit' | 'per-day' | 'per-night';

export interface Service {
  id: string;
  userId: string;
  name: string;
  type: CareType;
  description?: string;
  pricePerVisit?: number;
  pricePerDay?: number;
  pricePerNight?: number;
  isActive: boolean;
  deletedAt?: Date; // null/undefined = active, Date = soft-deleted
  createdAt: Date;
  updatedAt: Date;
}
