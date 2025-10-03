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

  getById(id: string): Observable<Booking | null> {
    // TODO: Implement Supabase query
    throw new Error('Method not implemented');
  }

  getByClientId(clientId: string): Observable<Booking[]> {
    // TODO: Implement Supabase query
    throw new Error('Method not implemented');
  }

  getBySitterId(sitterId: string): Observable<Booking[]> {
    // TODO: Implement Supabase query
    throw new Error('Method not implemented');
  }

  getAll(): Observable<Booking[]> {
    // TODO: Implement Supabase query
    throw new Error('Method not implemented');
  }

  create(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Observable<Booking> {
    // TODO: Implement Supabase insert
    throw new Error('Method not implemented');
  }

  update(id: string, booking: Partial<Booking>): Observable<Booking> {
    // TODO: Implement Supabase update
    throw new Error('Method not implemented');
  }

  delete(id: string): Observable<void> {
    // TODO: Implement Supabase delete
    throw new Error('Method not implemented');
  }
}
