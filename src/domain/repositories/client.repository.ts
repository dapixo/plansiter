import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Client, Subject } from '../entities';

export interface ClientWithSubjects {
  client: Client;
  subjects: Subject[];
}

export interface IClientRepository {
  getById(id: string, userId: string): Observable<Client | null>;
  getByUserId(userId: string): Observable<Client[]>;
  create(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Observable<Client>;
  update(id: string, userId: string, client: Partial<Client>): Observable<Client>;
  delete(id: string, userId: string): Observable<void>;
}

export interface IClientRepositoryExtended extends IClientRepository {
  getByUserIdWithSubjects(userId: string): Observable<ClientWithSubjects[]>;
}

export const CLIENT_REPOSITORY = new InjectionToken<IClientRepository>('IClientRepository');
