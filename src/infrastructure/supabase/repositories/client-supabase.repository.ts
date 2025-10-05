import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Client } from '@domain/entities';
import { IClientRepository } from '@domain/repositories';
import { SupabaseService } from '../supabase.client';

type ClientRow = {
  id: string;
  user_id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string | null;
  state: string | null;
  country: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class ClientSupabaseRepository implements IClientRepository {
  private supabase = inject(SupabaseService);

  // ---------- PUBLIC METHODS ---------- //

  getById(id: string, userId: string): Observable<Client | null> {
    return this.queryOne(q => q.eq('id', id).eq('user_id', userId));
  }

  getByUserId(userId: string): Observable<Client[]> {
    return this.queryMany(q => q.eq('user_id', userId).order('created_at', { ascending: false }));
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

  delete(id: string, userId: string): Observable<void> {
    return this.supabase.from$('clients', q => q.delete().eq('id', id).eq('user_id', userId)).pipe(
      map(res => this.extractData(res, false)),
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
      postalCode: row.postal_code ?? undefined,
      state: row.state ?? undefined,
      country: row.country,
      notes: row.notes ?? undefined,
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
    if (!partial || client.postalCode !== undefined) payload.postal_code = client.postalCode ?? null;
    if (!partial || client.state !== undefined) payload.state = client.state ?? null;
    if (!partial || client.country !== undefined) payload.country = client.country!;
    if (!partial || client.notes !== undefined) payload.notes = client.notes ?? null;
    return payload;
  }
}
