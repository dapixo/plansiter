import { Observable } from 'rxjs';
import { Booking } from '../../entities';
import { IBookingRepository } from '../../repositories';

export class GetBookingsByClientUseCase {
  constructor(private bookingRepository: IBookingRepository) {}

  execute(clientId: string): Observable<Booking[]> {
    return this.bookingRepository.getByClientId(clientId);
  }
}
