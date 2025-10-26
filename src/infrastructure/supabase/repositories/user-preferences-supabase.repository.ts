import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserPreferences, CareType } from '@domain/entities/user-preferences.entity';
import { IUserPreferencesRepository } from '@domain/repositories/user-preferences.repository';
import { SupabaseService } from '../supabase.client';
import { BaseSupabaseRepository } from './base-supabase.repository';

type UserPreferencesRow = {
  id: string;
  user_id: string;
  care_types: CareType[];
  created_at: string;
  updated_at: string;
};

@Injectable()
export class UserPreferencesSupabaseRepository extends BaseSupabaseRepository implements IUserPreferencesRepository {
  private supabase = inject(SupabaseService);

  getByUserId(userId: string): Observable<UserPreferences | null> {
    return this.supabase.from$('user_preferences', q =>
      q.select('*').eq('user_id', userId).single()
    ).pipe(
      map(res => this.extractData<UserPreferencesRow | null>(res, false)),
      map(row => (row ? this.mapToEntity(row) : null))
    );
  }

  upsert(preferences: Omit<UserPreferences, 'id' | 'createdAt' | 'updatedAt'>): Observable<UserPreferences> {
    const payload = this.toDbPayload(preferences);

    return this.supabase.from$('user_preferences', q =>
      q.upsert(payload, { onConflict: 'user_id' }).select().single()
    ).pipe(
      map(res => this.extractData<UserPreferencesRow>(res, true)),
      map(row => this.mapToEntity(row))
    );
  }

  // ---------- PRIVATE HELPERS ---------- //

  /** Map Supabase row → domain entity */
  private mapToEntity(row: UserPreferencesRow): UserPreferences {
    return {
      id: row.id,
      userId: row.user_id,
      careTypes: row.care_types,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /** Map entity → Supabase insert/update payload */
  private toDbPayload(preferences: Partial<UserPreferences>): Partial<UserPreferencesRow> {
    return {
      user_id: preferences.userId,
      care_types: preferences.careTypes ?? []
    };
  }
}
