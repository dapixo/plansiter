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

  getById(id: string): Observable<Subject | null> {
    // TODO: Implement Supabase query
    throw new Error('Method not implemented');
  }

  getByClientId(clientId: string): Observable<Subject[]> {
    // TODO: Implement Supabase query
    throw new Error('Method not implemented');
  }

  getAll(): Observable<Subject[]> {
    // TODO: Implement Supabase query
    throw new Error('Method not implemented');
  }

  create(subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>): Observable<Subject> {
    // TODO: Implement Supabase insert
    throw new Error('Method not implemented');
  }

  update(id: string, subject: Partial<Subject>): Observable<Subject> {
    // TODO: Implement Supabase update
    throw new Error('Method not implemented');
  }

  delete(id: string): Observable<void> {
    // TODO: Implement Supabase delete
    throw new Error('Method not implemented');
  }
}
