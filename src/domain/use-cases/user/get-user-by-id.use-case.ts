import { Observable } from 'rxjs';
import { User } from '../../entities';
import { IUserRepository } from '../../repositories';

export class GetUserByIdUseCase {
  constructor(private userRepository: IUserRepository) {}

  execute(id: string): Observable<User | null> {
    return this.userRepository.getById(id);
  }
}
