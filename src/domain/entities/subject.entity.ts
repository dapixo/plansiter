export type SubjectType = 'pet' | 'plant' | 'child' | 'house' | 'other';

export interface Subject {
  id: string;
  clientId: string;
  type: SubjectType;
  name: string;
  breed?: string;
  age?: number;
  specialNeeds?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
