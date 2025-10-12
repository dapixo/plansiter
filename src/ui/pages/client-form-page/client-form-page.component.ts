import {
  Component,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TranslocoModule } from '@jsverse/transloco';
import { TextareaModule } from 'primeng/textarea';
import { Client } from '@domain/entities';
import { ClientStore } from '@application/stores/client.store';
import { AuthService } from '@application/services';
import { LanguageService } from '@application/services/language.service';

@Component({
  selector: 'app-client-form-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    MessageModule,
    TranslocoModule,
  ],
  templateUrl: './client-form-page.component.html',
  styleUrls: ['./client-form-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientFormPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(ClientStore);
  private readonly auth = inject(AuthService);
  protected readonly lang = inject(LanguageService);

  /** Router params + data */
  private readonly paramMap = toSignal(this.route.paramMap);
  private readonly clientId = computed(() => this.paramMap()?.get('id') || null);
  private readonly client = computed(() => {
    const id = this.clientId();
    return id ? this.store.clients().find((c) => c.id === id) ?? null : null;
  });
  protected readonly isEditMode = computed(() => !!this.clientId());
  protected readonly isFormReady = computed(() => !this.isEditMode() || !!this.client());
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
  protected readonly uiState = computed(() => ({
    ready: this.isFormReady(),
    loading: this.store.loading(),
    error: this.store.error(),
  }));

  private readonly shouldNavigateAfterSave = signal(false);
  private readonly previousLoadingState = signal(false);

  private readonly _patchEffect = effect(() => {
    const client = this.client();
    if (!client) return;
    this.form.reset({
      name: client.name,
      address: client.address,
      city: client.city,
      postalCode: client.postalCode ?? '',
      state: client.state ?? '',
      country: client.country,
      notes: client.notes ?? '',
    });
  });

  private readonly _navigationEffect = effect(() => {
    const isLoading = this.store.loading();
    const wasLoading = this.previousLoadingState();
    const shouldNavigate = this.shouldNavigateAfterSave();
    const hasError = this.store.error();

    this.previousLoadingState.set(isLoading);

    if (wasLoading && !isLoading && shouldNavigate && !hasError) {
      this.shouldNavigateAfterSave.set(false);
      const lang = this.lang.getCurrentLanguage();
      this.router.navigate([`/${lang}/dashboard/clients`]);
    }
  });

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.store.loading() || this.form.invalid) return;

    const payload = this.getClientPayload();
    const user = this.auth.currentUser();

    if (!user?.id) {
      this.store.setError('No user logged in');
      return;
    }

    const currentClient = this.client();
    this.shouldNavigateAfterSave.set(true);

    if (currentClient) {
      this.store.update({ id: currentClient.id, data: payload });
    } else {
      this.store.create({
        ...payload,
        userId: user.id,
      } as Omit<Client, 'id' | 'createdAt' | 'updatedAt'>);
    }
  }

  private getClientPayload(): Partial<Client> {
    const { name, address, city, postalCode, state, country, notes } = this.form.value;
    return {
      name: name!,
      address: address!,
      city: city!,
      postalCode: postalCode || undefined,
      state: state || undefined,
      country: country!,
      notes: notes || undefined,
    };
  }
}
