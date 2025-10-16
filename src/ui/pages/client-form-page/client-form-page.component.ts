import {
  Component,
  inject,
  signal,
  computed,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { TextareaModule } from 'primeng/textarea';
import { MenuItem } from 'primeng/api';
import { tap, catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { Client } from '@domain/entities';
import { ClientStore } from '@application/stores/client.store';
import { AuthService } from '@application/services';
import { LanguageService } from '@application/services/language.service';
import { ClientManagementService, TempSubject } from '@application/services/client-management.service';
import { ClientSubjectsFormComponent } from '@ui/components/client-subjects-form/client-subjects-form.component';
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
    BreadcrumbModule,
    MessageModule,
    TranslocoModule,
    ClientSubjectsFormComponent,
    ActionButtonComponent,
  ],
  templateUrl: './client-form-page.component.html',
  styleUrls: ['./client-form-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientFormPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly clientManagement = inject(ClientManagementService);
  private readonly store = inject(ClientStore);
  private readonly auth = inject(AuthService);
  private readonly transloco = inject(TranslocoService);
  protected readonly lang = inject(LanguageService);

  protected readonly breadcrumbItems = computed<MenuItem[]>(() => [
    {
      label: this.transloco.translate('clients.title'),
      routerLink: `/${this.lang.getCurrentLanguage()}/dashboard/clients`
    },
    {
      label: this.transloco.translate('clients.createClient')
    }
  ]);

  protected readonly breadcrumbHome: MenuItem = {
    icon: 'pi pi-home',
    routerLink: `/${this.lang.getCurrentLanguage()}/dashboard`
  };

  protected readonly form = this.fb.group<{
    name: FormControl<string>;
    address: FormControl<string>;
    city: FormControl<string>;
    postalCode: FormControl<string>;
    state: FormControl<string>;
    country: FormControl<string>;
    notes: FormControl<string>;
  }>({
    name: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    address: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    city: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    postalCode: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    state: this.fb.control('', { nonNullable: true }),
    country: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    notes: this.fb.control('', { nonNullable: true }),
  });

  /** Subjects state */
  private readonly currentSubjects = signal<TempSubject[]>([]);

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.store.loading() || this.form.invalid) return;

    const user = this.auth.currentUser();
    if (!user?.id)  return;

    const clientPayload = this.getClientPayload(user.id);
    const subjects = this.currentSubjects();

    // Utilisation du service d'orchestration
    this.clientManagement.createClientWithSubjects(clientPayload, subjects).pipe(
      tap(() => {
        const lang = this.lang.getCurrentLanguage();
        this.router.navigate([`/${lang}/dashboard/clients`]);
      }),
      catchError(error => {
        console.error('Error creating client and subjects:', error);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  private getClientPayload(userId: string): Omit<Client, 'id' | 'createdAt' | 'updatedAt'> {
    const { name, address, city, postalCode, state, country, notes } = this.form.value;
    return {
      userId,
      name: name!,
      address: address!,
      city: city!,
      postalCode: postalCode!,
      state: state || undefined,
      country: country!,
      notes: notes || undefined,
    };
  }

  /** Handler pour l'output du composant enfant */
  protected onSubjectsChange(subjects: TempSubject[]): void {
    this.currentSubjects.set(subjects);
  }

  protected clientStore = this.store;
}
