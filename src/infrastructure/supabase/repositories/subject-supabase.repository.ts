import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Subject } from '@domain/entities';
import { CareType } from '@domain/entities/user-preferences.entity';
import { ISubjectRepository } from '@domain/repositories';
import { SupabaseService } from '../supabase.client';
import { BaseSupabaseRepository } from './base-supabase.repository';

type SubjectRow = {
  id: string;
  client_id: string;
  type: CareType;
  name: string;
  breed: string | null;
  age: number | null;
  special_needs: string | null;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class SubjectSupabaseRepository extends BaseSupabaseRepository implements ISubjectRepository {
  private supabase = inject(SupabaseService);

  // ---------- PUBLIC METHODS ---------- //

  getById(id: string, userId: string): Observable<Subject | null> {
    // Vérifier la propriété via JOIN avec clients et filtrer les deleted
    return this.supabase.from$('subjects', q =>
      q.select('*, clients!inner(user_id)')
        .eq('id', id)
        .eq('clients.user_id', userId)
        .is('deleted_at', null)
        .single()
    ).pipe(
      map(res => this.extractData<SubjectRow | null>(res, false)),
      map(row => (row ? this.mapToEntity(row) : null))
    );
  }

  getByClientId(clientId: string, userId: string): Observable<Subject[]> {
    // Vérifier la propriété via JOIN avec clients et filtrer les deleted
    return this.supabase.from$('subjects', q =>
      q.select('*, clients!inner(user_id)')
        .eq('client_id', clientId)
        .eq('clients.user_id', userId)
        .is('deleted_at', null)
    ).pipe(
      map(res => this.extractData<SubjectRow[]>(res, false)),
      map(rows => rows.map(row => this.mapToEntity(row)))
    );
  }

  create(subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>): Observable<Subject> {
    const payload = this.toDbPayload(subject);

    return this.supabase.from$('subjects', q => q.insert(payload).select().single()).pipe(
      map(res => this.extractData<SubjectRow>(res, true)),
      map(row => this.mapToEntity(row))
    );
  }

  update(id: string, _userId: string, subject: Partial<Subject>): Observable<Subject> {
    const payload = this.toDbPayload(subject, true);

    // Note: userId n'est pas utilisé explicitement car RLS (Row Level Security)
    // s'occupe de la vérification du userId via la relation client_id
    return this.supabase.from$('subjects', q =>
      q.update(payload)
        .eq('id', id)
        .select('*')
        .single()
    ).pipe(
      map(res => this.extractData<SubjectRow>(res, true)),
      map(row => this.mapToEntity(row))
    );
  }

  /**
   * Soft delete: marquer le subject comme supprimé sans le retirer de la base de données.
   * Cela préserve l'intégrité historique des bookings.
   */
  delete(id: string, _userId: string): Observable<Subject> {
    return this.update(id, _userId, { deletedAt: new Date() });
  }

  // ---------- PRIVATE HELPERS ---------- //

  /** Map Supabase row → domain entity */
  private mapToEntity(row: SubjectRow): Subject {
    return {
      id: row.id,
      clientId: row.client_id,
      type: row.type,
      name: row.name,
      breed: row.breed ?? undefined,
      age: row.age ?? undefined,
      specialNeeds: row.special_needs ?? undefined,
      notes: row.notes ?? undefined,
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /** Map entity → Supabase insert/update payload */
  private toDbPayload(subject: Partial<Subject>, partial = false): Partial<SubjectRow> {
    const payload: Partial<SubjectRow> = {};
    if (!partial || subject.clientId !== undefined) payload.client_id = subject.clientId!;
    if (!partial || subject.type !== undefined) payload.type = subject.type!;
    if (!partial || subject.name !== undefined) payload.name = subject.name!;
    if (!partial || subject.breed !== undefined) payload.breed = subject.breed ?? null;
    if (!partial || subject.age !== undefined) payload.age = subject.age ?? null;
    if (!partial || subject.specialNeeds !== undefined) payload.special_needs = subject.specialNeeds ?? null;
    if (!partial || subject.notes !== undefined) payload.notes = subject.notes ?? null;
    if (!partial || subject.deletedAt !== undefined) payload.deleted_at = subject.deletedAt?.toISOString() ?? null;
    return payload;
  }
}
