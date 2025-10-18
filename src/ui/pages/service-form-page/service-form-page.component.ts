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
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TranslocoModule } from '@jsverse/transloco';
import { TextareaModule } from 'primeng/textarea';
import { Service, ServiceType } from '@domain/entities';
import { ServiceStore } from '@application/stores/service.store';
import { AuthService, BreadcrumbService } from '@application/services';
import { LanguageService } from '@application/services/language.service';
import { ActionButtonComponent } from '@ui/components/action-button/action-button.component';
import { SERVICE_TYPE_OPTIONS } from '@ui/constants/service-types.constant';
import { PRICE_TYPE_OPTIONS_FORM, PriceTypeForm } from '@ui/constants/price-types.constant';

@Component({
  selector: 'app-service-form-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
    MessageModule,
    BreadcrumbModule,
    TranslocoModule,
    ActionButtonComponent,
  ],
  templateUrl: './service-form-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceFormPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(ServiceStore);
  private readonly auth = inject(AuthService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  protected readonly lang = inject(LanguageService);

  private readonly paramMap = toSignal(this.route.paramMap);
  private readonly serviceId = computed(() => this.paramMap()?.get('id') || null);
  private readonly service = computed(() => {
    const id = this.serviceId();
    return id ? this.store.services().find((s) => s.id === id) ?? null : null;
  });

  protected readonly isEditMode = computed(() => !!this.serviceId());
  protected readonly isFormReady = computed(() => !this.isEditMode() || !!this.service());

  protected readonly breadcrumbItems = this.breadcrumbService.createBreadcrumbItemsWithDynamicLabel(
    {
      parentLabel: 'services.title',
      parentRoute: '/dashboard/services'
    },
    () => this.service()?.name,
    this.isEditMode() ? 'services.editService' : 'services.createService'
  );

  protected readonly breadcrumbHome = this.breadcrumbService.createBreadcrumbHome();
  protected readonly serviceTypes = SERVICE_TYPE_OPTIONS;
  protected readonly priceTypes = PRICE_TYPE_OPTIONS_FORM;

  protected readonly form = this.fb.group<{
    name: FormControl<string>;
    type: FormControl<ServiceType | null>;
    description: FormControl<string>;
    priceType: FormControl<PriceTypeForm | null>;
    price: FormControl<number | null>;
  }>({
    name: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    type: this.fb.control<ServiceType | null>(null, { validators: Validators.required }),
    description: this.fb.control('', { nonNullable: true }),
    priceType: this.fb.control<PriceTypeForm | null>(null, { validators: Validators.required }),
    price: this.fb.control<number | null>(null, { validators: Validators.required })
  });
  protected readonly uiState = computed(() => ({
    ready: this.isFormReady(),
    loading: this.store.loading(),
    error: this.store.error(),
  }));

  private readonly shouldNavigateAfterSave = signal(false);
  private readonly previousLoadingState = signal(false);

  private readonly _patchEffect = effect(() => {
    const service = this.service();
    if (!service) return;

    // Déterminer le type de prix
    let priceType: PriceTypeForm | null = null;
    let price: number | null = null;

    if (service.pricePerHour) {
      priceType = 'hour';
      price = service.pricePerHour;
    } else if (service.pricePerDay) {
      priceType = 'day';
      price = service.pricePerDay;
    } else if (service.pricePerNight) {
      priceType = 'night';
      price = service.pricePerNight;
    }

    this.form.reset({
      name: service.name,
      type: service.type,
      description: service.description ?? '',
      priceType: priceType,
      price: price
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
      this.router.navigate([`/${lang}/dashboard/services`]);
    }
  });

  /** Soumission */
  protected onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.store.loading() || this.form.invalid) return;

    const payload = this.getServicePayload();
    const user = this.auth.currentUser();

    if (!user?.id) {
      this.store.setError('No user logged in');
      return;
    }

    const currentService = this.service();
    this.shouldNavigateAfterSave.set(true);

    // Créer ou mettre à jour le service
    if (currentService) {
      this.store.update({ id: currentService.id, data: payload });
    } else {
      this.store.create({
        ...payload,
        userId: user.id
      } as Omit<Service, 'id' | 'createdAt' | 'updatedAt'>);
    }
  }

  private getServicePayload(): Partial<Service> {
    const { name, type, description, priceType, price } = this.form.value;
    return {
      name: name!,
      type: type!,
      description: description || undefined,
      pricePerHour: priceType === 'hour' ? price || undefined : undefined,
      pricePerDay: priceType === 'day' ? price || undefined : undefined,
      pricePerNight: priceType === 'night' ? price || undefined : undefined
    };
  }
}
