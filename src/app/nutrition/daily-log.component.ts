import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NutritionStoreService } from './nutrition-store.service';

@Component({
  selector: 'app-daily-log',
  imports: [ReactiveFormsModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>Add food</h2>
    @if (store.foods().length) {
      <form class="add" [formGroup]="form" (ngSubmit)="add()">
        <label>
          Food
          <select formControlName="foodId">
            @for (food of store.foods(); track food.id) {
              <option [value]="food.id">{{ food.name }} ({{ food.servingSize }})</option>
            }
          </select>
        </label>
        <label>
          Servings
          <input type="number" formControlName="servings" min="0.1" step="0.25" />
        </label>
        <button type="submit" class="primary" [disabled]="form.invalid">Add to log</button>
      </form>
    } @else {
      <p class="empty">No foods yet. Add one on the Foods tab, then log it here.</p>
    }

    <h2>Eaten this day</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Food</th>
            <th class="num">Servings</th>
            <th class="num">Calories</th>
            <th class="num">Fat (g)</th>
            <th class="num">Carbs (g)</th>
            <th class="num">Protein (g)</th>
            <th><span class="visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          @for (row of store.dayEntries(); track row.entry.id) {
            <tr>
              <td>{{ row.food.name }}</td>
              <td class="num">{{ row.entry.servings | number: '1.0-2' }}</td>
              <td class="num">{{ row.nutrients.calories | number: '1.0-0' }}</td>
              <td class="num">{{ row.nutrients.totalFat | number: '1.0-1' }}</td>
              <td class="num">{{ row.nutrients.totalCarbs | number: '1.0-1' }}</td>
              <td class="num">{{ row.nutrients.protein | number: '1.0-1' }}</td>
              <td>
                <button type="button" class="quiet" (click)="store.removeEntry(row.entry.id)"
                  [attr.aria-label]="'Remove ' + row.food.name">Remove</button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="7" class="empty">Nothing logged for this day yet.</td></tr>
          }
        </tbody>
        @if (store.dayEntries().length) {
          <tfoot>
            <tr>
              <td>Total</td>
              <td></td>
              <td class="num">{{ store.totals().calories | number: '1.0-0' }}</td>
              <td class="num">{{ store.totals().totalFat | number: '1.0-1' }}</td>
              <td class="num">{{ store.totals().totalCarbs | number: '1.0-1' }}</td>
              <td class="num">{{ store.totals().protein | number: '1.0-1' }}</td>
              <td></td>
            </tr>
          </tfoot>
        }
      </table>
    </div>
  `,
  styles: `
    .add {
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) auto;
      gap: 0.75rem;
      align-items: end;
    }
    .visually-hidden {
      position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%);
    }
    @media (max-width: 40rem) {
      .add { grid-template-columns: 1fr 1fr; }
      .add label:first-child { grid-column: 1 / -1; }
    }
  `,
})
export class DailyLogComponent {
  protected readonly store = inject(NutritionStoreService);

  protected readonly form = new FormGroup({
    foodId: new FormControl(this.store.foods()[0]?.id ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    servings: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.1)],
    }),
  });

  constructor() {
    // If the selected food was deleted, fall back to the first one.
    effect(() => {
      const foods = this.store.foods();
      const control = this.form.controls.foodId;
      if (!foods.some((f) => f.id === control.value)) control.setValue(foods[0]?.id ?? '');
    });
  }

  protected add(): void {
    if (this.form.invalid) return;
    const { foodId, servings } = this.form.getRawValue();
    this.store.logFood(foodId, servings);
    this.form.controls.servings.setValue(1);
  }
}
