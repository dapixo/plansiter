import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../entities';

export interface IUserRepository {
  getById(id: string): Observable<User | null>;
  getByEmail(email: string): Observable<User | null>;
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Observable<User>;
  update(id: string, user: Partial<User>): Observable<User>;
  delete(id: string): Observable<void>;
}

export const USER_REPOSITORY = new InjectionToken<IUserRepository>('IUserRepository');
