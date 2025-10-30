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
import { UserPreferences, CareType } from '@domain/entities/user-preferences.entity';
import { IUserPreferencesRepository, USER_PREFERENCES_REPOSITORY } from '@domain/repositories';
import { AuthService } from '../services/auth.service';
import { createStoreHelpers, createStoreOnInit } from './store.utils';

interface UserPreferencesState {
  preferences: UserPreferences | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: UserPreferencesState = {
  preferences: null,
  loading: false,
  error: null,
  success: false,
};

export const UserPreferencesStore = signalStore(
  withState(initialState),

  withComputed((state) => ({
    careTypes: computed(() => state.preferences()?.careTypes ?? []),
    hasCareTypes: computed(() => (state.preferences()?.careTypes.length ?? 0) > 0),
    isOnboarded: computed(() => state.preferences()?.isOnboarded ?? false),
  })),

  withMethods(
    (
      store,
      repo = inject<IUserPreferencesRepository>(USER_PREFERENCES_REPOSITORY),
      auth = inject(AuthService)
    ) => {
      const { setLoading, setError, setSuccess, handleError, runAuthenticated } =
        createStoreHelpers((state) => patchState(store, state), auth);

      return {
        setError,

        load: rxMethod<void>(
          pipe(
            tap(setLoading),
            switchMap(() =>
              runAuthenticated((userId) =>
                repo.getByUserId(userId).pipe(
                  tap((preferences) => patchState(store, { preferences })),
                  tap(setSuccess),
                  catchError(handleError),
                  finalize(() => patchState(store, { loading: false }))
                )
              )
            )
          )
        ),

        updateCareTypes: rxMethod<CareType[]>(
          pipe(
            tap(setLoading),
            switchMap((careTypes) =>
              runAuthenticated((userId) =>
                repo.upsert({ userId, careTypes, isOnboarded: false }).pipe(
                  tap((preferences) => patchState(store, { preferences })),
                  tap(setSuccess),
                  catchError(handleError),
                  finalize(() => patchState(store, { loading: false }))
                )
              )
            )
          )
        ),

        markAsOnboarded: rxMethod<void>(
          pipe(
            tap(setLoading),
            switchMap(() =>
              runAuthenticated((userId) =>
                repo.markAsOnboarded(userId).pipe(
                  tap(() => {
                    // Update local state to mark as onboarded
                    const current = store.preferences();
                    if (current) {
                      patchState(store, {
                        preferences: { ...current, isOnboarded: true }
                      });
                    }
                  }),
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
    onInit: createStoreOnInit(
      (store) => store.load(),
      (store) => !!store.preferences()
    ),
  })
);
