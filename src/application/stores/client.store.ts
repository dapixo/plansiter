import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe, switchMap, tap, catchError, finalize } from 'rxjs';
import { Client } from '@domain/entities';
import { IClientRepository, CLIENT_REPOSITORY } from '@domain/repositories';
import { AuthService } from '../services/auth.service';

interface ClientState {
  clients: Client[];
  loading: boolean;
  error: string | null;
}

const initialState: ClientState = {
  clients: [],
  loading: false,
  error: null,
};

const updateClientInList = (list: Client[], updated: Client) =>
  list.map(c => (c.id === updated.id ? updated : c));

const removeClientFromList = (list: Client[], id: string) =>
  list.filter(c => c.id !== id);

export const ClientStore = signalStore(
  withState(initialState),

  withComputed((state) => ({
    clientsCount: computed(() => state.clients().length),
  })),

  withMethods((store, repo = inject<IClientRepository>(CLIENT_REPOSITORY), authService = inject(AuthService)) => {
    const setLoading = () => patchState(store, { loading: true, error: null });
    const setError = (error: unknown) =>
      patchState(store, { error: error instanceof Error ? error.message : String(error), loading: false });
    const setSuccess = () => patchState(store, { loading: false, error: null });

    return {
      setError: (error: unknown) => setError(error),

      loadAll: rxMethod<void>(
        pipe(
          tap(setLoading),
          switchMap(() => {
            const userId = authService.currentUser()?.id;
            if (!userId) {
              patchState(store, { clients: [], loading: false, error: 'No user logged in' });
              return EMPTY;
            }
            return repo.getByUserId(userId).pipe(
              tap((clients) => patchState(store, { clients })),
              catchError((error) => {
                setError(error);
                return EMPTY;
              }),
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
                patchState(store, { clients: [...store.clients(), newClient] })
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

      update: rxMethod<{ id: string; data: Partial<Client> }>(
        pipe(
          tap(setLoading),
          switchMap(({ id, data }) => {
            const userId = authService.currentUser()?.id;
            if (!userId) {
              setError(new Error('No user logged in'));
              return EMPTY;
            }
            return repo.update(id, userId, data).pipe(
              tap((updatedClient) =>
                patchState(store, { clients: updateClientInList(store.clients(), updatedClient) })
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
                patchState(store, { clients: removeClientFromList(store.clients(), id) })
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
    onInit(store) {
      store.loadAll();
    }
  })
);
