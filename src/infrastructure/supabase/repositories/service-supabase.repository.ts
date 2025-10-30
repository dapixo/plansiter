import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Service } from '@domain/entities';
import { CareType } from '@domain/entities/user-preferences.entity';
import { IServiceRepository } from '@domain/repositories';
import { SupabaseService } from '../supabase.client';
import { BaseSupabaseRepository } from './base-supabase.repository';

type ServiceRow = {
  id: string;
  user_id: string;
  name: string;
  type: CareType;
  description: string | null;
  price_per_visit: number | null;
  price_per_day: number | null;
  price_per_night: number | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class ServiceSupabaseRepository extends BaseSupabaseRepository implements IServiceRepository {
  private supabase = inject(SupabaseService);

  // ---------- PUBLIC METHODS ---------- //

  getById(id: string, userId: string): Observable<Service | null> {
    return this.queryOne(q => q.eq('id', id).eq('user_id', userId).is('deleted_at', null));
  }

  getByUserId(userId: string): Observable<Service[]> {
    return this.queryMany(q =>
      q.eq('user_id', userId)
        .is('deleted_at', null)
        .order('name', { ascending: true })
    );
  }

  create(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Observable<Service> {
    const payload = this.toDbPayload(service);

    return this.supabase.from$('services', q => q.insert(payload).select().single()).pipe(
      map(res => this.extractData<ServiceRow>(res, true)),
      map(row => this.mapToEntity(row))
    );
  }

  update(id: string, userId: string, service: Partial<Service>): Observable<Service> {
    const payload = this.toDbPayload(service, true);

    return this.supabase.from$('services', q => q.update(payload).eq('id', id).eq('user_id', userId).select().single()).pipe(
      map(res => this.extractData<ServiceRow>(res, true)),
      map(row => this.mapToEntity(row))
    );
  }

  /**
   * Soft delete: marquer le service comme supprimé sans le retirer de la base de données.
   * Cela préserve l'intégrité historique des bookings.
   */
  delete(id: string, userId: string): Observable<void> {
    return this.update(id, userId, { deletedAt: new Date() }).pipe(
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

  /** Map Supabase row → domain entity */
  private mapToEntity(row: ServiceRow): Service {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      type: row.type,
      description: row.description ?? '',
      pricePerVisit: row.price_per_visit ?? 0,
      pricePerDay: row.price_per_day ?? 0,
      pricePerNight: row.price_per_night ?? 0,
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
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
    if (!partial || service.pricePerVisit !== undefined) payload.price_per_visit = service.pricePerVisit ?? null;
    if (!partial || service.pricePerDay !== undefined) payload.price_per_day = service.pricePerDay ?? null;
    if (!partial || service.pricePerNight !== undefined) payload.price_per_night = service.pricePerNight ?? null;
    if (!partial || service.deletedAt !== undefined) payload.deleted_at = service.deletedAt?.toISOString() ?? null;
    return payload;
  }
}
