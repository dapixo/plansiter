import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Service } from '@domain/entities';
import { IServiceRepository } from '@domain/repositories';
import { SupabaseService } from '../supabase.client';

@Injectable({
  providedIn: 'root'
})
export class ServiceSupabaseRepository implements IServiceRepository {
  constructor(private supabase: SupabaseService) {}

  getById(id: string): Observable<Service | null> {
    // TODO: Implement Supabase query
    throw new Error('Method not implemented');
  }

  getAll(): Observable<Service[]> {
    // TODO: Implement Supabase query
    throw new Error('Method not implemented');
  }

  getActive(): Observable<Service[]> {
    // TODO: Implement Supabase query with filter
    throw new Error('Method not implemented');
  }

  create(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Observable<Service> {
    // TODO: Implement Supabase insert
    throw new Error('Method not implemented');
  }

  update(id: string, service: Partial<Service>): Observable<Service> {
    // TODO: Implement Supabase update
    throw new Error('Method not implemented');
  }

  delete(id: string): Observable<void> {
    // TODO: Implement Supabase delete
    throw new Error('Method not implemented');
  }
}
