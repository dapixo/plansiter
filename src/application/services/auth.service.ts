import { inject, Injectable, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { SupabaseService } from '@infrastructure/supabase/supabase.client';
import { User, AuthOtpResponse, Session } from '@supabase/supabase-js';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, filter, first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  private isAuthenticatedSignal = signal<boolean>(false);
  private currentUserSignal = signal<User | null>(null);
  private sessionLoadedSubject = new BehaviorSubject<boolean>(false);

  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly sessionLoaded$ = this.sessionLoadedSubject.asObservable();

  // Computed signal for user display name with fallback
  readonly userDisplayName = computed(() => {
    const user = this.currentUser();
    if (!user) return 'User';
    return user.user_metadata?.['full_name'] || user.email?.split('@')[0] || 'User';
  });

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

  verifyOtpCode(
    email: string,
    code: string
  ): Observable<{ user: User | null; session: Session | null }> {
    return this.supabase.verifyOtp(email, code).pipe(
      tap(({ user, session }) => {
        if (user && session) {
          this.updateAuthState(session);
          this.router.navigate(['/dashboard']);
        }
      })
    );
  }

  updateUserProfile(params: { email?: string; name?: string }): Observable<User> {
    const { email, name } = params;

    const updateData: any = {};
    if (email) updateData.email = email;
    if (name) updateData.data = { full_name: name };

    if (Object.keys(updateData).length === 0) {
      throw new Error('At least one field (email or name) must be provided');
    }

    return this.supabase
      .updateUser(updateData)
      .pipe(tap((user) => this.currentUserSignal.set(user)));
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
    this.supabase
      .getSession()
      .pipe(
        tap((session) => {
          this.updateAuthState(session);
          this.sessionLoadedSubject.next(true);
        }),
        catchError(() => {
          this.sessionLoadedSubject.next(true);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  waitForSessionLoad(): Observable<boolean> {
    return this.sessionLoadedSubject.pipe(
      filter((loaded) => loaded),
      first()
    );
  }
}
