import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from '../entities';

export interface ISubjectRepository {
  getById(id: string, userId: string): Observable<Subject | null>;
  getByClientId(clientId: string, userId: string): Observable<Subject[]>;
  create(subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>): Observable<Subject>;
  update(id: string, userId: string, subject: Partial<Subject>): Observable<Subject>;
  delete(id: string, userId: string): Observable<Subject>;
}

export const SUBJECT_REPOSITORY = new InjectionToken<ISubjectRepository>('ISubjectRepository');
