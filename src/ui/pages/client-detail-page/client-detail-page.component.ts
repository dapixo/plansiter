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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageModule } from 'primeng/message';
import { TranslocoModule } from '@jsverse/transloco';
import { TextareaModule } from 'primeng/textarea';
import { ClientStore } from '@application/stores/client.store';
import { LanguageService } from '@application/services/language.service';
import { BreadcrumbService } from '@application/services';
import { ClientSubjectsFormComponent } from '@ui/components/client-subjects-form/client-subjects-form.component';
import { ActionButtonComponent } from '@ui/components/action-button/action-button.component';

@Component({
  selector: 'app-client-detail-page',
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
  templateUrl: './client-detail-page.component.html',
  styleUrls: ['./client-detail-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientDetailPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(ClientStore);
  private readonly breadcrumbService = inject(BreadcrumbService);
  protected readonly lang = inject(LanguageService);

  protected readonly breadcrumbItems = this.breadcrumbService.createBreadcrumbItemsWithDynamicLabel(
    {
      parentLabel: 'clients.title',
      parentRoute: '/dashboard/clients'
    },
    () => this.client()?.name,
    'clients.detailClient'
  );

  protected readonly breadcrumbHome = this.breadcrumbService.createBreadcrumbHome();

  /** Router params */
  private readonly paramMap = toSignal(this.route.paramMap);
  protected readonly clientId = computed(() => this.paramMap()?.get('id') || null);
  protected readonly client = computed(() => {
    const id = this.clientId();
    return id ? this.store.clients().find((c) => c.id === id) ?? null : null;
  });

  /** UI State */
  protected readonly isReady = computed(() => !!this.client());
  protected readonly loading = computed(() => this.store.loading());
  protected readonly error = computed(() => this.store.error());

  /** Edition states per section */
  protected readonly editingInfo = signal(false);
  protected readonly editingNotes = signal(false);

  /** Forms per section */
  protected readonly infoForm = this.fb.group({
    name: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    address: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    city: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    postalCode: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    state: this.fb.control('', { nonNullable: true }),
    country: this.fb.control('', { validators: Validators.required, nonNullable: true }),
  });

  protected readonly notesForm = this.fb.group({
    notes: this.fb.control('', { nonNullable: true }),
  });

  /** Effect pour patcher les formulaires avec les données du client */
  private readonly _patchEffect = effect(() => {
    const client = this.client();
    if (!client) return;

    this.infoForm.patchValue({
      name: client.name,
      address: client.address,
      city: client.city,
      postalCode: client.postalCode ?? '',
      state: client.state ?? '',
      country: client.country,
    });
    this.notesForm.patchValue({ notes: client.notes ?? '' });
  });

  /** Obtenir les initiales du client */
  protected getInitials(): string {
    const name = this.client()?.name;
    if (!name) return '';

    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  /** Édition des informations (nom + adresse) */
  protected onEditInfo(): void {
    this.editingInfo.set(true);
  }

  protected onCancelInfo(): void {
    const client = this.client();
    if (client) {
      this.infoForm.patchValue({
        name: client.name,
        address: client.address,
        city: client.city,
        postalCode: client.postalCode ?? '',
        state: client.state ?? '',
        country: client.country,
      });
    }
    this.editingInfo.set(false);
  }

  protected onSaveInfo(): void {
    this.infoForm.markAllAsTouched();
    if (this.infoForm.invalid || this.loading()) return;

    const client = this.client();
    if (!client) return;

    const { name, address, city, postalCode, state, country } = this.infoForm.value;
    this.store.update({
      id: client.id,
      data: {
        name: name!,
        address: address!,
        city: city!,
        postalCode: postalCode || undefined,
        state: state || undefined,
        country: country!,
      },
    });

    this.editingInfo.set(false);
  }

  /** Édition des notes */
  protected onEditNotes(): void {
    this.editingNotes.set(true);
  }

  protected onCancelNotes(): void {
    const client = this.client();
    if (client) {
      this.notesForm.patchValue({ notes: client.notes ?? '' });
    }
    this.editingNotes.set(false);
  }

  protected onSaveNotes(): void {
    if (this.loading()) return;

    const client = this.client();
    if (!client) return;

    const { notes } = this.notesForm.value;
    this.store.update({
      id: client.id,
      data: { notes: notes || undefined },
    });

    this.editingNotes.set(false);
  }
}
