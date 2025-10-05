import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { Service } from '@domain/entities';
import { IServiceRepository, SERVICE_REPOSITORY } from '@domain/repositories';
import { AuthService } from '../services/auth.service';

interface ServiceState {
  services: Service[];
  loading: boolean;
  error: string | null;
}

const initialState: ServiceState = {
  services: [],
  loading: false,
  error: null,
};

const updateServiceInList = (list: Service[], updated: Service) =>
  list.map(s => (s.id === updated.id ? updated : s));

const removeServiceFromList = (list: Service[], id: string) =>
  list.filter(s => s.id !== id);

export const ServiceStore = signalStore(
  withState(initialState),

  withComputed((state) => ({
    servicesCount: computed(() => state.services().length),
  })),

  withMethods((store, repo = inject<IServiceRepository>(SERVICE_REPOSITORY), authService = inject(AuthService)) => {
    const setLoading = () => patchState(store, { loading: true, error: null });
    const setError = (error: unknown) =>
      patchState(store, { error: error instanceof Error ? error.message : String(error), loading: false });
    const setSuccess = () => patchState(store, { loading: false, error: null });

    return {
      loadAll: rxMethod<void>(
        pipe(
          tap(setLoading),
          switchMap(() => {
            const userId = authService.currentUser()?.id;
            if (!userId) {
              patchState(store, { services: [], loading: false, error: 'No user logged in' });
              return [];
            }
            return repo.getByUserId(userId).pipe(
              tap({
                next: (services) => patchState(store, { services }),
                error: setError,
                finalize: setSuccess
              })
            );
          })
        )
      ),

      create: rxMethod<Omit<Service, 'id' | 'createdAt' | 'updatedAt'>>(
        pipe(
          tap(setLoading),
          switchMap((data) =>
            repo.create(data).pipe(
              tap({
                next: (newService) =>
                  patchState(store, { services: [...store.services(), newService] }),
                error: setError,
                finalize: setSuccess
              })
            )
          )
        )
      ),

      update: rxMethod<{ id: string; data: Partial<Service> }>(
        pipe(
          tap(setLoading),
          switchMap(({ id, data }) => {
            const userId = authService.currentUser()?.id;
            if (!userId) {
              setError(new Error('No user logged in'));
              return [];
            }
            return repo.update(id, userId, data).pipe(
              tap({
                next: (updatedService) =>
                  patchState(store, { services: updateServiceInList(store.services(), updatedService) }),
                error: setError,
                finalize: setSuccess
              })
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
              return [];
            }
            return repo.delete(id, userId).pipe(
              tap({
                next: () =>
                  patchState(store, { services: removeServiceFromList(store.services(), id) }),
                error: setError,
                finalize: setSuccess
              })
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
