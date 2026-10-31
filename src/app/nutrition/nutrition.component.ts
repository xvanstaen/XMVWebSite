import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DailyLogComponent } from './daily-log.component';
import { FoodManagerComponent } from './food-manager.component';
import { GoalsEditorComponent } from './goals-editor.component';
import { longDate, todayIso } from './models';
import { NutritionLabelComponent } from './nutrition-label.component';
import { NutritionStoreService } from './nutrition-store.service';

type Tab = 'log' | 'foods' | 'goals';

@Component({
  selector: 'app-nutrition',
  imports: [
    DecimalPipe,
    DailyLogComponent,
    FoodManagerComponent,
    GoalsEditorComponent,
    NutritionLabelComponent,
  ],
  templateUrl: './nutrition.component.html',
  styleUrl: './nutrition.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NutritionComponent {
  protected readonly store = inject(NutritionStoreService);

  protected readonly tabs: readonly { id: Tab; label: string }[] = [
    { id: 'log', label: 'Daily log' },
    { id: 'foods', label: 'Foods' },
    { id: 'goals', label: 'Goals' },
  ];
  protected readonly tab = signal<Tab>('log');

  protected readonly isToday = computed(() => this.store.date() === todayIso());
  protected readonly caption = computed(() =>
    this.isToday() ? 'Today' : longDate(this.store.date()),
  );
  protected readonly caloriePct = computed(() => {
    const goal = this.store.goals().calories;
    return goal > 0 ? Math.min(100, (this.store.totals().calories / goal) * 100) : 0;
  });
  protected readonly caloriesOver = computed(
    () => this.store.totals().calories > this.store.goals().calories,
  );

  protected onDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) this.store.date.set(value);
  }
}
