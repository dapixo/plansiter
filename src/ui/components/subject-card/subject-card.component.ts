import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject } from '@domain/entities';

@Component({
  selector: 'app-subject-card',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="group"
      class="bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow"
      [attr.aria-labelledby]="'subject-' + subjectData().name"
    >
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h3
            class="font-semibold text-gray-900 truncate"
            [id]="'subject-' + subjectData().name"
          >
            {{ subjectData().name }}
          </h3>
          <p class="text-sm text-gray-600">
            {{ 'subjects.types.' + subjectData().type | transloco }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex gap-1 shrink-0">
          <button
            type="button"
            (click)="onEdit()"
            class="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            [attr.aria-label]="'subjects.edit' | transloco"
          >
            <i class="pi pi-pencil text-xs"></i>
          </button>
          <button
            type="button"
            (click)="onDelete()"
            class="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            [attr.aria-label]="'subjects.delete' | transloco"
          >
            <i class="pi pi-trash text-xs"></i>
          </button>
        </div>
      </div>

      <!-- Special needs -->
      @if (subjectData().specialNeeds) {
        <p class="text-sm text-gray-600">
          <strong>{{ 'subjects.form.specialNeeds' | transloco }}:</strong>
          {{ subjectData().specialNeeds }}
        </p>
      }
    </div>
  `,
})
export class SubjectCardComponent {
  // Inputs
  readonly subject = input.required<Subject | Partial<Subject>>();

  // Outputs
  readonly edit = output<void>();
  readonly delete = output<void>();

  // Cache le signal du subject pour éviter des relectures multiples
  protected readonly subjectData = computed(() => this.subject());

  // Méthodes pour améliorer la lisibilité du template
  protected onEdit(): void {
    this.edit.emit();
  }

  protected onDelete(): void {
    this.delete.emit();
  }
}
