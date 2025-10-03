import { Observable } from 'rxjs';
import { Booking } from '../../entities';
import { IBookingRepository } from '../../repositories';

export class CreateBookingUseCase {
  constructor(private bookingRepository: IBookingRepository) {}

  execute(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Observable<Booking> {
    return this.bookingRepository.create(booking);
  }
}
