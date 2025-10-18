import { Booking } from '@domain/entities';

export const BOOKING_STATUS_COLORS: Record<
  Booking['status'],
  { primary: string; secondary: string }
> = {
  pending: { primary: '#f59e0b', secondary: '#fef3c7' },      // amber-500 / amber-100
  confirmed: { primary: '#6366f1', secondary: '#e0e7ff' },    // indigo-500 / indigo-100
  'in-progress': { primary: '#a855f7', secondary: '#f3e8ff' }, // purple-500 / purple-100
  completed: { primary: '#10b981', secondary: '#d1fae5' },    // emerald-500 / emerald-100
  cancelled: { primary: '#ef4444', secondary: '#fee2e2' }     // red-500 / red-100
} as const;
