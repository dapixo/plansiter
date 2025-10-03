export type BookingStatus = 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  clientId: string;
  sitterId: string;
  serviceId: string;
  subjectId: string;
  startDate: Date;
  endDate: Date;
  status: BookingStatus;
  totalPrice?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
