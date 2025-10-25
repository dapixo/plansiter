import { Injectable } from '@angular/core';
import {
  createClient,
  SupabaseClient,
  AuthOtpResponse,
  User,
  Session,
  AuthError,
} from '@supabase/supabase-js';
import { from, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly supabaseClient: SupabaseClient;

  constructor() {
    this.supabaseClient = createClient(environment.supabase.url, environment.supabase.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
  }

  get client(): SupabaseClient {
    return this.supabaseClient;
  }

  // Authentication avec OTP
  signInWithOtp(email: string): Observable<AuthOtpResponse> {
    const name = (email.split('@')[0] || '').trim();

    return from(
      this.supabaseClient.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: { full_name: name },
        },
      })
    ).pipe(catchError((error: AuthError) => throwError(() => error)));
  }

  verifyOtp(
    email: string,
    token: string
  ): Observable<{ user: User | null; session: Session | null }> {
    return from(
      this.supabaseClient.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })
    ).pipe(
      map((response) => {
        if (response.error) throw response.error;
        return {
          user: response.data.user,
          session: response.data.session,
        };
      }),
      catchError((error: AuthError) => throwError(() => error))
    );
  }

  signOut(): Observable<void> {
    return from(this.supabaseClient.auth.signOut()).pipe(
      map((response) => {
        if (response.error) throw response.error;
      }),
      catchError((error: AuthError) => throwError(() => error))
    );
  }

  getCurrentUser(): Observable<User | null> {
    return from(this.supabaseClient.auth.getUser()).pipe(
      map((response) => {
        if (response.error) throw response.error;
        return response.data.user;
      }),
      catchError((error: AuthError) => throwError(() => error))
    );
  }

  getSession(): Observable<Session | null> {
    return from(this.supabaseClient.auth.getSession()).pipe(
      map((response) => {
        if (response.error) throw response.error;
        return response.data.session;
      }),
      catchError((error: AuthError) => throwError(() => error))
    );
  }

  updateUser(updates: { email?: string; data?: { [key: string]: any } }): Observable<User> {
    return from(this.supabaseClient.auth.updateUser(updates)).pipe(
      map((response) => {
        if (response.error) throw response.error;
        if (!response.data.user) throw new Error('No user returned');
        return response.data.user;
      }),
      catchError((error: AuthError) => throwError(() => error))
    );
  }

  // Méthode générique pour les requêtes Supabase
  from$<T = any>(table: string, queryFn: (query: any) => any): Observable<{ data: T; error: any }> {
    return from(queryFn(this.supabaseClient.from(table))) as Observable<{ data: T; error: any }>;
  }
}
