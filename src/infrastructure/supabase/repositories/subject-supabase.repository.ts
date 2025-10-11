import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Subject, SubjectType } from '@domain/entities';
import { ISubjectRepository } from '@domain/repositories';
import { SupabaseService } from '../supabase.client';

type SubjectRow = {
  id: string;
  client_id: string;
  type: SubjectType;
  name: string;
  breed: string | null;
  age: number | null;
  special_needs: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class SubjectSupabaseRepository implements ISubjectRepository {
  private supabase = inject(SupabaseService);

  // ---------- PUBLIC METHODS ---------- //

  getById(id: string, userId: string): Observable<Subject | null> {
    // Vérifier la propriété via JOIN avec clients
    return this.supabase.from$('subjects', q =>
      q.select('*, clients!inner(user_id)')
        .eq('id', id)
        .eq('clients.user_id', userId)
        .single()
    ).pipe(
      map(res => this.extractData<SubjectRow | null>(res, false)),
      map(row => (row ? this.mapToEntity(row) : null))
    );
  }

  getByClientId(clientId: string, userId: string): Observable<Subject[]> {
    // Vérifier que le client appartient à l'utilisateur via JOIN
    return this.supabase.from$('subjects', q =>
      q.select('*, clients!inner(user_id)')
        .eq('client_id', clientId)
        .eq('clients.user_id', userId)
        .order('created_at', { ascending: false })
    ).pipe(
      map(res => this.extractData<SubjectRow[]>(res, false)),
      map(rows => rows.map(r => this.mapToEntity(r)))
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

  delete(id: string, _userId: string): Observable<void> {
    // Note: userId n'est pas utilisé explicitement car RLS (Row Level Security)
    // s'occupe de la vérification du userId via la relation client_id
    return this.supabase.from$('subjects', q =>
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
    return payload;
  }
}
