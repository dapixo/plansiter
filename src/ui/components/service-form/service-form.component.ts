import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TranslocoModule } from '@jsverse/transloco';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Service, ServiceType } from '@domain/entities';
import { ServiceStore } from '@application/stores/service.store';
import { TextareaModule } from 'primeng/textarea';

type PriceType = 'hour' | 'day' | 'night';

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
    ButtonModule,
    MessageModule,
    TranslocoModule
  ],
  templateUrl: './service-form.component.html',
  styleUrls: ['./service-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceFormComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly store = inject(ServiceStore);
  private readonly config = inject(DynamicDialogConfig);
  private readonly ref = inject(DynamicDialogRef);

  service = signal<Service | null>(this.config.data?.service || null);
  formTouched = signal(false);

  serviceTypes: { label: string; value: ServiceType }[] = [
    { label: 'services.types.petSitting', value: 'pet-sitting' },
    { label: 'services.types.plantSitting', value: 'plant-sitting' },
    { label: 'services.types.babysitting', value: 'babysitting' },
    { label: 'services.types.houseSitting', value: 'house-sitting' },
    { label: 'services.types.other', value: 'other' }
  ];

  priceTypes: { label: string; value: PriceType }[] = [
    { label: 'services.form.pricePerHour', value: 'hour' },
    { label: 'services.form.pricePerDay', value: 'day' },
    { label: 'services.form.pricePerNight', value: 'night' }
  ];

  form = (() => {
    const service = this.service();
    let priceType: PriceType | null = null;
    let price: number | null = null;

    if (service?.pricePerHour) {
      priceType = 'hour';
      price = service.pricePerHour;
    } else if (service?.pricePerDay) {
      priceType = 'day';
      price = service.pricePerDay;
    } else if (service?.pricePerNight) {
      priceType = 'night';
      price = service.pricePerNight;
    }

    return this.fb.group<{
      name: FormControl<string>;
      type: FormControl<ServiceType | null>;
      description: FormControl<string>;
      priceType: FormControl<PriceType | null>;
      price: FormControl<number | null>;
    }>({
      name: this.fb.control(service?.name || '', { validators: Validators.required, nonNullable: true }),
      type: this.fb.control<ServiceType | null>(service?.type || null, { validators: Validators.required }),
      description: this.fb.control(service?.description || '', { nonNullable: true }),
      priceType: this.fb.control<PriceType | null>(priceType, { validators: Validators.required }),
      price: this.fb.control<number | null>(price, { validators: Validators.required })
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
    const currentService = this.service();

    const serviceData: Partial<Service> = {
      name: formValue.name,
      type: formValue.type!,
      description: formValue.description || undefined,
      pricePerHour: formValue.priceType === 'hour' ? formValue.price || undefined : undefined,
      pricePerDay: formValue.priceType === 'day' ? formValue.price || undefined : undefined,
      pricePerNight: formValue.priceType === 'night' ? formValue.price || undefined : undefined
    };

    if (currentService) {
      this.store.update({ id: currentService.id, data: serviceData });
    } else {
      this.store.create(serviceData as Omit<Service, 'id' | 'createdAt' | 'updatedAt'>);
    }

    this.ref.close();
  }

  protected onCancel(event: Event): void {
    event.stopPropagation();
    this.ref.close();
  }

}