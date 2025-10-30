export type CareType = 'pet' | 'plant' | 'child' | 'house' | 'other';

export interface UserPreferences {
  id: string;
  userId: string;
  careTypes: CareType[];
  isOnboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}
