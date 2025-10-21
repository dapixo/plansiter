import {
  Component,
  inject,
  computed,
  output,
  model,
  effect,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { TranslocoModule } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';

import { Subject, Booking, Client, Service } from '@domain/entities';
import { AuthService } from '@application/services';
import { BookingStore } from '@application/stores/booking.store';
import { ClientStore } from '@application/stores/client.store';
import { ServiceStore } from '@application/stores/service.store';
import { SubjectFormDialogComponent } from '../subject-form-dialog/subject-form-dialog.component';
import { ClientFormDialogComponent } from '../client-form-dialog/client-form-dialog.component';
import { ServiceFormDialogComponent } from '../service-form-dialog/service-form-dialog.component';
import { ActionButtonComponent } from '../action-button/action-button.component';

@Component({
  selector: 'app-booking-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    MessageModule,
    TranslocoModule,
    SubjectFormDialogComponent,
    ClientFormDialogComponent,
    ServiceFormDialogComponent,
    ActionButtonComponent,
  ],
  providers: [BookingStore, ClientStore, ServiceStore],
  templateUrl: './booking-form-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  // Stores
  private readonly bookingStore = inject(BookingStore);
  protected readonly clientStore = inject(ClientStore);
  protected readonly serviceStore = inject(ServiceStore);

  // Model for dialog visibility
  readonly bookingDialogVisible = model<boolean>(false);

  // UI States
  protected readonly loading = computed(() => this.bookingStore.loading());
  protected readonly error = computed(() => this.bookingStore.error());
  protected readonly success = computed(() => this.bookingStore.success());
  protected readonly lastCreated = computed(() => this.bookingStore.lastCreated());

  // Outputs
  readonly bookingCreated = output<Booking>();

  // Sub-dialogs visibility
  clientDialogVisible = model(false);
  subjectDialogVisible = model(false);
  serviceDialogVisible = model(false);

  // Form
  protected readonly bookingForm: FormGroup<{
    clientId: FormControl<string>;
    serviceId: FormControl<string>;
    subjectId: FormControl<string>;
    startDate: FormControl<Date | null>;
    endDate: FormControl<Date | null>;
    notes: FormControl<string>;
  }> = this.fb.group({
    clientId: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    serviceId: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    subjectId: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    startDate: this.fb.control<Date | null>(null, { validators: Validators.required }),
    endDate: this.fb.control<Date | null>(null, { validators: Validators.required }),
    notes: this.fb.control('', { nonNullable: true }),
  });

  // Signals pour les valueChanges
  private readonly clientIdValue = toSignal(this.bookingForm.controls.clientId.valueChanges, {
    initialValue: '',
  });

  // Signal pour tracker la valeur précédente du clientId
  private readonly previousClientId = signal<string>('');

  // Computed: derive options from stores
  readonly clientOptions = computed(() =>
    this.clientStore.clients().map((c) => ({ label: c.name, value: c.id }))
  );

  readonly serviceOptions = computed(() =>
    this.serviceStore.services().map((s) => ({ label: s.name, value: s.id }))
  );

  /** Liste des subjects filtrés selon le client sélectionné */
  readonly subjectOptions = computed(() => {
    const clientId = this.clientIdValue(); // Utiliser le signal pour la réactivité
    const allSubjects = this.clientStore.subjects();
    return allSubjects
      .filter((s) => !clientId || s.clientId === clientId)
      .map((s) => ({ label: s.name, value: s.id }));
  });

  // Effects
  private successEffect_ = effect(() => {
    const success = this.success();
    const lastCreated = this.lastCreated();
    if (success && lastCreated) {
      this.bookingCreated.emit(lastCreated);
      this.bookingDialogVisible.set(false);
      this.bookingForm.reset();
    }
  });

  /** Réinitialise le champ subjectId quand le client change */
  private readonly resetSubjectEffect_ = effect(() => {
    const currentClientId = this.clientIdValue();
    const prevClientId = this.previousClientId();

    // Réinitialiser uniquement si le clientId a vraiment changé (pas au premier render)
    if (prevClientId && currentClientId !== prevClientId) {
      this.bookingForm.controls.subjectId.setValue('', { emitEvent: false });
    }

    // Mettre à jour la valeur précédente
    this.previousClientId.set(currentClientId);
  });

  protected onSave(): void {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return this.bookingStore.setError('No user logged in');

    this.bookingForm.markAllAsTouched();
    this.bookingForm.markAllAsDirty();
    if (this.bookingForm.invalid || this.loading()) return;

    const { clientId, serviceId, subjectId, startDate, endDate, notes } =
      this.bookingForm.getRawValue();

    if (!startDate || !endDate)
      return this.bookingStore.setError('Start and end dates are required');

    this.bookingStore.create({
      sitterId: userId,
      clientId,
      serviceId,
      subjectId,
      startDate,
      endDate,
      notes: notes || undefined,
      status: 'pending',
    });
  }

  protected onHide(event: boolean): void {
    if (!event) {
      this.bookingDialogVisible.set(false);
      this.bookingForm.reset();
    }
  }

  // Sub-dialogs handlers
  onClientCreated(client: Client): void {
    this.bookingForm.controls.clientId.setValue(client.id);
  }

  onSubjectCreated(subject: Subject): void {
    this.bookingForm.controls.subjectId.setValue(subject.id);
  }

  onServiceCreated(service: Service): void {
    this.bookingForm.controls.serviceId.setValue(service.id);
  }
}
