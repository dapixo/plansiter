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

import { Booking, Client, Service } from '@domain/entities';
import { AuthService } from '@application/services';
import { BookingStore } from '@application/stores/booking.store';
import { ClientStore } from '@application/stores/client.store';
import { ServiceStore } from '@application/stores/service.store';
import { SubjectFormDialogComponent } from '../subject-form-dialog/subject-form-dialog.component';
import { ClientFormDialogComponent } from '../client-form-dialog/client-form-dialog.component';
import { ServiceFormDialogComponent } from '../service-form-dialog/service-form-dialog.component';

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
  ],
  templateUrl: './booking-form-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly bookingStore = inject(BookingStore);
  protected readonly clientStore = inject(ClientStore);
  protected readonly serviceStore = inject(ServiceStore);

  // === UI State ===
  readonly bookingDialogVisible = model(false);
  readonly clientDialogVisible = model(false);
  readonly subjectDialogVisible = model(false);
  readonly serviceDialogVisible = model(false);

  // === Store bindings ===
  readonly loading = computed(() => this.bookingStore.loading());
  readonly error = computed(() => this.bookingStore.error());
  readonly success = computed(() => this.bookingStore.success());
  readonly lastCreated = computed(() => this.bookingStore.lastCreated());
  readonly bookingCreated = output<Booking>();

  // === Form ===
  readonly bookingForm: FormGroup<{
    clientId: FormControl<string>;
    serviceId: FormControl<string>;
    subjectId: FormControl<string>;
    dateRange: FormControl<Date[] | null>;
    notes: FormControl<string>;
  }> = this.fb.group({
    clientId: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    serviceId: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    subjectId: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    dateRange: this.fb.control<Date[] | null>(null, { validators: Validators.required }),
    notes: this.fb.control('', { nonNullable: true }),
  });

  // === Signals ===
  private readonly clientIdValue = toSignal(this.bookingForm.controls.clientId.valueChanges, { initialValue: '' });
  private readonly subjectIdValue = toSignal(this.bookingForm.controls.subjectId.valueChanges, { initialValue: '' });

  private readonly prevClientId = signal<string>('');
  private readonly prevSubjectId = signal<string>('');

  // === Computed ===
  readonly clientOptions = computed(() =>
    this.clientStore.activeClients().map(this.toOption)
  );

  readonly subjectOptions = computed(() => {
    const clientId = this.clientIdValue();
    return this.clientStore
      .activeSubjects()
      .filter(s => !clientId || s.clientId === clientId)
      .map(this.toOption);
  });

  private readonly selectedSubjectType = computed(() => {
    const subjectId = this.subjectIdValue();
    const subject = this.clientStore.activeSubjects().find(s => s.id === subjectId);
    return subject?.type ?? null;
  });

  readonly serviceOptions = computed(() => {
    const type = this.selectedSubjectType();
    return type
      ? this.serviceStore.services()
          .filter(s => s.type === type)
          .map(this.toOption)
      : [];
  });

  readonly isServiceSelectDisabled = computed(() => !this.subjectIdValue());
  readonly isAddSubjectDisabled = computed(() => !this.clientIdValue());
  readonly isAddServiceDisabled = computed(() => !this.subjectIdValue());
  readonly serviceDialogPrefilledType = computed(() => this.selectedSubjectType());

  // === Effects ===
  private readonly successEffect = effect(() => {
    if (this.success() && this.lastCreated()) {
      this.bookingCreated.emit(this.lastCreated()!);
      this.bookingDialogVisible.set(false);
      this.bookingForm.reset();
    }
  });

  private readonly resetRelationsEffect = effect(() => {
    this.resetIfChanged(this.clientIdValue, this.prevClientId, this.bookingForm.controls.subjectId);
    this.resetIfChanged(this.subjectIdValue, this.prevSubjectId, this.bookingForm.controls.serviceId);
  });

  // === Helpers ===
  private toOption<T extends { id: string; name: string }>(item: T) {
    return { label: item.name, value: item.id };
  }

  private resetIfChanged(value: () => string, prev: { (): string; set: (v: string) => void }, control: FormControl<string>) {
    const current = value();
    if (prev() && current !== prev()) {
      control.setValue('', { emitEvent: false });
    }
    prev.set(current);
  }

  private validateBookingForm(): { userId?: string; startDate?: Date; endDate?: Date } | null {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return this.bookingStore.setError('No user logged in'), null;

    this.bookingForm.markAllAsTouched();
    this.bookingForm.markAllAsDirty();
    if (this.bookingForm.invalid || this.loading()) return null;

    const dateRange = this.bookingForm.controls.dateRange.value;
    if (!dateRange || dateRange.length !== 2) {
      this.bookingStore.setError('Start and end dates are required');
      return null;
    }

    const [startDate, endDate] = dateRange;
    return { userId, startDate, endDate };
  }

  // === Actions ===
  protected onSave(): void {
    const validation = this.validateBookingForm();
    if (!validation) return;

    const { clientId, serviceId, subjectId, notes } = this.bookingForm.getRawValue();

    this.bookingStore.create({
      sitterId: validation.userId!,
      clientId,
      serviceId,
      subjectId,
      startDate: validation.startDate!,
      endDate: validation.endDate!,
      notes: notes || undefined,
      isCancelled: false,
    });
  }

  protected onHide(visible: boolean): void {
    if (!visible) {
      this.bookingDialogVisible.set(false);
      this.bookingForm.reset();
    }
  }

  onClientCreated(client: Client): void {
    this.bookingForm.controls.clientId.setValue(client.id);
  }

  onSubjectCreated(): void {
    const lastSubject = this.clientStore.lastCreatedSubject();
    if (lastSubject) {
      this.bookingForm.controls.subjectId.setValue(lastSubject.id);
    }
  }

  onServiceCreated(service: Service): void {
    this.bookingForm.controls.serviceId.setValue(service.id);
  }
}
