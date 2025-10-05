import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Booking } from '@domain/entities';
import { IBookingRepository } from '@domain/repositories';
import { SupabaseService } from '../supabase.client';

@Injectable({
  providedIn: 'root'
})
export class BookingSupabaseRepository implements IBookingRepository {
  constructor(private supabase: SupabaseService) {}

  getById(id: string, userId: string): Observable<Booking | null> {
    // TODO: Implement with userId verification via client/sitter relationship
    throw new Error('Method not implemented');
  }

  getByClientId(clientId: string, userId: string): Observable<Booking[]> {
    // TODO: Implement with userId verification via client ownership
    throw new Error('Method not implemented');
  }

  getBySitterId(sitterId: string): Observable<Booking[]> {
    // Already filtered by sitterId (which is userId for sitters)
    throw new Error('Method not implemented');
  }

  create(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Observable<Booking> {
    // TODO: Implement Supabase insert
    throw new Error('Method not implemented');
  }

  update(id: string, userId: string, booking: Partial<Booking>): Observable<Booking> {
    // TODO: Implement with userId verification
    throw new Error('Method not implemented');
  }

  delete(id: string, userId: string): Observable<void> {
    // TODO: Implement with userId verification
    throw new Error('Method not implemented');
  }
}
