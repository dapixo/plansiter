import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from '@domain/entities';
import { ISubjectRepository } from '@domain/repositories';
import { SupabaseService } from '../supabase.client';

@Injectable({
  providedIn: 'root'
})
export class SubjectSupabaseRepository implements ISubjectRepository {
  constructor(private supabase: SupabaseService) {}

  getById(id: string, userId: string): Observable<Subject | null> {
    // TODO: Implement with userId verification via client ownership (JOIN with clients table)
    throw new Error('Method not implemented');
  }

  getByClientId(clientId: string, userId: string): Observable<Subject[]> {
    // TODO: Implement with userId verification via client ownership
    throw new Error('Method not implemented');
  }

  create(subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>): Observable<Subject> {
    // TODO: Implement Supabase insert
    throw new Error('Method not implemented');
  }

  update(id: string, userId: string, subject: Partial<Subject>): Observable<Subject> {
    // TODO: Implement with userId verification via client ownership
    throw new Error('Method not implemented');
  }

  delete(id: string, userId: string): Observable<void> {
    // TODO: Implement with userId verification via client ownership
    throw new Error('Method not implemented');
  }
}
