import { useState, useEffect, useCallback } from 'react';
import { 
  Food, 
  Entry, 
  UserSettings, 
  Macros, 
  defaultSettings,
  MealType 
} from '@/types/nutrition';

const STORAGE_KEYS = {
  settings: 'nutrition_settings',
  foods: 'nutrition_foods',
  entries: 'nutrition_entries',
};

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(() => 
    loadFromStorage(STORAGE_KEYS.settings, defaultSettings)
  );

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      saveToStorage(STORAGE_KEYS.settings, newSettings);
      return newSettings;
    });
  }, []);

  return { settings, updateSettings };
}

export function useFoods() {
  const [foods, setFoods] = useState<Food[]>(() => 
    loadFromStorage(STORAGE_KEYS.foods, [])
  );

  const addFood = useCallback((food: Omit<Food, 'id' | 'useCount' | 'source'>) => {
    const newFood: Food = {
      ...food,
      id: crypto.randomUUID(),
      useCount: 0,
      source: 'user',
    };
    setFoods(prev => {
      const updated = [...prev, newFood];
      saveToStorage(STORAGE_KEYS.foods, updated);
      return updated;
    });
    return newFood;
  }, []);

  const updateFood = useCallback((id: string, updates: Partial<Food>) => {
    setFoods(prev => {
      const updated = prev.map(f => f.id === id ? { ...f, ...updates } : f);
      saveToStorage(STORAGE_KEYS.foods, updated);
      return updated;
    });
  }, []);

  const deleteFood = useCallback((id: string) => {
    setFoods(prev => {
      const updated = prev.filter(f => f.id !== id);
      saveToStorage(STORAGE_KEYS.foods, updated);
      return updated;
    });
  }, []);

  const incrementFoodUsage = useCallback((id: string) => {
    setFoods(prev => {
      const updated = prev.map(f => 
        f.id === id 
          ? { ...f, useCount: f.useCount + 1, lastUsedAt: new Date().toISOString() }
          : f
      );
      saveToStorage(STORAGE_KEYS.foods, updated);
      return updated;
    });
  }, []);

  const findByBarcode = useCallback((barcode: string) => {
    return foods.find(f => f.barcode === barcode);
  }, [foods]);

  const getRecentFoods = useCallback((limit = 10) => {
    return [...foods]
      .filter(f => f.lastUsedAt)
      .sort((a, b) => new Date(b.lastUsedAt!).getTime() - new Date(a.lastUsedAt!).getTime())
      .slice(0, limit);
  }, [foods]);

  const getFrequentFoods = useCallback((limit = 10) => {
    return [...foods]
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, limit);
  }, [foods]);

  const getFavorites = useCallback(() => {
    return foods.filter(f => f.isFavorite);
  }, [foods]);

  const searchFoods = useCallback((query: string) => {
    const lower = query.toLowerCase();
    return foods.filter(f => 
      f.name.toLowerCase().includes(lower) || 
      f.brand?.toLowerCase().includes(lower)
    );
  }, [foods]);

  return {
    foods,
    addFood,
    updateFood,
    deleteFood,
    incrementFoodUsage,
    findByBarcode,
    getRecentFoods,
    getFrequentFoods,
    getFavorites,
    searchFoods,
  };
}

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>(() => 
    loadFromStorage(STORAGE_KEYS.entries, [])
  );

  const addEntry = useCallback((entry: Omit<Entry, 'id' | 'createdAt'>) => {
    const newEntry: Entry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setEntries(prev => {
      const updated = [...prev, newEntry];
      saveToStorage(STORAGE_KEYS.entries, updated);
      return updated;
    });
    return newEntry;
  }, []);

  const updateEntry = useCallback((id: string, updates: Partial<Entry>) => {
    setEntries(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, ...updates } : e);
      saveToStorage(STORAGE_KEYS.entries, updated);
      return updated;
    });
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => {
      const updated = prev.filter(e => e.id !== id);
      saveToStorage(STORAGE_KEYS.entries, updated);
      return updated;
    });
  }, []);

  const duplicateEntry = useCallback((id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    
    const newEntry: Entry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setEntries(prev => {
      const updated = [...prev, newEntry];
      saveToStorage(STORAGE_KEYS.entries, updated);
      return updated;
    });
    return newEntry;
  }, [entries]);

  const getEntriesForDate = useCallback((date: string) => {
    return entries.filter(e => e.date === date);
  }, [entries]);

  const getEntriesByMeal = useCallback((date: string, meal: MealType) => {
    return entries.filter(e => e.date === date && e.meal === meal);
  }, [entries]);

  const getTotalsForDate = useCallback((date: string): Macros => {
    const dayEntries = getEntriesForDate(date);
    return dayEntries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.computedMacros.calories,
        protein: acc.protein + entry.computedMacros.protein,
        carbs: acc.carbs + entry.computedMacros.carbs,
        fat: acc.fat + entry.computedMacros.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [getEntriesForDate]);

  const getMealTotals = useCallback((date: string, meal: MealType): Macros => {
    const mealEntries = getEntriesByMeal(date, meal);
    return mealEntries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.computedMacros.calories,
        protein: acc.protein + entry.computedMacros.protein,
        carbs: acc.carbs + entry.computedMacros.carbs,
        fat: acc.fat + entry.computedMacros.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [getEntriesByMeal]);

  const getHistoryDates = useCallback((days = 30) => {
    const dates = new Set(entries.map(e => e.date));
    return Array.from(dates)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, days);
  }, [entries]);

  return {
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    duplicateEntry,
    getEntriesForDate,
    getEntriesByMeal,
    getTotalsForDate,
    getMealTotals,
    getHistoryDates,
  };
}

export function useTodayStats() {
  const { settings } = useSettings();
  const { getTotalsForDate } = useEntries();
  
  const today = new Date().toISOString().split('T')[0];
  const consumed = getTotalsForDate(today);
  const targets = settings.dailyTargets;
  
  const remaining: Macros = {
    calories: targets.calories - consumed.calories,
    protein: targets.protein - consumed.protein,
    carbs: targets.carbs - consumed.carbs,
    fat: targets.fat - consumed.fat,
  };

  return { consumed, targets, remaining, today };
}
