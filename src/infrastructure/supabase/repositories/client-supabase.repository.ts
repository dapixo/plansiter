import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Client } from '@domain/entities';
import { IClientRepository } from '@domain/repositories';
import { SupabaseService } from '../supabase.client';

@Injectable({
  providedIn: 'root'
})
export class ClientSupabaseRepository implements IClientRepository {
  constructor(private supabase: SupabaseService) {}

  getById(id: string): Observable<Client | null> {
    // TODO: Implement Supabase query
    throw new Error('Method not implemented');
  }

  getByUserId(userId: string): Observable<Client[]> {
    // TODO: Implement Supabase query
    throw new Error('Method not implemented');
  }

  getAll(): Observable<Client[]> {
    // TODO: Implement Supabase query
    throw new Error('Method not implemented');
  }

  create(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Observable<Client> {
    // TODO: Implement Supabase insert
    throw new Error('Method not implemented');
  }

  update(id: string, client: Partial<Client>): Observable<Client> {
    // TODO: Implement Supabase update
    throw new Error('Method not implemented');
  }

  delete(id: string): Observable<void> {
    // TODO: Implement Supabase delete
    throw new Error('Method not implemented');
  }
}
