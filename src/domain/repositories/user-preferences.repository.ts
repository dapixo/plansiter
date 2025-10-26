import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { UserPreferences } from '../entities/user-preferences.entity';

export interface IUserPreferencesRepository {
  getByUserId(userId: string): Observable<UserPreferences | null>;
  upsert(preferences: Omit<UserPreferences, 'id' | 'createdAt' | 'updatedAt'>): Observable<UserPreferences>;
}

export const USER_PREFERENCES_REPOSITORY = new InjectionToken<IUserPreferencesRepository>('IUserPreferencesRepository');
