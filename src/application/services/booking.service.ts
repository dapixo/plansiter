import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Booking } from '@domain/entities';
import { CreateBookingUseCase, GetBookingsByClientUseCase } from '@domain/use-cases';
import { IBookingRepository, BOOKING_REPOSITORY } from '@domain/repositories';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private bookingsSignal = signal<Booking[]>([]);
  readonly bookings = this.bookingsSignal.asReadonly();

  private bookingRepository = inject<IBookingRepository>(BOOKING_REPOSITORY);

  createBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Observable<Booking> {
    const useCase = new CreateBookingUseCase(this.bookingRepository);
    return useCase.execute(booking);
  }

  getBookingsByClient(clientId: string): Observable<Booking[]> {
    const useCase = new GetBookingsByClientUseCase(this.bookingRepository);
    return useCase.execute(clientId);
  }

  setBookings(bookings: Booking[]): void {
    this.bookingsSignal.set(bookings);
  }
}
