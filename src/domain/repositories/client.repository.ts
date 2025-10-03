import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Client } from '../entities';

export interface IClientRepository {
  getById(id: string): Observable<Client | null>;
  getByUserId(userId: string): Observable<Client[]>;
  getAll(): Observable<Client[]>;
  create(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Observable<Client>;
  update(id: string, client: Partial<Client>): Observable<Client>;
  delete(id: string): Observable<void>;
}

export const CLIENT_REPOSITORY = new InjectionToken<IClientRepository>('IClientRepository');
