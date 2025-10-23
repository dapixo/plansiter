export type bookingStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  clientId: string;
  sitterId: string;
  serviceId: string;
  subjectId: string;
  startDate: Date;
  endDate: Date;
  isCancelled: boolean;
  totalPrice?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
