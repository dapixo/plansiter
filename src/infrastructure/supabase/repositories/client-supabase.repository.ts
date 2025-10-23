import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Client, Subject, SubjectType } from '@domain/entities';
import { IClientRepository } from '@domain/repositories';
import { SupabaseService } from '../supabase.client';

type ClientRow = {
  id: string;
  user_id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  state: string | null;
  country: string;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

type SubjectRow = {
  id: string;
  client_id: string;
  type: SubjectType;
  name: string;
  breed: string | null;
  age: number | null;
  special_needs: string | null;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

type ClientWithSubjectsRow = ClientRow & {
  subjects: SubjectRow[];
};

export type ClientWithSubjects = {
  client: Client;
  subjects: Subject[];
};

@Injectable()
export class ClientSupabaseRepository implements IClientRepository {
  private supabase = inject(SupabaseService);

  // ---------- PUBLIC METHODS ---------- //

  getById(id: string, userId: string): Observable<Client | null> {
    return this.queryOne(q => q.eq('id', id).eq('user_id', userId).is('deleted_at', null));
  }

  getByUserId(userId: string): Observable<Client[]> {
    return this.queryMany(q =>
      q.eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
    );
  }

  /**
   * Récupère tous les clients avec leurs subjects (incluant soft-deleted).
   * Les filtres par deletedAt doivent être appliqués au niveau du store/UI selon le contexte.
   */
  getByUserIdWithSubjects(userId: string): Observable<ClientWithSubjects[]> {
    return this.supabase.from$('clients', q =>
      q.select('*, subjects(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    ).pipe(
      map(res => this.extractData<ClientWithSubjectsRow[]>(res, false)),
      map(rows => rows.map(row => ({
        client: this.mapToEntity(row),
        subjects: (row.subjects || []).map(s => this.mapSubjectToEntity(s))
      })))
    );
  }

  create(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Observable<Client> {
    const payload = this.toDbPayload(client);

    return this.supabase.from$('clients', q => q.insert(payload).select().single()).pipe(
      map(res => this.extractData<ClientRow>(res, true)),
      map(row => this.mapToEntity(row))
    );
  }

  update(id: string, userId: string, client: Partial<Client>): Observable<Client> {
    const payload = this.toDbPayload(client, true);

    return this.supabase.from$('clients', q => q.update(payload).eq('id', id).eq('user_id', userId).select().single()).pipe(
      map(res => this.extractData<ClientRow>(res, true)),
      map(row => this.mapToEntity(row))
    );
  }

  /**
   * Soft delete: marquer le client comme supprimé sans le retirer de la base de données.
   * Cela préserve l'intégrité historique des bookings.
   */
  delete(id: string, userId: string): Observable<void> {
    return this.update(id, userId, { deletedAt: new Date() }).pipe(
      map(() => void 0)
    );
  }

  // ---------- PRIVATE HELPERS ---------- //

  /** Query returning a single client */
  private queryOne(
    builder: (q: any) => any
  ): Observable<Client | null> {
    return this.supabase.from$('clients', q => builder(q.select('*').single())).pipe(
      map(res => this.extractData<ClientRow | null>(res, false)),
      map(row => (row ? this.mapToEntity(row) : null))
    );
  }

  /** Query returning multiple clients */
  private queryMany(
    builder: (q: any) => any
  ): Observable<Client[]> {
    return this.supabase.from$('clients', q => builder(q.select('*'))).pipe(
      map(res => this.extractData<ClientRow[]>(res, false)),
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
  private mapToEntity(row: ClientRow): Client {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      address: row.address,
      city: row.city,
      postalCode: row.postal_code,
      state: row.state ?? undefined,
      country: row.country,
      notes: row.notes ?? undefined,
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /** Map Supabase subject row → domain entity */
  private mapSubjectToEntity(row: SubjectRow): Subject {
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
  private toDbPayload(client: Partial<Client>, partial = false): Partial<ClientRow> {
    const payload: Partial<ClientRow> = {};
    if (!partial || client.userId !== undefined) payload.user_id = client.userId!;
    if (!partial || client.name !== undefined) payload.name = client.name!;
    if (!partial || client.address !== undefined) payload.address = client.address!;
    if (!partial || client.city !== undefined) payload.city = client.city!;
    if (!partial || client.postalCode !== undefined) payload.postal_code = client.postalCode;
    if (!partial || client.state !== undefined) payload.state = client.state ?? null;
    if (!partial || client.country !== undefined) payload.country = client.country!;
    if (!partial || client.notes !== undefined) payload.notes = client.notes ?? null;
    if (!partial || client.deletedAt !== undefined) payload.deleted_at = client.deletedAt?.toISOString() ?? null;
    return payload;
  }
}
