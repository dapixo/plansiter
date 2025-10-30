import { CareType } from './user-preferences.entity';

export interface Service {
  id: string;
  userId: string;
  name: string;
  type: CareType;
  description?: string;
  price: number;
  deletedAt?: Date; // null/undefined = active, Date = soft-deleted
  createdAt: Date;
  updatedAt: Date;
}
