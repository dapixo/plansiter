import { inject } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

// ============================================
// List manipulation utilities
// ============================================

export const updateInList = <T extends { id: string }>(list: T[], updated: T): T[] =>
  list.map((item) => (item.id === updated.id ? updated : item));

export const removeFromList = <T extends { id: string }>(list: T[], id: string): T[] =>
  list.filter((item) => item.id !== id);

// ============================================
// Date utilities
// ============================================

export const normalizeDate = (date: Date | string): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

// ============================================
// Error utilities
// ============================================

/**
 * Formats an unknown error into a readable string message.
 * Handles Error instances, strings, and other types.
 */
export const formatError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return String(error);
};

// ============================================
// Store initialization utilities
// ============================================

/**
 * Creates a store onInit callback that waits for session to be loaded
 * before attempting to load data.
 *
 * This helper solves race conditions where stores try to load data before
 * the authentication session is restored from storage.
 *
 * @param loadFn Function to call to load data (e.g., store.loadAll)
 * @param hasDataFn Function that returns true if data is already loaded
 * @returns onInit callback function for withHooks
 *
 * @example
 * withHooks({
 *   onInit: createStoreOnInit(
 *     (store) => store.loadAll(),
 *     (store) => store.clients().length > 0
 *   )
 * })
 */
export function createStoreOnInit<TStore>(
  loadFn: (store: TStore) => void,
  hasDataFn: (store: TStore) => boolean
) {
  return (store: TStore, auth = inject(AuthService)) => {
    // Use take(1) to automatically unsubscribe after first emission
    auth.waitForSessionLoad().pipe(take(1)).subscribe(() => {
      if (!hasDataFn(store) && auth.isAuthenticated()) {
        loadFn(store);
      }
    });
  };
}

// ============================================
// Store state management utilities
// ============================================

/**
 * Standard state shape for stores using these helpers.
 * Extend this interface for your store's specific state.
 */
export interface BaseStoreState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

/**
 * Helper functions for managing common store state patterns.
 */
export interface StoreHelpers {
  /** Sets loading state to true and clears error/success */
  setLoading: () => void;
  /** Sets error state and clears loading/success */
  setError: (error: unknown) => void;
  /** Sets success state and clears loading/error */
  setSuccess: () => void;
  /** Handles error and returns EMPTY observable for catchError operator */
  handleError: (error: unknown) => typeof EMPTY;
  /** Gets current authenticated user ID or null */
  getUserId: () => string | null;
  /** Runs an operation only if user is authenticated, otherwise returns error */
  runAuthenticated: <T>(operation: (userId: string) => Observable<T>) => Observable<T>;
}

/**
 * Creates a set of helper functions for managing store state.
 *
 * Provides standardized methods for loading states, error handling,
 * and authenticated operations.
 *
 * @param patchStateFn Function to patch the store state (e.g., patchState from NgRx Signals)
 * @param authService AuthService instance for authentication checks
 * @returns Object containing helper functions
 *
 * @example
 * const { setLoading, handleError, runAuthenticated } = createStoreHelpers(
 *   (state) => patchState(store, state),
 *   authService
 * );
 */
export function createStoreHelpers(
  patchStateFn: (state: Partial<BaseStoreState>) => void,
  authService: AuthService
): StoreHelpers {
  const setLoading = () =>
    patchStateFn({ loading: true, error: null, success: false });

  const setError = (error: unknown) =>
    patchStateFn({
      loading: false,
      error: formatError(error),
      success: false,
    });

  const setSuccess = () =>
    patchStateFn({ loading: false, error: null, success: true });

  const handleError = (error: unknown) => {
    setError(error);
    return EMPTY;
  };

  const getUserId = (): string | null => authService.currentUser()?.id ?? null;

  const runAuthenticated = <T>(operation: (userId: string) => Observable<T>): Observable<T> => {
    const userId = getUserId();
    return userId ? operation(userId) : handleError('No user logged in');
  };

  return {
    setLoading,
    setError,
    setSuccess,
    handleError,
    getUserId,
    runAuthenticated,
  };
}
