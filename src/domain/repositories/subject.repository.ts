import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from '../entities';

export interface ISubjectRepository {
  getById(id: string): Observable<Subject | null>;
  getByClientId(clientId: string): Observable<Subject[]>;
  getAll(): Observable<Subject[]>;
  create(subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>): Observable<Subject>;
  update(id: string, subject: Partial<Subject>): Observable<Subject>;
  delete(id: string): Observable<void>;
}

export const SUBJECT_REPOSITORY = new InjectionToken<ISubjectRepository>('ISubjectRepository');
