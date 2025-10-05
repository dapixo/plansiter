import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '@domain/entities';
import { IUserRepository } from '@domain/repositories';
import { SupabaseService } from '../supabase.client';

type UserRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable()
export class UserSupabaseRepository implements IUserRepository {
  private supabase = inject(SupabaseService);

  // ---------- PUBLIC METHODS ---------- //

  getById(id: string): Observable<User | null> {
    return this.queryOne(q => q.eq('id', id));
  }

  getByEmail(email: string): Observable<User | null> {
    return this.queryOne(q => q.eq('email', email));
  }

  create(user: Omit<User, 'createdAt' | 'updatedAt'> & { id: string }): Observable<User> {
    const payload = this.toDbPayload(user);

    return this.supabase.from$('users', q => q.insert(payload).select().single()).pipe(
      map(res => this.extractData<UserRow>(res, true)),
      map(row => this.mapToEntity(row))
    );
  }

  update(id: string, user: Partial<User>): Observable<User> {
    const payload = this.toDbPayload(user, true);

    return this.supabase.from$('users', q => q.update(payload).eq('id', id).select().single()).pipe(
      map(res => this.extractData<UserRow>(res, true)),
      map(row => this.mapToEntity(row))
    );
  }

  delete(id: string): Observable<void> {
    return this.supabase.from$('users', q => q.delete().eq('id', id)).pipe(
      map(res => this.extractData(res, false)),
      map(() => void 0)
    );
  }

  // ---------- PRIVATE HELPERS ---------- //

  /** Query returning a single user */
  private queryOne(
    builder: (q: any) => any
  ): Observable<User | null> {
    return this.supabase.from$('users', q => builder(q.select('*').single())).pipe(
      map(res => this.extractData<UserRow | null>(res, false)),
      map(row => (row ? this.mapToEntity(row) : null))
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
  private mapToEntity(row: UserRow): User {
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone ?? undefined,
      avatarUrl: row.avatar_url ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /** Map entity → Supabase insert/update payload */
  private toDbPayload(user: Partial<User>, partial = false): Partial<UserRow> {
    const payload: Partial<UserRow> = {};
    if (!partial || user.id !== undefined) payload.id = user.id!;
    if (!partial || user.email !== undefined) payload.email = user.email!;
    if (!partial || user.firstName !== undefined) payload.first_name = user.firstName!;
    if (!partial || user.lastName !== undefined) payload.last_name = user.lastName!;
    if (!partial || user.phone !== undefined) payload.phone = user.phone ?? null;
    if (!partial || user.avatarUrl !== undefined) payload.avatar_url = user.avatarUrl ?? null;
    return payload;
  }
}
