import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Service, ServiceType } from '@domain/entities';
import { IServiceRepository } from '@domain/repositories';
import { SupabaseService } from '../supabase.client';

type ServiceRow = {
  id: string;
  user_id: string;
  name: string;
  type: ServiceType;
  description: string | null;
  price_per_hour: number | null;
  price_per_day: number | null;
  price_per_night: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class ServiceSupabaseRepository implements IServiceRepository {
  private supabase = inject(SupabaseService);

  // ---------- PUBLIC METHODS ---------- //

  getById(id: string): Observable<Service | null> {
    return this.queryOne(q => q.eq('id', id));
  }

  getByUserId(userId: string): Observable<Service[]> {
    return this.queryMany(q => q.eq('user_id', userId).order('name', { ascending: true }));
  }

  getAll(): Observable<Service[]> {
    return this.queryMany(q => q.order('name', { ascending: true }));
  }

  create(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Observable<Service> {
    const payload = this.toDbPayload(service);

    return this.supabase.from$('services', q => q.insert(payload).select().single()).pipe(
      map(res => this.extractData<ServiceRow>(res, true)),
      map(row => this.mapToEntity(row))
    );
  }

  update(id: string, service: Partial<Service>): Observable<Service> {
    const payload = this.toDbPayload(service, true);

    return this.supabase.from$('services', q => q.update(payload).eq('id', id).select().single()).pipe(
      map(res => this.extractData<ServiceRow>(res, true)),
      map(row => this.mapToEntity(row))
    );
  }

  delete(id: string): Observable<void> {
    return this.supabase.from$('services', q => q.delete().eq('id', id)).pipe(
      map(res => this.extractData(res, false)),
      map(() => void 0)
    );
  }

  // ---------- PRIVATE HELPERS ---------- //

  /** Query returning a single service */
  private queryOne(
    builder: (q: any) => any
  ): Observable<Service | null> {
    return this.supabase.from$('services', q => builder(q.select('*').single())).pipe(
      map(res => this.extractData<ServiceRow | null>(res, false)),
      map(row => (row ? this.mapToEntity(row) : null))
    );
  }

  /** Query returning multiple services */
  private queryMany(
    builder: (q: any) => any
  ): Observable<Service[]> {
    return this.supabase.from$('services', q => builder(q.select('*'))).pipe(
      map(res => this.extractData<ServiceRow[]>(res, false)),
      map(rows => rows.map(r => this.mapToEntity(r)))
    );
  }

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
  private mapToEntity(row: ServiceRow): Service {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      type: row.type,
      description: row.description ?? '',
      pricePerHour: row.price_per_hour ?? 0,
      pricePerDay: row.price_per_day ?? 0,
      pricePerNight: row.price_per_night ?? 0,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /** Map entity → Supabase insert/update payload */
  private toDbPayload(service: Partial<Service>, partial = false): Partial<ServiceRow> {
    const payload: Partial<ServiceRow> = {};
    if (!partial || service.userId !== undefined) payload.user_id = service.userId!;
    if (!partial || service.name !== undefined) payload.name = service.name!;
    if (!partial || service.type !== undefined) payload.type = service.type!;
    if (!partial || service.description !== undefined) payload.description = service.description ?? null;
    if (!partial || service.pricePerHour !== undefined) payload.price_per_hour = service.pricePerHour ?? null;
    if (!partial || service.pricePerDay !== undefined) payload.price_per_day = service.pricePerDay ?? null;
    if (!partial || service.pricePerNight !== undefined) payload.price_per_night = service.pricePerNight ?? null;
    if (!partial || service.isActive !== undefined) payload.is_active = service.isActive ?? false;
    return payload;
  }
}
