import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DEFAULT_GOALS, NUTRIENTS, NutrientKey } from './models';
import { NutritionStoreService } from './nutrition-store.service';

@Component({
  selector: 'app-goals-editor',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>Daily goals</h2>
    <p class="hint">The label's percentages compare each day's total with these numbers.</p>
    <form [formGroup]="form" (ngSubmit)="save()">
      <div class="field-grid">
        @for (n of nutrients; track n.key) {
          <label>
            {{ n.label }} ({{ n.unit }})
            <input type="number" min="0" step="any" [formControlName]="n.key" />
          </label>
        }
      </div>
      <div class="actions">
        <button type="submit" class="primary" [disabled]="form.invalid">Save goals</button>
        <button type="button" (click)="useDefaults()">Reset to 2,000 kcal defaults</button>
        <span role="status">{{ saved() ? 'Goals saved.' : '' }}</span>
      </div>
    </form>
  `,
})
export class GoalsEditorComponent {
  private readonly store = inject(NutritionStoreService);
  protected readonly nutrients = NUTRIENTS;
  protected readonly saved = signal(false);

  protected readonly form = new FormGroup(
    Object.fromEntries(
      NUTRIENTS.map((n) => [
        n.key,
        new FormControl(this.store.goals()[n.key], {
          nonNullable: true,
          validators: [Validators.required, Validators.min(0)],
        }),
      ]),
    ) as Record<NutrientKey, FormControl<number>>,
  );

  protected save(): void {
    if (this.form.invalid) return;
    this.store.goals.set(this.form.getRawValue());
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2000);
  }

  protected useDefaults(): void {
    this.form.setValue({ ...DEFAULT_GOALS });
  }
}
