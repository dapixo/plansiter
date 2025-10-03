import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '@domain/entities';
import { GetUserByIdUseCase, CreateUserUseCase } from '@domain/use-cases';
import { IUserRepository, USER_REPOSITORY } from '@domain/repositories';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUserSignal = signal<User | null>(null);
  readonly currentUser = this.currentUserSignal.asReadonly();

  private userRepository = inject<IUserRepository>(USER_REPOSITORY);

  getUserById(id: string): Observable<User | null> {
    const useCase = new GetUserByIdUseCase(this.userRepository);
    return useCase.execute(id);
  }

  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Observable<User> {
    const useCase = new CreateUserUseCase(this.userRepository);
    return useCase.execute(user);
  }

  setCurrentUser(user: User | null): void {
    this.currentUserSignal.set(user);
  }
}
