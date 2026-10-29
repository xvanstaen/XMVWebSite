
import { mainClassCaloriesFat, DailyReport, ClassMeal, ClassDish, ClassItem} from './ClassHealthCalories'
import {mainConvItem, mainRecordConvert, mainClassUnit, mainClassConv} from './../ClassConverter'

export interface Nutrients {
  Calories: number; Sugar: number; naturalSugar: number; addedSugar: number;
  Cholesterol: number; Protein: number; Carbs: number;
  Fat: { Saturated: number; Total: number };
}

export interface HealthResult {
  errors: string[];              // use errors.length where you used `error`
  outHealthData: DailyReport;
}

const norm = (s?: string) => (s ?? '').toLowerCase().trim();
const num = (v: unknown) => Number(v) || 0;   // NaN -> 0

const emptyNutrients = (): ClassItem => new ClassItem();   // all numeric fields already 0

const scale = (n: ClassItem, f: number): ClassItem => {
  const r = new ClassItem();
  r.Calories     = num(n.Calories) * f;
  r.Sugar        = num(n.Sugar) * f;
  r.naturalSugar = num(n.naturalSugar) * f;
  r.addedSugar   = num(n.addedSugar) * f;
  r.Cholesterol  = num(n.Cholesterol) * f;
  r.Protein      = num(n.Protein) * f;
  r.Carbs        = num(n.Carbs) * f;
  r.Fat.Saturated = num(n.Fat.Saturated) * f;
  r.Fat.Total     = num(n.Fat.Total) * f;
  return r;
};

const add = (a: ClassItem, b: ClassItem): ClassItem => {
  const r = new ClassItem();
  r.Calories     = a.Calories + b.Calories;
  r.Sugar        = a.Sugar + b.Sugar;
  r.naturalSugar = a.naturalSugar + b.naturalSugar;
  r.addedSugar   = a.addedSugar + b.addedSugar;
  r.Cholesterol  = a.Cholesterol + b.Cholesterol;
  r.Protein      = a.Protein + b.Protein;
  r.Carbs        = a.Carbs + b.Carbs;
  r.Fat.Saturated = a.Fat.Saturated + b.Fat.Saturated;
  r.Fat.Total     = a.Fat.Total + b.Fat.Total;
  return r;
};

// ---------- lookups ----------
function findFood(foods: mainClassCaloriesFat, name: string) {
  for (const type of foods.tabCaloriesFat) {
    const food = type.Content.find(f => norm(f.Name) === name);
    if (food) return food;
  }
  return undefined;
}

/** Returns the quantity expressed in `toUnit`, or undefined if no conversion exists. */
function convertQuantity(qty: number, fromUnit: string, toUnit: string, conv: mainClassConv): number | undefined {
  if (fromUnit === toUnit) return qty;
  for (const c of conv.tabConv) {
    if (norm(c.fromUnit) !== fromUnit) continue;
    const hit = c.convert.find(x => norm(x.toUnit) === toUnit);
    if (hit) return qty * hit.value;
  }
  return undefined;
}

// ---------- one dish ----------
function calcDish(src: ClassDish, foods: mainClassCaloriesFat, conv: mainClassConv): { dish: ClassDish; errors: string[] } {
    const dish = new ClassDish();
    dish.name = norm(src.name);
    dish.unit = norm(src.unit);
    dish.quantity = Number(src.quantity);

    // locked: keep user-entered values as they are
    if (norm(src.calFat.lockData) === 'y') {
        Object.assign(dish.calFat, structuredClone(src.calFat));
        return { dish, errors: [] };
    }

    const food = findFood(foods, dish.name);
    if (!food) {
        return { dish, errors: dish.name ? [`no information found for '${dish.name}'`] : [] };
    }

    const qty = convertQuantity(dish.quantity, dish.unit, norm(food.ServingUnit), conv);
    if (qty === undefined) {
        return { dish, errors: dish.unit ? [`conversion not found for unit '${dish.unit}' (${dish.name})`] : [] };
    }

    const serving = num(food.Serving);
    if (serving !== 0) {
        Object.assign(dish.calFat, scale(food, qty / serving));
        }
    return { dish, errors: [] };
}

// ---------- one day ----------
export function calcFatCalories(
    foods: mainClassCaloriesFat,
    day: DailyReport,
    conv: mainClassConv,): 
    HealthResult {
        const errors: string[] = [];

        const meals = day.meal.map(srcMeal => {
            const dishes = srcMeal.dish.map(d => {
                const r = calcDish(d, foods, conv);
                errors.push(...r.errors);
                return r.dish;
            });

            const meal = new ClassMeal();
                meal.name = norm(srcMeal.name);
                meal.dish = dishes;
                meal.total = dishes.reduce((acc, d) => add(acc, d.calFat), emptyNutrients());
                return meal;
            });

        const out = new DailyReport();
        out.date = day.date;
        out.burntCalories = day.burntCalories;
        out.meal = meals;
        out.total = meals.reduce((acc, m) => add(acc, m.total), emptyNutrients());

        return { errors, outHealthData: out };
}