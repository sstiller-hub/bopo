export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Food {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  nutritionBasis: 'per_100g' | 'per_serving';
  macrosPer100g?: Macros;
  macrosPerServing?: Macros;
  servingGrams?: number;
  source: 'user' | 'open_food_facts';
  lastUsedAt?: string;
  useCount: number;
  isFavorite?: boolean;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface Entry {
  id: string;
  date: string; // YYYY-MM-DD
  meal: MealType;
  foodId?: string;
  foodName: string; // Denormalized for display
  amountGrams: number;
  computedMacros: Macros;
  note?: string;
  createdAt: string;
  parentEntryId?: string; // If set, this entry is an ingredient of the parent recipe
  isRecipe?: boolean; // If true, this entry is a recipe with child ingredients
}

export interface DayLog {
  date: string;
  targetSnapshot: Macros;
  entries: Entry[];
}

export interface UserSettings {
  preferredUnit: 'g' | 'oz';
  dailyTargets: Macros;
  templates?: {
    trainingDay?: Macros;
    restDay?: Macros;
  };
  tolerance?: {
    macros: number; // grams
    calories: number; // kcal
  };
  mealNames?: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string;
  };
}

export const defaultSettings: UserSettings = {
  preferredUnit: 'g',
  dailyTargets: {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
  },
  tolerance: {
    macros: 5,
    calories: 50,
  },
  mealNames: {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snacks: 'Snacks',
  },
};

export const GRAMS_PER_OUNCE = 28.3495;

export function gramsToOunces(grams: number): number {
  return grams / GRAMS_PER_OUNCE;
}

export function ouncesToGrams(ounces: number): number {
  return ounces * GRAMS_PER_OUNCE;
}

export function calculateMacros(food: Food, amountGrams: number): Macros {
  if (food.nutritionBasis === 'per_100g' && food.macrosPer100g) {
    const multiplier = amountGrams / 100;
    return {
      calories: Math.round(food.macrosPer100g.calories * multiplier),
      protein: Math.round(food.macrosPer100g.protein * multiplier * 10) / 10,
      carbs: Math.round(food.macrosPer100g.carbs * multiplier * 10) / 10,
      fat: Math.round(food.macrosPer100g.fat * multiplier * 10) / 10,
    };
  } else if (food.macrosPerServing && food.servingGrams) {
    const multiplier = amountGrams / food.servingGrams;
    return {
      calories: Math.round(food.macrosPerServing.calories * multiplier),
      protein: Math.round(food.macrosPerServing.protein * multiplier * 10) / 10,
      carbs: Math.round(food.macrosPerServing.carbs * multiplier * 10) / 10,
      fat: Math.round(food.macrosPerServing.fat * multiplier * 10) / 10,
    };
  }
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export function formatMacro(value: number, showSign = false): string {
  const rounded = Math.round(value * 10) / 10;
  if (showSign && rounded > 0) return `+${rounded}`;
  return rounded.toString();
}

export function formatCalories(value: number, showSign = false): string {
  const rounded = Math.round(value);
  if (showSign && rounded > 0) return `+${rounded}`;
  return rounded.toString();
}
