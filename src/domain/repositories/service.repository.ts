import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Service } from '../entities';

export interface IServiceRepository {
  getById(id: string, userId: string): Observable<Service | null>;
  getByUserId(userId: string): Observable<Service[]>;
  create(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Observable<Service>;
  update(id: string, userId: string, service: Partial<Service>): Observable<Service>;
  delete(id: string, userId: string): Observable<void>;
}

export const SERVICE_REPOSITORY = new InjectionToken<IServiceRepository>('IServiceRepository');
