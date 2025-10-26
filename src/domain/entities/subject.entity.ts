import { CareType } from './user-preferences.entity';

export interface Subject {
  id: string;
  clientId: string;
  type: CareType;
  name: string;
  breed?: string;
  age?: number;
  specialNeeds?: string;
  notes?: string;
  deletedAt?: Date; // null/undefined = active, Date = soft-deleted
  createdAt: Date;
  updatedAt: Date;
}
