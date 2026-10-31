export interface Nutrients {
  calories: number;
  totalFat: number;
  saturatedFat: number;
  cholesterol: number;
  sodium: number;
  totalCarbs: number;
  fiber: number;
  sugars: number;
  protein: number;
}

export type NutrientKey = keyof Nutrients;
export type Goals = Nutrients;

export interface NutrientMeta {
  key: NutrientKey;
  label: string;
  unit: 'kcal' | 'g' | 'mg';
  /** Shown indented on the label (a sub-item of the row above). */
  indent?: boolean;
  /** A nutrient to stay under; going past the goal is flagged. */
  limit?: boolean;
}

/** Display order matches a printed Nutrition Facts label. */
export const NUTRIENTS: readonly NutrientMeta[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal', limit: true },
  { key: 'totalFat', label: 'Total fat', unit: 'g', limit: true },
  { key: 'saturatedFat', label: 'Saturated fat', unit: 'g', indent: true, limit: true },
  { key: 'cholesterol', label: 'Cholesterol', unit: 'mg', limit: true },
  { key: 'sodium', label: 'Sodium', unit: 'mg', limit: true },
  { key: 'totalCarbs', label: 'Total carbohydrate', unit: 'g' },
  { key: 'fiber', label: 'Dietary fiber', unit: 'g', indent: true },
  { key: 'sugars', label: 'Total sugars', unit: 'g', indent: true, limit: true },
  { key: 'protein', label: 'Protein', unit: 'g' },
];

export interface Food {
  id: string;
  name: string;
  /** Free text, e.g. "1 large egg (50 g)". Nutrients are per this serving. */
  servingSize: string;
  nutrients: Nutrients;
}

export interface LogEntry {
  id: string;
  /** Local date, yyyy-mm-dd. */
  date: string;
  foodId: string;
  servings: number;
}

export const ZERO: Nutrients = {
  calories: 0, totalFat: 0, saturatedFat: 0, cholesterol: 0, sodium: 0,
  totalCarbs: 0, fiber: 0, sugars: 0, protein: 0,
};

export const DEFAULT_GOALS: Goals = {
  calories: 2000, totalFat: 78, saturatedFat: 20, cholesterol: 300, sodium: 2300,
  totalCarbs: 275, fiber: 28, sugars: 50, protein: 50,
};

function mapNutrients(fn: (key: NutrientKey) => number): Nutrients {
  const out = { ...ZERO };
  for (const { key } of NUTRIENTS) out[key] = fn(key);
  return out;
}

export const scale = (n: Nutrients, factor: number): Nutrients => mapNutrients((k) => n[k] * factor);

export const sum = (list: readonly Nutrients[]): Nutrients =>
  mapNutrients((k) => list.reduce((total, n) => total + n[k], 0));

// ---- Local-date helpers (avoid toISOString, which shifts to UTC) ----

const parseIso = (iso: string): Date => new Date(`${iso}T00:00:00`);

export const toIsoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const todayIso = (): string => toIsoDate(new Date());

export const shiftIsoDate = (iso: string, days: number): string => {
  const d = parseIso(iso);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
};

export const longDate = (iso: string): string =>
  parseIso(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
