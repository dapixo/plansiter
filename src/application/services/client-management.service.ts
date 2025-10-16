import { inject, Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { switchMap, tap, map } from 'rxjs/operators';
import { Client, Subject } from '@domain/entities';
import { IClientRepository, CLIENT_REPOSITORY } from '@domain/repositories/client.repository';
import { ISubjectRepository, SUBJECT_REPOSITORY } from '@domain/repositories/subject.repository';
import { ClientStore } from '@application/stores/client.store';

export interface TempSubject {
  tempId: string;
  type: Subject['type'];
  name: string;
  breed?: string;
  age?: number;
  specialNeeds?: string;
  notes?: string;
  id?: string;
  isExisting?: boolean;
}

/**
 * Service d'orchestration pour la gestion des clients
 * Centralise la logique métier de création/update client + subjects
 */
@Injectable({
  providedIn: 'root'
})
export class ClientManagementService {
  private readonly clientRepo = inject<IClientRepository>(CLIENT_REPOSITORY);
  private readonly subjectRepo = inject<ISubjectRepository>(SUBJECT_REPOSITORY);
  private readonly clientStore = inject(ClientStore);

  /**
   * Crée un client avec ses subjects de manière transactionnelle
   * @param clientData Données du client à créer
   * @param subjects Liste des subjects à associer au client
   * @returns Observable du client créé
   */
  createClientWithSubjects(
    clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>,
    subjects: TempSubject[]
  ): Observable<Client> {
    return this.clientRepo.create(clientData).pipe(
      switchMap(createdClient => {
        // Si pas de subjects, retourner directement le client
        if (subjects.length === 0) {
          return of(createdClient);
        }

        // Créer tous les subjects en parallèle
        const subjectCreations$ = subjects.map(subject =>
          this.subjectRepo.create(this.toSubjectPayload(subject, createdClient.id))
        );

        // Attendre que tous les subjects soient créés, puis retourner le client
        return forkJoin(subjectCreations$).pipe(
          map(() => createdClient)
        );
      }),
      // Recharger la liste des clients dans le store
      tap(() => this.clientStore.loadAll())
    );
  }

  /**
   * Convertit un TempSubject en payload pour le repository
   */
  private toSubjectPayload(
    temp: TempSubject,
    clientId: string
  ): Omit<Subject, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      clientId,
      type: temp.type,
      name: temp.name,
      breed: temp.breed,
      age: temp.age,
      specialNeeds: temp.specialNeeds,
      notes: temp.notes,
    };
  }
}
