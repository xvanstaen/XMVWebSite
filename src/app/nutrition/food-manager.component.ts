import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Food, NUTRIENTS, NutrientKey } from './models';
import { NutritionStoreService } from './nutrition-store.service';

@Component({
  selector: 'app-food-manager',
  imports: [ReactiveFormsModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>{{ editingId() ? 'Edit food' : 'New food' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <div class="field-grid">
        <label>
          Name
          <input type="text" formControlName="name" autocomplete="off" />
          @if (form.controls.name.touched && form.controls.name.invalid) {
            <span class="error">Enter a name.</span>
          }
        </label>
        <label>
          Serving size
          <input type="text" formControlName="servingSize" autocomplete="off" />
        </label>
      </div>

      <fieldset formGroupName="nutrients">
        <legend>Nutrition per serving</legend>
        <div class="field-grid">
          @for (n of nutrients; track n.key) {
            <label>
              {{ n.label }} ({{ n.unit }})
              <input type="number" min="0" step="any" [formControlName]="n.key" />
            </label>
          }
        </div>
      </fieldset>

      <div class="actions">
        <button type="submit" class="primary">{{ editingId() ? 'Save changes' : 'Add food' }}</button>
        @if (editingId()) {
          <button type="button" (click)="reset()">Cancel</button>
        }
      </div>
    </form>

    <h2>Your foods</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Food</th>
            <th>Serving</th>
            <th class="num">Calories</th>
            <th class="num">Fat (g)</th>
            <th class="num">Carbs (g)</th>
            <th class="num">Protein (g)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (food of store.foods(); track food.id) {
            <tr>
              <td>{{ food.name }}</td>
              <td>{{ food.servingSize }}</td>
              <td class="num">{{ food.nutrients.calories | number: '1.0-0' }}</td>
              <td class="num">{{ food.nutrients.totalFat | number: '1.0-1' }}</td>
              <td class="num">{{ food.nutrients.totalCarbs | number: '1.0-1' }}</td>
              <td class="num">{{ food.nutrients.protein | number: '1.0-1' }}</td>
              <td class="row-actions">
                <button type="button" class="quiet" (click)="edit(food)"
                  [attr.aria-label]="'Edit ' + food.name">Edit</button>
                <button type="button" class="quiet" (click)="remove(food)"
                  [attr.aria-label]="'Delete ' + food.name">Delete</button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="7" class="empty">No foods yet. Use the form above to add one.</td></tr>
          }
        </tbody>
      </table>
    </div>
    <p class="hint">Logged entries point to a food, so editing a food also updates the days it was eaten.</p>
  `,
  styles: `
    form { display: grid; gap: 1rem; }
    .row-actions { white-space: nowrap; text-align: right; }
  `,
})
export class FoodManagerComponent {
  protected readonly store = inject(NutritionStoreService);
  protected readonly nutrients = NUTRIENTS;
  protected readonly editingId = signal<string | null>(null);

  protected readonly form = this.buildForm();

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, servingSize, nutrients } = this.form.getRawValue();
    const data = { name: name.trim(), servingSize: servingSize.trim(), nutrients };
    const id = this.editingId();
    if (id) this.store.updateFood(id, data);
    else this.store.addFood(data);
    this.reset();
  }

  protected edit(food: Food): void {
    this.editingId.set(food.id);
    this.form.setValue({
      name: food.name,
      servingSize: food.servingSize,
      nutrients: { ...food.nutrients },
    });
  }

  protected remove(food: Food): void {
    if (!globalThis.confirm(`Delete "${food.name}"? Its log entries will be removed too.`)) return;
    this.store.deleteFood(food.id);
    if (this.editingId() === food.id) this.reset();
  }

  protected reset(): void {
    this.editingId.set(null);
    this.form.reset();
  }

  private buildForm() {
    const nutrientControls = Object.fromEntries(
      NUTRIENTS.map((n) => [
        n.key,
        new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      ]),
    ) as Record<NutrientKey, FormControl<number>>;

    return new FormGroup({
      name: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/\S/)],
      }),
      servingSize: new FormControl('1 serving', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      nutrients: new FormGroup(nutrientControls),
    });
  }
}
