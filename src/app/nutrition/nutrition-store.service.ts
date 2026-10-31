import { computed, effect, Injectable, signal } from '@angular/core';
import {
  DEFAULT_GOALS, Food, Goals, LogEntry, Nutrients, scale, shiftIsoDate, sum, todayIso,
} from './models';

const STORAGE_KEY = 'nutrition-tracker:v1';

export type FoodInput = Omit<Food, 'id'>;

interface Persisted {
  foods: Food[];
  entries: LogEntry[];
  goals: Goals;
}

const n = (
  calories: number, totalFat: number, saturatedFat: number, cholesterol: number, sodium: number,
  totalCarbs: number, fiber: number, sugars: number, protein: number,
): Nutrients => ({ calories, totalFat, saturatedFat, cholesterol, sodium, totalCarbs, fiber, sugars, protein });

const SEED_FOODS: Food[] = [
  { id: 'seed-egg', name: 'Egg, whole', servingSize: '1 large (50 g)', nutrients: n(72, 4.8, 1.6, 186, 71, 0.4, 0, 0.2, 6.3) },
  { id: 'seed-banana', name: 'Banana', servingSize: '1 medium (118 g)', nutrients: n(105, 0.4, 0.1, 0, 1, 27, 3.1, 14.4, 1.3) },
  { id: 'seed-oats', name: 'Rolled oats', servingSize: '1/2 cup dry (40 g)', nutrients: n(150, 2.5, 0.5, 0, 0, 27, 4, 1, 5) },
  { id: 'seed-chicken', name: 'Chicken breast, cooked', servingSize: '100 g', nutrients: n(165, 3.6, 1, 85, 74, 0, 0, 0, 31) },
  { id: 'seed-almonds', name: 'Almonds', servingSize: '28 g', nutrients: n(164, 14.2, 1.1, 0, 0, 6.1, 3.5, 1.2, 6) },
];

@Injectable({ providedIn: 'root' })
export class NutritionStoreService {
  readonly foods = signal<Food[]>(SEED_FOODS);
  readonly entries = signal<LogEntry[]>([]);
  readonly goals = signal<Goals>(DEFAULT_GOALS);
  /** The day currently being viewed (yyyy-mm-dd). */
  readonly date = signal(todayIso());

  private readonly foodsById = computed(() => new Map(this.foods().map((f) => [f.id, f])));

  /** Entries for the selected day, each paired with its food and scaled nutrients. */
  readonly dayEntries = computed(() => {
    const byId = this.foodsById();
    const date = this.date();
    return this.entries()
      .filter((e) => e.date === date)
      .flatMap((entry) => {
        const food = byId.get(entry.foodId);
        return food ? [{ entry, food, nutrients: scale(food.nutrients, entry.servings) }] : [];
      });
  });

  readonly totals = computed(() => sum(this.dayEntries().map((d) => d.nutrients)));

  constructor() {
    this.restore();
    effect(() => {
      const snapshot: Persisted = { foods: this.foods(), entries: this.entries(), goals: this.goals() };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        // Storage full or blocked: keep working in memory.
      }
    });
  }

  addFood(input: FoodInput): void {
    this.foods.update((list) => [...list, { ...input, id: crypto.randomUUID() }]);
  }

  updateFood(id: string, input: FoodInput): void {
    this.foods.update((list) => list.map((f) => (f.id === id ? { ...input, id } : f)));
  }

  deleteFood(id: string): void {
    this.foods.update((list) => list.filter((f) => f.id !== id));
    this.entries.update((list) => list.filter((e) => e.foodId !== id));
  }

  logFood(foodId: string, servings: number): void {
    if (!this.foodsById().has(foodId) || !(servings > 0)) return;
    this.entries.update((list) => [
      ...list,
      { id: crypto.randomUUID(), date: this.date(), foodId, servings },
    ]);
  }

  removeEntry(id: string): void {
    this.entries.update((list) => list.filter((e) => e.id !== id));
  }

  shiftDate(days: number): void {
    this.date.update((d) => shiftIsoDate(d, days));
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<Persisted>;
      if (Array.isArray(saved.foods)) this.foods.set(saved.foods);
      if (Array.isArray(saved.entries)) this.entries.set(saved.entries);
      if (saved.goals) this.goals.set({ ...DEFAULT_GOALS, ...saved.goals });
    } catch {
      // Corrupt or unavailable storage: start from the defaults.
    }
  }
}
