import { inject, Injectable, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { SupabaseService } from '@infrastructure/supabase/supabase.client';
import { User, AuthOtpResponse, Session } from '@supabase/supabase-js';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap, catchError, filter, first, switchMap } from 'rxjs/operators';
import { IUserRepository, USER_REPOSITORY } from '@domain/repositories';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private userRepository = inject<IUserRepository>(USER_REPOSITORY);

  private isAuthenticatedSignal = signal<boolean>(false);
  private currentUserSignal = signal<User | null>(null);
  private sessionLoadedSubject = new BehaviorSubject<boolean>(false);

  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly sessionLoaded$ = this.sessionLoadedSubject.asObservable();

  constructor() {
    this.initAuthListener();
    this.checkSession();
  }

  private initAuthListener(): void {
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this.updateAuthState(session);
    });
  }

  private updateAuthState(session: Session | null): void {
    if (session?.user) {
      this.isAuthenticatedSignal.set(true);
      this.currentUserSignal.set(session.user);
    } else {
      this.isAuthenticatedSignal.set(false);
      this.currentUserSignal.set(null);
    }
  }

  sendOtpCode(email: string): Observable<AuthOtpResponse> {
    return this.supabase.signInWithOtp(email);
  }

  verifyOtpCode(email: string, code: string): Observable<{ user: User | null; session: Session | null }> {
    return this.supabase.verifyOtp(email, code).pipe(
      switchMap(({ user, session }) => {
        if (user && session) {
          return this.ensureUserExists(user).pipe(
            tap(() => {
              this.updateAuthState(session);
              this.router.navigate(['/dashboard']);
            }),
            switchMap(() => of({ user, session }))
          );
        }
        return of({ user, session });
      })
    );
  }

  private ensureUserExists(authUser: User): Observable<any> {
    return this.userRepository.getById(authUser.id).pipe(
      switchMap(existingUser => {
        if (existingUser) {
          return of(existingUser);
        }

        const newUser = {
          id: authUser.id,
          email: authUser.email!,
          firstName: '',
          lastName: '',
          phone: authUser.phone,
          avatarUrl: authUser.user_metadata?.['avatar_url']
        };

        return this.userRepository.create(newUser);
      }),
      catchError(error => {
        console.error('Error ensuring user exists:', error);
        return of(null);
      })
    );
  }

  signOut(): Observable<void> {
    return this.supabase.signOut().pipe(
      tap(() => {
        this.updateAuthState(null);
        this.router.navigate(['/']);
      })
    );
  }

  private checkSession(): void {
    this.supabase.getSession().pipe(
      tap(session => {
        this.updateAuthState(session);
        this.sessionLoadedSubject.next(true);
      }),
      catchError(() => {
        this.sessionLoadedSubject.next(true);
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  waitForSessionLoad(): Observable<boolean> {
    return this.sessionLoadedSubject.pipe(
      filter(loaded => loaded),
      first()
    );
  }
}
