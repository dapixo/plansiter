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
import { Service } from '@domain/entities';
import { IServiceRepository, SERVICE_REPOSITORY } from '@domain/repositories';
import { AuthService } from '../services/auth.service';
import { UserPreferencesStore } from './user-preferences.store';
import { updateInList, removeFromList, createStoreHelpers } from './store.utils';

interface ServiceState {
  services: Service[];
  loading: boolean;
  error: string | null;
  success: boolean;
  lastCreated: Service | null;
}

const initialState: ServiceState = {
  services: [],
  loading: false,
  error: null,
  success: false,
  lastCreated: null,
};

export const ServiceStore = signalStore(
  withState(initialState),

  withComputed(
    (state, preferencesStore = inject(UserPreferencesStore)) => ({
      servicesCount: computed(() => state.services().length),
      activeServices: computed(() => {
        const allServices = state.services();
        const activeCareTypes = preferencesStore.careTypes();

        // Si aucun type de soin n'est configuré, retourner tous les services
        if (activeCareTypes.length === 0) return allServices;

        // Retourner uniquement les services dont le type est activé
        return allServices.filter((service) =>
          activeCareTypes.includes(service.type)
        );
      }),
    })
  ),

  withMethods(
    (
      store,
      repo = inject<IServiceRepository>(SERVICE_REPOSITORY),
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
              runAuthenticated((userId) =>
                repo.getByUserId(userId).pipe(
                  tap((services) => patchState(store, { services })),
                  tap(setSuccess),
                  catchError(handleError),
                  finalize(() => patchState(store, { loading: false }))
                )
              )
            )
          )
        ),

        create: rxMethod<Omit<Service, 'id' | 'createdAt' | 'updatedAt'>>(
          pipe(
            tap(setLoading),
            switchMap((data) =>
              repo.create(data).pipe(
                tap((newService) =>
                  patchState(store, {
                    services: [...store.services(), newService],
                    lastCreated: newService,
                  })
                ),
                tap(setSuccess),
                catchError(handleError),
                finalize(() => patchState(store, { loading: false }))
              )
            )
          )
        ),

        update: rxMethod<{ id: string; data: Partial<Service> }>(
          pipe(
            tap(setLoading),
            switchMap(({ id, data }) =>
              runAuthenticated((userId) =>
                repo.update(id, userId, data).pipe(
                  tap((updatedService) =>
                    patchState(store, {
                      services: updateInList(store.services(), updatedService),
                    })
                  ),
                  tap(setSuccess),
                  catchError(handleError),
                  finalize(() => patchState(store, { loading: false }))
                )
              )
            )
          )
        ),

        delete: rxMethod<string>(
          pipe(
            tap(setLoading),
            switchMap((id) =>
              runAuthenticated((userId) =>
                repo.delete(id, userId).pipe(
                  tap(() =>
                    patchState(store, {
                      services: removeFromList(store.services(), id),
                    })
                  ),
                  tap(setSuccess),
                  catchError(handleError),
                  finalize(() => patchState(store, { loading: false }))
                )
              )
            )
          )
        ),
      };
    }
  ),

  withHooks({
    onInit(store) {
      if (!store.services().length) store.loadAll();
    },
  })
);
