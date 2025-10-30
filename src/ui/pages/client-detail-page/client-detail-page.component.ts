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
import { MessageModule } from 'primeng/message';
import { TranslocoModule } from '@jsverse/transloco';
import { TextareaModule } from 'primeng/textarea';
import { ClientStore } from '@application/stores/client.store';
import { LanguageService } from '@application/services/language.service';
import { SubjectsManagerComponent } from '@ui/components/subjects-manager/subjects-manager.component';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-client-detail-page',
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
    ButtonModule
  ],
  templateUrl: './client-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientDetailPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(ClientStore);
  protected readonly lang = inject(LanguageService);

  private readonly paramMap = toSignal(this.route.paramMap);
  protected readonly clientId = computed(() => this.paramMap()?.get('id'));
  protected readonly client = computed(
    () => this.store.clients().find((c) => c.id === this.clientId()) ?? null
  );

  protected readonly isReady = computed(() => !!this.client());
  protected readonly loading = this.store.loading;
  protected readonly error = this.store.error;

  protected readonly editingInfo = signal(false);
  protected readonly editingNotes = signal(false);

  protected readonly infoForm = this.fb.group({
    name: this.fb.nonNullable.control('', Validators.required),
    address: this.fb.nonNullable.control('', Validators.required),
    city: this.fb.nonNullable.control('', Validators.required),
    postalCode: this.fb.nonNullable.control('', Validators.required),
    state: this.fb.nonNullable.control(''),
    country: this.fb.nonNullable.control('', Validators.required),
  });

  protected readonly notesForm = this.fb.group({
    notes: this.fb.nonNullable.control(''),
  });


  private readonly patchEffect = effect(() => {
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

  protected getInitials(): string {
    const name = this.client()?.name;
    return name
      ? name
          .split(' ')
          .map((word) => word[0]?.toUpperCase() ?? '')
          .slice(0, 2)
          .join('')
      : '';
  }

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

    const { name, address, city, postalCode, state, country } = this.infoForm.getRawValue();

    this.store.update({
      id: client.id,
      data: {
        name,
        address,
        city,
        postalCode: postalCode || undefined,
        state: state || undefined,
        country,
      },
    });

    this.editingInfo.set(false);
  }

  protected onEditNotes(): void {
    this.editingNotes.set(true);
  }

  protected onCancelNotes(): void {
    const client = this.client();
    if (client) this.notesForm.patchValue({ notes: client.notes ?? '' });
    this.editingNotes.set(false);
  }

  protected onSaveNotes(): void {
    if (this.loading()) return;

    const client = this.client();
    if (!client) return;

    const { notes } = this.notesForm.getRawValue();

    this.store.update({
      id: client.id,
      data: { notes: notes || undefined },
    });

    this.editingNotes.set(false);
  }
}
