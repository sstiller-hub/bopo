import { MealType } from '@/types/nutrition';

export const mealOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

export const defaultMealLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

const LAST_MEAL_KEY = 'bopo:last-meal';

export function isMealType(value: string | null): value is MealType {
  return value !== null && mealOrder.includes(value as MealType);
}

export function getStoredMeal(): MealType | null {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(LAST_MEAL_KEY);
  return isMealType(stored) ? stored : null;
}

export function setStoredMeal(meal: MealType) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LAST_MEAL_KEY, meal);
}

export function getTimeBasedMeal(date: Date = new Date()): MealType {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 20) return 'dinner';
  return 'snacks';
}

export function getDefaultMeal(): MealType {
  return getStoredMeal() ?? getTimeBasedMeal();
}
