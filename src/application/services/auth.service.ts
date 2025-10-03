import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '@infrastructure/supabase/supabase.client';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSignal = signal<boolean>(false);
  private currentUserSignal = signal<any>(null);

  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  readonly currentUser = this.currentUserSignal.asReadonly();

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.initAuthListener();
  }

  private initAuthListener() {
    this.supabase.onAuthStateChange((event, session) => {
      if (session?.user) {
        this.isAuthenticatedSignal.set(true);
        this.currentUserSignal.set(session.user);
      } else {
        this.isAuthenticatedSignal.set(false);
        this.currentUserSignal.set(null);
      }
    });
  }

  async sendOtpCode(email: string): Promise<void> {
    try {
      await this.supabase.signInWithOtp(email);
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }

  async verifyOtpCode(email: string, code: string): Promise<void> {
    try {
      await this.supabase.verifyOtp(email, code);
      const user = await this.supabase.getCurrentUser();
      this.isAuthenticatedSignal.set(true);
      this.currentUserSignal.set(user);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.supabase.signOut();
      this.isAuthenticatedSignal.set(false);
      this.currentUserSignal.set(null);
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  async checkSession(): Promise<boolean> {
    try {
      const session = await this.supabase.getSession();
      if (session?.user) {
        this.isAuthenticatedSignal.set(true);
        this.currentUserSignal.set(session.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  }
}
