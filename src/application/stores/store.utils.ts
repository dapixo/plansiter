import { EMPTY, Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const updateInList = <T extends { id: string }>(list: T[], updated: T): T[] =>
  list.map((item) => (item.id === updated.id ? updated : item));

export const removeFromList = <T extends { id: string }>(list: T[], id: string): T[] =>
  list.filter((item) => item.id !== id);

export const normalizeDate = (date: Date | string): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export interface StoreHelpers {
  setLoading: () => void;
  setError: (error: unknown) => void;
  setSuccess: () => void;
  handleError: (error: unknown) => typeof EMPTY;
  getUserId: () => string | null;
  runAuthenticated: <T>(operation: (userId: string) => Observable<T>) => Observable<T>;
}

export function createStoreHelpers(
  patchStateFn: (state: any) => void,
  authService: AuthService
): StoreHelpers {
  const setLoading = () =>
    patchStateFn({ loading: true, error: null, success: false });

  const setError = (error: unknown) =>
    patchStateFn({
      loading: false,
      error: error instanceof Error ? error.message : String(error),
      success: false,
    });

  const setSuccess = () =>
    patchStateFn({ loading: false, error: null, success: true });

  const handleError = (error: unknown) => {
    setError(error);
    return EMPTY;
  };

  const getUserId = (): string | null => authService.currentUser()?.id ?? null;

  const runAuthenticated = <T>(operation: (userId: string) => Observable<T>) =>
    getUserId() ? operation(getUserId()!) : handleError('No user logged in');

  return {
    setLoading,
    setError,
    setSuccess,
    handleError,
    getUserId,
    runAuthenticated,
  };
}
