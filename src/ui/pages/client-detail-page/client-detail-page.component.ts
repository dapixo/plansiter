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
import { Subject } from '@domain/entities';
import { ClientStore } from '@application/stores/client.store';
import { SubjectStore } from '@application/stores/subject.store';
import { LanguageService } from '@application/services/language.service';
import { TempSubject } from '@application/services/client-management.service';
import { ClientSubjectsFormComponent } from '@ui/components/client-subjects-form/client-subjects-form.component';

@Component({
  selector: 'app-client-detail-page',
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
    ClientSubjectsFormComponent,
  ],
  templateUrl: './client-detail-page.component.html',
  styleUrls: ['./client-detail-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientDetailPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(ClientStore);
  private readonly subjectStore = inject(SubjectStore);
  protected readonly lang = inject(LanguageService);

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
  protected readonly editingName = signal(false);
  protected readonly editingAddress = signal(false);
  protected readonly editingNotes = signal(false);

  /** Forms per section */
  protected readonly nameForm = this.fb.group({
    name: this.fb.control('', { validators: Validators.required, nonNullable: true }),
  });

  protected readonly addressForm = this.fb.group({
    address: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    city: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    postalCode: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    state: this.fb.control('', { nonNullable: true }),
    country: this.fb.control('', { validators: Validators.required, nonNullable: true }),
  });

  protected readonly notesForm = this.fb.group({
    notes: this.fb.control('', { nonNullable: true }),
  });

  /** Subjects state */
  private readonly currentSubjects = signal<TempSubject[]>([]);

  /** Effect pour patcher les formulaires avec les données du client */
  private readonly _patchEffect = effect(() => {
    const client = this.client();
    if (!client) return;

    this.nameForm.patchValue({ name: client.name });
    this.addressForm.patchValue({
      address: client.address,
      city: client.city,
      postalCode: client.postalCode ?? '',
      state: client.state ?? '',
      country: client.country,
    });
    this.notesForm.patchValue({ notes: client.notes ?? '' });
  });

  /** Édition du nom */
  protected onEditName(): void {
    this.editingName.set(true);
  }

  protected onCancelName(): void {
    const client = this.client();
    if (client) {
      this.nameForm.patchValue({ name: client.name });
    }
    this.editingName.set(false);
  }

  protected onSaveName(): void {
    this.nameForm.markAllAsTouched();
    if (this.nameForm.invalid || this.loading()) return;

    const client = this.client();
    if (!client) return;

    this.store.update({
      id: client.id,
      data: { name: this.nameForm.value.name! },
    });

    this.editingName.set(false);
  }

  /** Édition de l'adresse */
  protected onEditAddress(): void {
    this.editingAddress.set(true);
  }

  protected onCancelAddress(): void {
    const client = this.client();
    if (client) {
      this.addressForm.patchValue({
        address: client.address,
        city: client.city,
        postalCode: client.postalCode ?? '',
        state: client.state ?? '',
        country: client.country,
      });
    }
    this.editingAddress.set(false);
  }

  protected onSaveAddress(): void {
    this.addressForm.markAllAsTouched();
    if (this.addressForm.invalid || this.loading()) return;

    const client = this.client();
    if (!client) return;

    const { address, city, postalCode, state, country } = this.addressForm.value;
    this.store.update({
      id: client.id,
      data: {
        address: address!,
        city: city!,
        postalCode: postalCode || undefined,
        state: state || undefined,
        country: country!,
      },
    });

    this.editingAddress.set(false);
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

  /** Handler pour l'output du composant enfant subjects */
  protected onSubjectsChange(subjects: TempSubject[]): void {
    this.currentSubjects.set(subjects);
  }

  /** Conversion TempSubject → Subject payload */
  private toSubjectPayload(temp: TempSubject, clientId: string): Omit<Subject, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      clientId,
      type: temp.type,
      name: temp.name,
      breed: temp.breed,
      age: temp.age,
      specialNeeds: temp.specialNeeds,
      notes: temp.notes,
    };
  }

  /** Callback appelé par le composant subjects quand il fait des changements */
  protected onSubjectsUpdate(): void {
    const clientId = this.clientId();
    if (!clientId) return;

    const temps = this.currentSubjects();
    const existingSubjects = this.subjectStore.subjects().filter(s => s.clientId === clientId);

    // Créer les nouveaux
    temps
      .filter(s => !s.isExisting)
      .forEach(s => this.subjectStore.create(this.toSubjectPayload(s, clientId)));

    // Mettre à jour les existants
    temps
      .filter(s => s.isExisting && s.id)
      .forEach(s => this.subjectStore.update({
        id: s.id!,
        data: this.toSubjectPayload(s, clientId),
      }));

    // Supprimer ceux qui ont été retirés
    const tempIds = new Set(temps.filter(s => s.id).map(s => s.id));
    existingSubjects
      .filter(s => !tempIds.has(s.id))
      .forEach(s => this.subjectStore.delete(s.id));
  }
}
