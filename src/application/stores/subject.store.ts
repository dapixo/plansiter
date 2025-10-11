import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe, switchMap, tap, catchError, finalize } from 'rxjs';
import { Subject } from '@domain/entities';
import { ISubjectRepository, SUBJECT_REPOSITORY } from '@domain/repositories';
import { AuthService } from '../services/auth.service';

interface SubjectState {
  subjects: Subject[];
  loading: boolean;
  error: string | null;
}

const initialState: SubjectState = {
  subjects: [],
  loading: false,
  error: null,
};

const updateSubjectInList = (list: Subject[], updated: Subject) =>
  list.map(s => (s.id === updated.id ? updated : s));

const removeSubjectFromList = (list: Subject[], id: string) =>
  list.filter(s => s.id !== id);

export const SubjectStore = signalStore(
  withState(initialState),

  withComputed((state) => ({
    subjectsCount: computed(() => state.subjects().length),
  })),

  withMethods((store, repo = inject<ISubjectRepository>(SUBJECT_REPOSITORY), authService = inject(AuthService)) => {
    const setLoading = () => patchState(store, { loading: true, error: null });
    const setError = (error: unknown) =>
      patchState(store, { error: error instanceof Error ? error.message : String(error), loading: false });
    const setSuccess = () => patchState(store, { loading: false, error: null });

    return {
      setError: (error: unknown) => setError(error),

      loadByClientId: rxMethod<string>(
        pipe(
          tap(setLoading),
          switchMap((clientId) => {
            const userId = authService.currentUser()?.id;
            if (!userId) {
              patchState(store, { subjects: [], loading: false, error: 'No user logged in' });
              return EMPTY;
            }
            return repo.getByClientId(clientId, userId).pipe(
              tap((subjects) => patchState(store, { subjects })),
              catchError((error) => {
                setError(error);
                return EMPTY;
              }),
              finalize(setSuccess)
            );
          })
        )
      ),

      create: rxMethod<Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>>(
        pipe(
          tap(setLoading),
          switchMap((data) =>
            repo.create(data).pipe(
              tap((newSubject) =>
                patchState(store, { subjects: [...store.subjects(), newSubject] })
              ),
              catchError((error) => {
                setError(error);
                return EMPTY;
              }),
              finalize(setSuccess)
            )
          )
        )
      ),

      update: rxMethod<{ id: string; data: Partial<Subject> }>(
        pipe(
          tap(setLoading),
          switchMap(({ id, data }) => {
            const userId = authService.currentUser()?.id;
            if (!userId) {
              setError(new Error('No user logged in'));
              return EMPTY;
            }
            return repo.update(id, userId, data).pipe(
              tap((updatedSubject) =>
                patchState(store, { subjects: updateSubjectInList(store.subjects(), updatedSubject) })
              ),
              catchError((error) => {
                setError(error);
                return EMPTY;
              }),
              finalize(setSuccess)
            );
          })
        )
      ),

      delete: rxMethod<string>(
        pipe(
          tap(setLoading),
          switchMap((id) => {
            const userId = authService.currentUser()?.id;
            if (!userId) {
              setError(new Error('No user logged in'));
              return EMPTY;
            }
            return repo.delete(id, userId).pipe(
              tap(() =>
                patchState(store, { subjects: removeSubjectFromList(store.subjects(), id) })
              ),
              catchError((error) => {
                setError(error);
                return EMPTY;
              }),
              finalize(setSuccess)
            );
          })
        )
      ),
    };
  }),

  withHooks({
    onInit() {
      // Note: contrairement à ServiceStore et ClientStore, on ne charge pas automatiquement
      // les subjects car il faut un clientId. Le composant devra appeler loadByClientId(clientId)
    }
  })
);
