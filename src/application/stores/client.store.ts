import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, finalize } from 'rxjs';
import { Client, Subject } from '@domain/entities';
import {
  IClientRepositoryExtended,
  CLIENT_REPOSITORY,
  ISubjectRepository,
  SUBJECT_REPOSITORY,
} from '@domain/repositories';
import { AuthService } from '../services/auth.service';
import { updateInList, removeFromList, createStoreHelpers } from './store.utils';

interface ClientState {
  clients: Client[];
  subjects: Subject[];
  loading: boolean;
  error: string | null;
  success: boolean;
  lastCreated: Client | null;
  lastCreatedSubject: Subject | null;
}

const initialState: ClientState = {
  clients: [],
  subjects: [],
  loading: false,
  error: null,
  success: false,
  lastCreated: null,
  lastCreatedSubject: null,
};

export const ClientStore = signalStore(
  withState(initialState),

  withComputed(state => ({
    clientsCount: computed(() => state.clients().length),
    subjectsCount: computed(() => state.subjects().length),
    activeClients: computed(() => state.clients().filter(c => !c.deletedAt)),
    activeSubjects: computed(() => state.subjects().filter(s => !s.deletedAt)),
  })),

  withMethods((store,
    clientRepo = inject<IClientRepositoryExtended>(CLIENT_REPOSITORY),
    subjectRepo = inject<ISubjectRepository>(SUBJECT_REPOSITORY),
    auth = inject(AuthService)
  ) => {
    const { setLoading, setError, setSuccess, handleError, runAuthenticated } =
      createStoreHelpers((state) => patchState(store, state), auth);

    return {
      setError,

      loadAll: rxMethod<void>(
        pipe(
          tap(setLoading),
          switchMap(() =>
            runAuthenticated(userId =>
              clientRepo.getByUserIdWithSubjects(userId).pipe(
                tap(results => {
                  const clients = results.map(r => r.client);
                  const newSubjects = results.flatMap(r => r.subjects);

                  const mergedSubjects = [
                    ...newSubjects,
                    ...store.subjects().filter(
                      s => !newSubjects.some(ns => ns.id === s.id)
                    ),
                  ];

                  patchState(store, { clients, subjects: mergedSubjects });
                }),
                catchError(handleError),
                finalize(setSuccess)
              )
            )
          )
        )
      ),

      create: rxMethod<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>(
        pipe(
          tap(setLoading),
          switchMap(data =>
            runAuthenticated(() =>
              clientRepo.create(data).pipe(
                tap(newClient =>
                  patchState(store, {
                    clients: [...store.clients(), newClient],
                    lastCreated: newClient,
                  })
                ),
                catchError(handleError),
                finalize(setSuccess)
              )
            )
          )
        )
      ),

      update: rxMethod<{ id: string; data: Partial<Client> }>(
        pipe(
          tap(setLoading),
          switchMap(({ id, data }) =>
            runAuthenticated(userId =>
              clientRepo.update(id, userId, data).pipe(
                tap(updatedClient =>
                  patchState(store, {
                    clients: updateInList(store.clients(), updatedClient),
                  })
                ),
                catchError(handleError),
                finalize(setSuccess)
              )
            )
          )
        )
      ),

      delete: rxMethod<string>(
        pipe(
          tap(setLoading),
          switchMap(id =>
            runAuthenticated(userId =>
              clientRepo.delete(id, userId).pipe(
                tap(() =>
                  patchState(store, {
                    clients: removeFromList(store.clients(), id),
                  })
                ),
                catchError(handleError),
                finalize(setSuccess)
              )
            )
          )
        )
      ),

      // ===== Subjects =====

      createSubject: rxMethod<Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>>(
        pipe(
          tap(setLoading),
          switchMap(data =>
            runAuthenticated(() =>
              subjectRepo.create(data).pipe(
                tap(newSubject =>
                  patchState(store, {
                    subjects: [...store.subjects(), newSubject],
                    lastCreatedSubject: newSubject,
                  })
                ),
                catchError(handleError),
                finalize(setSuccess)
              )
            )
          )
        )
      ),

      updateSubject: rxMethod<{ id: string; data: Partial<Subject> }>(
        pipe(
          tap(setLoading),
          switchMap(({ id, data }) =>
            runAuthenticated(userId =>
              subjectRepo.update(id, userId, data).pipe(
                tap(updatedSubject =>
                  patchState(store, {
                    subjects: updateInList(store.subjects(), updatedSubject),
                  })
                ),
                catchError(handleError),
                finalize(setSuccess)
              )
            )
          )
        )
      ),

      deleteSubject: rxMethod<string>(
        pipe(
          tap(setLoading),
          switchMap(id =>
            runAuthenticated(userId =>
              subjectRepo.delete(id, userId).pipe(
                tap(() =>
                  patchState(store, {
                    subjects: removeFromList(store.subjects(), id),
                  })
                ),
                catchError(handleError),
                finalize(setSuccess)
              )
            )
          )
        )
      ),
    };
  }),

  withHooks({
    onInit(store) {
      if (!store.clients().length) store.loadAll();
    },
  })
);
