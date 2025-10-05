import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TranslocoModule } from '@jsverse/transloco';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Client } from '@domain/entities';
import { ClientStore } from '@application/stores/client.store';
import { AuthService } from '@application/services';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    MessageModule,
    TranslocoModule
  ],
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientFormComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly store = inject(ClientStore);
  private readonly config = inject(DynamicDialogConfig);
  private readonly ref = inject(DynamicDialogRef);
  private readonly authService = inject(AuthService);

  client = signal<Client | null>(this.config.data?.client || null);
  formTouched = signal(false);

  form = (() => {
    const client = this.client();

    return this.fb.group<{
      name: FormControl<string>;
      address: FormControl<string>;
      city: FormControl<string>;
      postalCode: FormControl<string>;
      state: FormControl<string>;
      country: FormControl<string>;
      notes: FormControl<string>;
    }>({
      name: this.fb.control(client?.name || '', { validators: Validators.required, nonNullable: true }),
      address: this.fb.control(client?.address || '', { validators: Validators.required, nonNullable: true }),
      city: this.fb.control(client?.city || '', { validators: Validators.required, nonNullable: true }),
      postalCode: this.fb.control(client?.postalCode || '', { nonNullable: true }),
      state: this.fb.control(client?.state || '', { nonNullable: true }),
      country: this.fb.control(client?.country || '', { validators: Validators.required, nonNullable: true }),
      notes: this.fb.control(client?.notes || '', { nonNullable: true })
    });
  })();

  protected onSubmit(): void {
    if (this.store.loading()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formTouched.set(true);
      return;
    }

    const formValue = this.form.value;
    const currentClient = this.client();

    const clientData: Partial<Client> = {
      name: formValue.name!,
      address: formValue.address!,
      city: formValue.city!,
      postalCode: formValue.postalCode || undefined,
      state: formValue.state || undefined,
      country: formValue.country!,
      notes: formValue.notes || undefined
    };

    if (currentClient) {
      this.store.update({ id: currentClient.id, data: clientData });
    } else {
      const currentUser = this.authService.currentUser();
      if (!currentUser?.id) {
        this.store.setError('No user logged in');
        return;
      }
      this.store.create({ ...clientData, userId: currentUser.id } as Omit<Client, 'id' | 'createdAt' | 'updatedAt'>);
    }

    this.ref.close();
  }

  protected onCancel(event: Event): void {
    event.stopPropagation();
    this.ref.close();
  }
}
