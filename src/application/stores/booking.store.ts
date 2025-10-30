import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
  withHooks,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { of, pipe, switchMap, tap, catchError, finalize } from 'rxjs';
import { Booking, bookingStatus } from '@domain/entities';
import { IBookingRepository, BOOKING_REPOSITORY } from '@domain/repositories';
import { AuthService } from '../services/auth.service';
import { ClientStore } from './client.store';
import { ServiceStore } from './service.store';
import { BookingDetail, TimelineBar } from '@ui/components/calendar';
import { updateInList, removeFromList, normalizeDate, createStoreHelpers, createStoreOnInit } from './store.utils';

interface BookingState {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  success: boolean;
  lastCreated: Booking | null;
  selectedBookingDetail: BookingDetail | null;
}

const initialState: BookingState = {
  bookings: [],
  loading: false,
  error: null,
  success: false,
  lastCreated: null,
  selectedBookingDetail: null,
};

export const BookingStore = signalStore(
  withState(initialState),

  withComputed((state, clientStore = inject(ClientStore)) => ({
    bookingsCount: computed(() => state.bookings().length),

    timelineBars: computed((): TimelineBar[] => {
      const subjectsById = new Map(clientStore.subjects().map((s) => [s.id, s]));      
      const result = state.bookings().map((booking) => (
        {
        ...booking,
        subjectName: subjectsById.get(booking.subjectId)?.name ?? 'Unknown',
        status: calculateBookingStatus(booking),
      }
    ));

      return result;
    }),

    selectedDetail: computed(() => state.selectedBookingDetail()),
  })),

  withMethods(
    (
      store,
      repo = inject<IBookingRepository>(BOOKING_REPOSITORY),
      auth = inject(AuthService),
      clientStore = inject(ClientStore),
      serviceStore = inject(ServiceStore)
    ) => {
      const { setLoading, setError, setSuccess, handleError, runAuthenticated } =
        createStoreHelpers((state) => patchState(store, state), auth);
      return {
        setError,
        clearSelectedDetail: () => patchState(store, { selectedBookingDetail: null }),

        loadAll: rxMethod<void>(
          pipe(
            tap(setLoading),
            switchMap(() =>
              runAuthenticated((userId) =>
                repo.getBySitterId(userId).pipe(
                  tap((bookings) => patchState(store, { bookings })),
                  tap(setSuccess),
                  catchError(handleError),
                  finalize(() => patchState(store, { loading: false }))
                )
              )
            )
          )
        ),

        create: rxMethod<Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>>(
          pipe(
            tap(setLoading),
            switchMap((data) =>
              repo.create(data).pipe(
                tap((newBooking) =>
                  patchState(store, {
                    bookings: [...store.bookings(), newBooking],
                    lastCreated: newBooking,
                  })
                ),
                tap(setSuccess),
                catchError(handleError),
                finalize(() => patchState(store, { loading: false }))
              )
            )
          )
        ),

        update: rxMethod<{ id: string; data: Partial<Booking> }>(
          pipe(
            tap(setLoading),
            switchMap(({ id, data }) =>
              runAuthenticated((userId) =>
                repo.update(id, userId, data).pipe(
                  tap((updatedBooking) =>
                    patchState(store, {
                      bookings: updateInList(store.bookings(), updatedBooking),
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
                      bookings: removeFromList(store.bookings(), id),
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

        cancelBooking: rxMethod<string>(
          pipe(
            tap(setLoading),
            switchMap((id) =>
              runAuthenticated((userId) =>
                repo.update(id, userId, { isCancelled: true }).pipe(
                  tap((updated) =>
                    patchState(store, {
                      bookings: updateInList(store.bookings(), updated),
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

        getBookingDetail: rxMethod<string>(
          pipe(
            tap(setLoading),
            switchMap((bookingId) => {
              const booking = store.bookings().find((b) => b.id === bookingId);
              if (!booking) return handleError(new Error('Booking not found in store'));

              const client = clientStore.clients().find((c) => c.id === booking.clientId);
              const subject = clientStore.subjects().find((s) => s.id === booking.subjectId);
              const service = serviceStore.services().find((s) => s.id === booking.serviceId);

              if (!client || !subject || !service) {
                return handleError(new Error('Missing related data in store'));
              }

              const detail: BookingDetail = {
                ...booking,
                subjectName: subject.name,
                status: calculateBookingStatus(booking),
                clientName: client.name,
                clientAddress: `${client.address}, ${client.postalCode} ${client.city}${
                  client.state ? ', ' + client.state : ''
                }, ${client.country}`,
                serviceName: service.name,
              };

              patchState(store, { selectedBookingDetail: detail });
              setSuccess();
              return of(detail);
            }),
            catchError(handleError),
            finalize(() => patchState(store, { loading: false }))
          )
        ),
      };
    }
  ),

  withHooks({
    onInit: createStoreOnInit(
      (store) => store.loadAll(),
      (store) => store.bookings().length > 0
    ),
  })
);

export function calculateBookingStatus(booking: Booking, now: Date = new Date()): bookingStatus {
  if (booking.isCancelled) return 'cancelled';

  const bookingStart = normalizeDate(booking.startDate);
  const bookingEnd = normalizeDate(booking.endDate);
  const today = normalizeDate(now);

  if (today < bookingStart) return 'pending';
  if (today >= bookingStart && today <= bookingEnd) return 'in-progress';
  return 'completed';
}
