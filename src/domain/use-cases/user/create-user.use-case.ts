import { Observable } from 'rxjs';
import { User } from '../../entities';
import { IUserRepository } from '../../repositories';

export class CreateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  execute(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Observable<User> {
    return this.userRepository.create(user);
  }
}
