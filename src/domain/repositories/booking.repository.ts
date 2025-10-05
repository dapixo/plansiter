import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Booking } from '../entities';

export interface IBookingRepository {
  getById(id: string, userId: string): Observable<Booking | null>;
  getByClientId(clientId: string, userId: string): Observable<Booking[]>;
  getBySitterId(sitterId: string): Observable<Booking[]>;
  create(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Observable<Booking>;
  update(id: string, userId: string, booking: Partial<Booking>): Observable<Booking>;
  delete(id: string, userId: string): Observable<void>;
}

export const BOOKING_REPOSITORY = new InjectionToken<IBookingRepository>('IBookingRepository');
