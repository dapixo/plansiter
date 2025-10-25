import { Component, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TranslocoModule } from '@jsverse/transloco';
import { TextareaModule } from 'primeng/textarea';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Client } from '@domain/entities';
import { ClientStore } from '@application/stores/client.store';
import { AuthService } from '@application/services';
import { LanguageService } from '@application/services/language.service';
import {
  ClientManagementService,
  TempSubject,
} from '@application/services/client-management.service';
import { SubjectsManagerComponent } from '@ui/components/subjects-manager/subjects-manager.component';
import { ActionButtonComponent } from '@ui/components/action-button/action-button.component';

@Component({
  selector: 'app-client-form-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    InputTextModule,
    TextareaModule,
    MessageModule,
    TranslocoModule,
    SubjectsManagerComponent,
    ActionButtonComponent,
  ],
  templateUrl: './client-form-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientFormPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly clientManagement = inject(ClientManagementService);
  private readonly store = inject(ClientStore);
  private readonly auth = inject(AuthService);
  protected readonly lang = inject(LanguageService);

  /** Formulaire client */
  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    city: ['', Validators.required],
    postalCode: ['', Validators.required],
    state: [''],
    country: ['', Validators.required],
    notes: [''],
  });

  /** Liste temporaire de subjects */
  protected readonly currentSubjects = signal<TempSubject[]>([]);

  /** Store accessible dans le template */
  protected readonly clientStore = this.store;

  /** Soumission du formulaire */
  protected onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.store.loading() || this.form.invalid) return;

    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    const clientPayload = this.getClientPayload(userId);
    const subjects = this.currentSubjects();

    this.clientManagement
      .createClientWithSubjects(clientPayload, subjects)
      .pipe(
        tap(() => {
          const lang = this.lang.getCurrentLanguage();
          this.router.navigateByUrl(`/${lang}/dashboard/clients`);
        }),
        catchError((error) => {
          console.error('❌ Error creating client and subjects:', error);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /** Construction du payload à partir du formulaire */
  private getClientPayload(userId: string): Omit<Client, 'id' | 'createdAt' | 'updatedAt'> {
    const { name, address, city, postalCode, state, country, notes } = this.form.getRawValue();
    return {
      userId,
      name,
      address,
      city,
      postalCode,
      state: state || undefined,
      country,
      notes: notes || undefined,
    };
  }

  /** Handler pour la sortie du composant enfant */
  protected onSubjectsChange(subjects: TempSubject[]): void {
    this.currentSubjects.set(subjects);
  }
}
