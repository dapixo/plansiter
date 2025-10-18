import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Booking, BookingStatus } from '@domain/entities';
import { IBookingRepository } from '@domain/repositories';
import { SupabaseService } from '../supabase.client';

type BookingRow = {
  id: string;
  client_id: string;
  sitter_id: string;
  service_id: string;
  subject_id: string;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  total_price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable({
  providedIn: 'root'
})
export class BookingSupabaseRepository implements IBookingRepository {
  private supabase = inject(SupabaseService);

  // ---------- PUBLIC METHODS ---------- //

  getById(id: string, userId: string): Observable<Booking | null> {
    // Vérifier que l'utilisateur est soit le client soit le sitter
    return this.supabase.from$('bookings', q =>
      q.select('*, clients!inner(user_id)')
        .eq('id', id)
        .or(`sitter_id.eq.${userId},clients.user_id.eq.${userId}`)
        .single()
    ).pipe(
      map(res => this.extractData<BookingRow | null>(res, false)),
      map(row => (row ? this.mapToEntity(row) : null))
    );
  }

  getByClientId(clientId: string, userId: string): Observable<Booking[]> {
    // Vérifier la propriété via JOIN avec clients
    return this.supabase.from$('bookings', q =>
      q.select('*, clients!inner(user_id)')
        .eq('client_id', clientId)
        .eq('clients.user_id', userId)
    ).pipe(
      map(res => this.extractData<BookingRow[]>(res, false)),
      map(rows => rows.map(row => this.mapToEntity(row)))
    );
  }

  getBySitterId(sitterId: string): Observable<Booking[]> {
    return this.supabase.from$('bookings', q =>
      q.select('*')
        .eq('sitter_id', sitterId)
        .order('start_date', { ascending: false })
    ).pipe(
      map(res => this.extractData<BookingRow[]>(res, false)),
      map(rows => rows.map(row => this.mapToEntity(row)))
    );
  }

  create(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Observable<Booking> {
    const payload = this.toDbPayload(booking);

    return this.supabase.from$('bookings', q => q.insert(payload).select().single()).pipe(
      map(res => this.extractData<BookingRow>(res, true)),
      map(row => this.mapToEntity(row))
    );
  }

  update(id: string, _userId: string, booking: Partial<Booking>): Observable<Booking> {
    const payload = this.toDbPayload(booking, true);

    // Note: userId n'est pas utilisé explicitement car RLS (Row Level Security)
    // s'occupe de la vérification
    return this.supabase.from$('bookings', q =>
      q.update(payload)
        .eq('id', id)
        .select('*')
        .single()
    ).pipe(
      map(res => this.extractData<BookingRow>(res, true)),
      map(row => this.mapToEntity(row))
    );
  }

  delete(id: string, _userId: string): Observable<void> {
    // Note: userId n'est pas utilisé explicitement car RLS (Row Level Security)
    // s'occupe de la vérification
    return this.supabase.from$('bookings', q =>
      q.delete()
        .eq('id', id)
    ).pipe(
      map(res => this.extractData(res, false)),
      map(() => void 0)
    );
  }

  // ---------- PRIVATE HELPERS ---------- //

  /** Generic Supabase response handler */
  private extractData<T>(response: any, strict = true): T {
    if (response.error) {
      console.error('Supabase error:', response.error);
      if (strict) throw response.error;
      return Array.isArray(response.data) ? [] as any : null as any;
    }
    return response.data;
  }

  /** Map Supabase row → domain entity */
  private mapToEntity(row: BookingRow): Booking {
    return {
      id: row.id,
      clientId: row.client_id,
      sitterId: row.sitter_id,
      serviceId: row.service_id,
      subjectId: row.subject_id,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      status: row.status,
      totalPrice: row.total_price ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /** Map entity → Supabase insert/update payload */
  private toDbPayload(booking: Partial<Booking>, partial = false): Partial<BookingRow> {
    const payload: Partial<BookingRow> = {};
    if (!partial || booking.clientId !== undefined) payload.client_id = booking.clientId!;
    if (!partial || booking.sitterId !== undefined) payload.sitter_id = booking.sitterId!;
    if (!partial || booking.serviceId !== undefined) payload.service_id = booking.serviceId!;
    if (!partial || booking.subjectId !== undefined) payload.subject_id = booking.subjectId!;
    if (!partial || booking.startDate !== undefined) payload.start_date = booking.startDate!.toISOString();
    if (!partial || booking.endDate !== undefined) payload.end_date = booking.endDate!.toISOString();
    if (!partial || booking.status !== undefined) payload.status = booking.status!;
    if (!partial || booking.totalPrice !== undefined) payload.total_price = booking.totalPrice ?? null;
    if (!partial || booking.notes !== undefined) payload.notes = booking.notes ?? null;
    return payload;
  }
}
