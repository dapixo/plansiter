import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState, withHooks } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe, switchMap, tap, catchError, finalize } from 'rxjs';
import { Booking, ComputedBookingStatus } from '@domain/entities';
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
    // Computed qui recalcule le status de chaque booking basé sur les dates
    bookingsWithStatus: computed(() =>
      state.bookings().map(booking => ({
        ...booking,
        computedStatus: calculateBookingStatus(booking),
      }))
    ),
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

      loadAll: rxMethod<void>(
        pipe(
          tap(setLoading),
          switchMap(() => {
            const userId = getUserId();
            if (!userId) {
              patchState(store, { bookings: [], loading: false, error: 'No user logged in' });
              return EMPTY;
            }
            return repo.getBySitterId(userId).pipe(
              tap((bookings) =>
                patchState(store, { bookings })
              ),
              catchError(handleError),
              finalize(setSuccess)
            );
          })
        )
      ),

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

      // Annuler un booking
      cancelBooking: rxMethod<string>(
        pipe(
          tap(setLoading),
          switchMap((id) => {
            const userId = getUserId();
            if (!userId) return handleError(new Error('No user logged in'));

            return repo.update(id, userId, { isCancelled: true }).pipe(
              tap((updatedBooking) =>
                patchState(store, { bookings: updateBookingInList(store.bookings(), updatedBooking) })
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

// Fonction utilitaire pour calculer le status basé sur les dates
export function calculateBookingStatus(booking: Booking, now: Date = new Date()): ComputedBookingStatus {
  if (booking.isCancelled) return 'cancelled';

  // Normaliser les heures pour les comparaisons
  const bookingStart = new Date(booking.startDate);
  bookingStart.setHours(0, 0, 0, 0);

  const bookingEnd = new Date(booking.endDate);
  bookingEnd.setHours(0, 0, 0, 0);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (today < bookingStart) return 'pending';
  if (today >= bookingStart && today <= bookingEnd) return 'in-progress';
  return 'completed';
}
