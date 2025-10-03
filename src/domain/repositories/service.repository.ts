import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Service } from '../entities';

export interface IServiceRepository {
  getById(id: string): Observable<Service | null>;
  getAll(): Observable<Service[]>;
  getActive(): Observable<Service[]>;
  create(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Observable<Service>;
  update(id: string, service: Partial<Service>): Observable<Service>;
  delete(id: string): Observable<void>;
}

export const SERVICE_REPOSITORY = new InjectionToken<IServiceRepository>('IServiceRepository');
