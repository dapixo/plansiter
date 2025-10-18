import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe, switchMap, tap, catchError, finalize } from 'rxjs';
import { Booking } from '@domain/entities';
import { IBookingRepository, BOOKING_REPOSITORY } from '@domain/repositories';
import { AuthService } from '../services/auth.service';

interface BookingState {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  success: boolean;
  lastCreated: Booking | null;
}

const initialState: BookingState = {
  bookings: [],
  loading: false,
  error: null,
  success: false,
  lastCreated: null,
};

const updateBookingInList = (list: Booking[], updated: Booking) =>
  list.map(b => (b.id === updated.id ? updated : b));

const removeBookingFromList = (list: Booking[], id: string) =>
  list.filter(b => b.id !== id);

export const BookingStore = signalStore(
  withState(initialState),

  withComputed((state) => ({
    bookingsCount: computed(() => state.bookings().length),
  })),

  withMethods((store, repo = inject<IBookingRepository>(BOOKING_REPOSITORY), authService = inject(AuthService)) => {
    // ========== HELPERS ==========
    const setLoading = () => patchState(store, { loading: true, error: null, success: false, lastCreated: null });
    const setError = (error: unknown) =>
      patchState(store, { error: error instanceof Error ? error.message : String(error), loading: false, success: false });
    const setSuccess = () => patchState(store, { loading: false, error: null, success: true });

    const getUserId = (): string | null => authService.currentUser()?.id ?? null;

    const handleError = (error: unknown) => {
      setError(error);
      return EMPTY;
    };

    return {
      setError: (error: unknown) => setError(error),

      // ========== MÉTHODES BOOKINGS ==========

      create: rxMethod<Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>>(
        pipe(
          tap(setLoading),
          switchMap((data) =>
            repo.create(data).pipe(
              tap((newBooking) =>
                patchState(store, { bookings: [...store.bookings(), newBooking], lastCreated: newBooking })
              ),
              catchError(handleError),
              finalize(setSuccess)
            )
          )
        )
      ),

      update: rxMethod<{ id: string; data: Partial<Booking> }>(
        pipe(
          tap(setLoading),
          switchMap(({ id, data }) => {
            const userId = getUserId();
            if (!userId) return handleError(new Error('No user logged in'));

            return repo.update(id, userId, data).pipe(
              tap((updatedBooking) =>
                patchState(store, { bookings: updateBookingInList(store.bookings(), updatedBooking) })
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
                patchState(store, { bookings: removeBookingFromList(store.bookings(), id) })
              ),
              catchError(handleError),
              finalize(setSuccess)
            );
          })
        )
      ),
    };
  })
);
