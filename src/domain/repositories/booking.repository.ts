import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Booking } from '../entities';

export interface IBookingRepository {
  getById(id: string): Observable<Booking | null>;
  getByClientId(clientId: string): Observable<Booking[]>;
  getBySitterId(sitterId: string): Observable<Booking[]>;
  getAll(): Observable<Booking[]>;
  create(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Observable<Booking>;
  update(id: string, booking: Partial<Booking>): Observable<Booking>;
  delete(id: string): Observable<void>;
}

export const BOOKING_REPOSITORY = new InjectionToken<IBookingRepository>('IBookingRepository');
