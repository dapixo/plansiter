export type CareType = 'pet' | 'plant' | 'child' | 'house' | 'other';

export interface UserPreferences {
  id: string;
  userId: string;
  careTypes?: CareType[];
  createdAt?: Date;
  updatedAt?: Date;
}
