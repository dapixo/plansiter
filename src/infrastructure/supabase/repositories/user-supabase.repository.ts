import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '@domain/entities';
import { IUserRepository } from '@domain/repositories';
import { SupabaseService } from '../supabase.client';

@Injectable({
  providedIn: 'root'
})
export class UserSupabaseRepository implements IUserRepository {
  constructor(private supabase: SupabaseService) {}

  getById(id: string): Observable<User | null> {
    // TODO: Implement Supabase query
    throw new Error('Method not implemented');
  }

  getByEmail(email: string): Observable<User | null> {
    // TODO: Implement Supabase query
    throw new Error('Method not implemented');
  }

  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Observable<User> {
    // TODO: Implement Supabase insert
    throw new Error('Method not implemented');
  }

  update(id: string, user: Partial<User>): Observable<User> {
    // TODO: Implement Supabase update
    throw new Error('Method not implemented');
  }

  delete(id: string): Observable<void> {
    // TODO: Implement Supabase delete
    throw new Error('Method not implemented');
  }
}
