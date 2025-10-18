import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe, switchMap, tap, catchError, finalize } from 'rxjs';
import { Client, Subject } from '@domain/entities';
import { IClientRepository, CLIENT_REPOSITORY } from '@domain/repositories';
import { ISubjectRepository, SUBJECT_REPOSITORY } from '@domain/repositories';
import { ClientSupabaseRepository } from '@infrastructure/supabase/repositories/client-supabase.repository';
import { AuthService } from '../services/auth.service';

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
  lastCreatedSubject: null
};

const updateClientInList = (list: Client[], updated: Client) =>
  list.map(c => (c.id === updated.id ? updated : c));

const removeClientFromList = (list: Client[], id: string) =>
  list.filter(c => c.id !== id);

const updateSubjectInList = (list: Subject[], updated: Subject) =>
  list.map(s => (s.id === updated.id ? updated : s));

const removeSubjectFromList = (list: Subject[], id: string) =>
  list.filter(s => s.id !== id);

export const ClientStore = signalStore(
  withState(initialState),

  withComputed((state) => ({
    clientsCount: computed(() => state.clients().length),
    subjectsCount: computed(() => state.subjects().length),
  })),

  withMethods((store, repo = inject<IClientRepository>(CLIENT_REPOSITORY), subjectRepo = inject<ISubjectRepository>(SUBJECT_REPOSITORY), authService = inject(AuthService)) => {
    // ========== HELPERS ==========
    const setLoading = () => patchState(store, { loading: true, error: null, success: false, lastCreated: null, lastCreatedSubject: null });
    const setError = (error: unknown) =>
      patchState(store, { error: error instanceof Error ? error.message : String(error), loading: false, success: false });
    const setSuccess = () => patchState(store, { loading: false, error: null, success: true });

    const getUserId = (): string | null => authService.currentUser()?.id ?? null;

    const handleError = (error: unknown) => {
      setError(error);
      return EMPTY;
    };

    // Cast pour accéder à la méthode getByUserIdWithSubjects
    const repoWithSubjects = repo as ClientSupabaseRepository;

    return {
      setError: (error: unknown) => setError(error),

      // ========== MÉTHODES CLIENTS ==========

      loadAll: rxMethod<void>(
        pipe(
          tap(setLoading),
          switchMap(() => {
            const userId = getUserId();
            if (!userId) {
              patchState(store, { clients: [], subjects: [], loading: false, error: 'No user logged in' });
              return EMPTY;
            }
            return repoWithSubjects.getByUserIdWithSubjects(userId).pipe(
              tap((results) => {
                const clients = results.map(r => r.client);
                const newSubjects = results.flatMap(r => r.subjects);

                // Merger intelligemment les subjects pour préserver ceux créés récemment
                const currentSubjects = store.subjects();
                const newSubjectIds = new Set(newSubjects.map(s => s.id));
                const recentSubjects = currentSubjects.filter(s => !newSubjectIds.has(s.id));
                const mergedSubjects = [...newSubjects, ...recentSubjects];

                patchState(store, { clients, subjects: mergedSubjects });
              }),
              catchError(handleError),
              finalize(setSuccess)
            );
          })
        )
      ),

      create: rxMethod<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>(
        pipe(
          tap(setLoading),
          switchMap((data) =>
            repo.create(data).pipe(
              tap((newClient) =>
                patchState(store, { clients: [...store.clients(), newClient],lastCreated: newClient })
              ),
              catchError(handleError),
              finalize(setSuccess)
            )
          )
        )
      ),

      update: rxMethod<{ id: string; data: Partial<Client> }>(
        pipe(
          tap(setLoading),
          switchMap(({ id, data }) => {
            const userId = getUserId();
            if (!userId) return handleError(new Error('No user logged in'));

            return repo.update(id, userId, data).pipe(
              tap((updatedClient) =>
                patchState(store, { clients: updateClientInList(store.clients(), updatedClient) })
              ),
              catchError(handleError),
              finalize(setSuccess)
            );
          })
        )
      ),

      delete: rxMethod<string>(
        pipe(
          tap(setLoading),
          switchMap((id) => {
            const userId = getUserId();
            if (!userId) return handleError(new Error('No user logged in'));

            return repo.delete(id, userId).pipe(
              tap(() =>
                patchState(store, { clients: removeClientFromList(store.clients(), id) })
              ),
              catchError(handleError),
              finalize(setSuccess)
            );
          })
        )
      ),

      // ========== MÉTHODES SUBJECTS ==========

      createSubject: rxMethod<Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>>(
        pipe(
          tap(setLoading),
          switchMap((data) =>
            subjectRepo.create(data).pipe(
              tap((newSubject) =>
                patchState(store, { subjects: [...store.subjects(), newSubject], lastCreatedSubject: newSubject })
              ),
              catchError(handleError),
              finalize(setSuccess)
            )
          )
        )
      ),

      updateSubject: rxMethod<{ id: string; data: Partial<Subject> }>(
        pipe(
          tap(setLoading),
          switchMap(({ id, data }) => {
            const userId = getUserId();
            if (!userId) return handleError(new Error('No user logged in'));

            return subjectRepo.update(id, userId, data).pipe(
              tap((updatedSubject) =>
                patchState(store, { subjects: updateSubjectInList(store.subjects(), updatedSubject) })
              ),
              catchError(handleError),
              finalize(setSuccess)
            );
          })
        )
      ),

      deleteSubject: rxMethod<string>(
        pipe(
          tap(setLoading),
          switchMap((id) => {
            const userId = getUserId();
            if (!userId) return handleError(new Error('No user logged in'));

            return subjectRepo.delete(id, userId).pipe(
              tap(() =>
                patchState(store, { subjects: removeSubjectFromList(store.subjects(), id) })
              ),
              catchError(handleError),
              finalize(setSuccess)
            );
          })
        )
      ),
    };
  }),

  withHooks({
    onInit(store) {
      store.loadAll();
    }
  })
);
