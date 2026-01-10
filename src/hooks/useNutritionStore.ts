import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Food, 
  Entry, 
  UserSettings, 
  Macros, 
  defaultSettings,
  MealType 
} from '@/types/nutrition';

// Types for database rows
type DbFood = {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  nutrition_basis: 'per_100g' | 'per_serving';
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  calories_per_serving: number | null;
  protein_per_serving: number | null;
  carbs_per_serving: number | null;
  fat_per_serving: number | null;
  serving_grams: number | null;
  source: 'user' | 'open_food_facts';
  is_favorite: boolean;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

type DbEntry = {
  id: string;
  user_id: string;
  date: string;
  meal: MealType;
  food_id: string | null;
  food_name: string;
  amount_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  note: string | null;
  created_at: string;
  parent_entry_id: string | null;
  is_recipe: boolean;
};

type DbSettings = {
  id: string;
  user_id: string;
  preferred_unit: 'g' | 'oz';
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
  training_calories: number | null;
  training_protein: number | null;
  training_carbs: number | null;
  training_fat: number | null;
  rest_calories: number | null;
  rest_protein: number | null;
  rest_carbs: number | null;
  rest_fat: number | null;
  tolerance_macros: number | null;
  tolerance_calories: number | null;
  meal_name_breakfast: string | null;
  meal_name_lunch: string | null;
  meal_name_dinner: string | null;
  meal_name_snacks: string | null;
  created_at: string;
  updated_at: string;
};

// Helpers to convert between DB and app types
function dbFoodToFood(db: DbFood): Food {
  return {
    id: db.id,
    name: db.name,
    brand: db.brand || undefined,
    barcode: db.barcode || undefined,
    nutritionBasis: db.nutrition_basis,
    macrosPer100g: db.nutrition_basis === 'per_100g' ? {
      calories: db.calories_per_100g || 0,
      protein: db.protein_per_100g || 0,
      carbs: db.carbs_per_100g || 0,
      fat: db.fat_per_100g || 0,
    } : undefined,
    macrosPerServing: db.nutrition_basis === 'per_serving' ? {
      calories: db.calories_per_serving || 0,
      protein: db.protein_per_serving || 0,
      carbs: db.carbs_per_serving || 0,
      fat: db.fat_per_serving || 0,
    } : undefined,
    servingGrams: db.serving_grams || undefined,
    source: db.source,
    isFavorite: db.is_favorite,
    useCount: db.use_count,
    lastUsedAt: db.last_used_at || undefined,
  };
}

function dbEntryToEntry(db: DbEntry): Entry {
  return {
    id: db.id,
    date: db.date,
    meal: db.meal,
    foodId: db.food_id || undefined,
    foodName: db.food_name,
    amountGrams: db.amount_grams,
    computedMacros: {
      calories: db.calories,
      protein: db.protein,
      carbs: db.carbs,
      fat: db.fat,
    },
    note: db.note || undefined,
    createdAt: db.created_at,
    parentEntryId: db.parent_entry_id || undefined,
    isRecipe: db.is_recipe || false,
  };
}

function dbSettingsToSettings(db: DbSettings): UserSettings {
  return {
    preferredUnit: db.preferred_unit,
    dailyTargets: {
      calories: db.daily_calories,
      protein: db.daily_protein,
      carbs: db.daily_carbs,
      fat: db.daily_fat,
    },
    templates: (db.training_calories || db.rest_calories) ? {
      trainingDay: db.training_calories ? {
        calories: db.training_calories,
        protein: db.training_protein || 0,
        carbs: db.training_carbs || 0,
        fat: db.training_fat || 0,
      } : undefined,
      restDay: db.rest_calories ? {
        calories: db.rest_calories,
        protein: db.rest_protein || 0,
        carbs: db.rest_carbs || 0,
        fat: db.rest_fat || 0,
      } : undefined,
    } : undefined,
    tolerance: {
      macros: db.tolerance_macros || 5,
      calories: db.tolerance_calories || 50,
    },
    mealNames: {
      breakfast: db.meal_name_breakfast || 'Breakfast',
      lunch: db.meal_name_lunch || 'Lunch',
      dinner: db.meal_name_dinner || 'Dinner',
      snacks: db.meal_name_snacks || 'Snacks',
    },
  };
}

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Fetch settings
  useEffect(() => {
    if (!user) {
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    async function fetchSettings() {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (data) {
        setSettings(dbSettingsToSettings(data as DbSettings));
      } else if (!error) {
        // Create default settings for new user
        const { data: newData } = await supabase
          .from('user_settings')
          .insert({ user_id: user!.id })
          .select()
          .single();
        if (newData) {
          setSettings(dbSettingsToSettings(newData as DbSettings));
        }
      }
      setLoading(false);
    }

    fetchSettings();
  }, [user]);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    if (!user) return;

    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    // Convert to DB format
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.preferredUnit) {
      dbUpdates.preferred_unit = updates.preferredUnit;
    }
    if (updates.dailyTargets) {
      dbUpdates.daily_calories = updates.dailyTargets.calories;
      dbUpdates.daily_protein = updates.dailyTargets.protein;
      dbUpdates.daily_carbs = updates.dailyTargets.carbs;
      dbUpdates.daily_fat = updates.dailyTargets.fat;
    }
    if (updates.templates !== undefined) {
      if (updates.templates?.trainingDay) {
        dbUpdates.training_calories = updates.templates.trainingDay.calories;
        dbUpdates.training_protein = updates.templates.trainingDay.protein;
        dbUpdates.training_carbs = updates.templates.trainingDay.carbs;
        dbUpdates.training_fat = updates.templates.trainingDay.fat;
      }
      if (updates.templates?.restDay) {
        dbUpdates.rest_calories = updates.templates.restDay.calories;
        dbUpdates.rest_protein = updates.templates.restDay.protein;
        dbUpdates.rest_carbs = updates.templates.restDay.carbs;
        dbUpdates.rest_fat = updates.templates.restDay.fat;
      }
    }
    if (updates.tolerance) {
      dbUpdates.tolerance_macros = updates.tolerance.macros;
      dbUpdates.tolerance_calories = updates.tolerance.calories;
    }
    if (updates.mealNames) {
      dbUpdates.meal_name_breakfast = updates.mealNames.breakfast;
      dbUpdates.meal_name_lunch = updates.mealNames.lunch;
      dbUpdates.meal_name_dinner = updates.mealNames.dinner;
      dbUpdates.meal_name_snacks = updates.mealNames.snacks;
    }

    await supabase
      .from('user_settings')
      .update(dbUpdates)
      .eq('user_id', user.id);
  }, [user, settings]);

  return { settings, updateSettings, loading };
}

export function useFoods() {
  const { user } = useAuth();
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch foods
  useEffect(() => {
    if (!user) {
      setFoods([]);
      setLoading(false);
      return;
    }

    async function fetchFoods() {
      const { data } = await supabase
        .from('foods')
        .select('*')
        .eq('user_id', user!.id)
        .order('name');

      if (data) {
        setFoods(data.map((d) => dbFoodToFood(d as DbFood)));
      }
      setLoading(false);
    }

    fetchFoods();
  }, [user]);

  const addFood = useCallback(async (food: Omit<Food, 'id' | 'useCount' | 'source'>) => {
    if (!user) return null;

    const dbFood = {
      user_id: user.id,
      name: food.name,
      brand: food.brand || null,
      barcode: food.barcode || null,
      nutrition_basis: food.nutritionBasis,
      calories_per_100g: food.macrosPer100g?.calories || null,
      protein_per_100g: food.macrosPer100g?.protein || null,
      carbs_per_100g: food.macrosPer100g?.carbs || null,
      fat_per_100g: food.macrosPer100g?.fat || null,
      calories_per_serving: food.macrosPerServing?.calories || null,
      protein_per_serving: food.macrosPerServing?.protein || null,
      carbs_per_serving: food.macrosPerServing?.carbs || null,
      fat_per_serving: food.macrosPerServing?.fat || null,
      serving_grams: food.servingGrams || null,
      is_favorite: food.isFavorite || false,
    };

    const { data, error } = await supabase
      .from('foods')
      .insert(dbFood)
      .select()
      .single();

    if (data && !error) {
      const newFood = dbFoodToFood(data as DbFood);
      setFoods(prev => [...prev, newFood]);
      return newFood;
    }
    return null;
  }, [user]);

  const updateFood = useCallback(async (id: string, updates: Partial<Food>) => {
    if (!user) return;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.brand !== undefined) dbUpdates.brand = updates.brand || null;
    if (updates.barcode !== undefined) dbUpdates.barcode = updates.barcode || null;
    if (updates.nutritionBasis !== undefined) dbUpdates.nutrition_basis = updates.nutritionBasis;
    if (updates.macrosPer100g !== undefined) {
      dbUpdates.calories_per_100g = updates.macrosPer100g?.calories || null;
      dbUpdates.protein_per_100g = updates.macrosPer100g?.protein || null;
      dbUpdates.carbs_per_100g = updates.macrosPer100g?.carbs || null;
      dbUpdates.fat_per_100g = updates.macrosPer100g?.fat || null;
    }
    if (updates.macrosPerServing !== undefined) {
      dbUpdates.calories_per_serving = updates.macrosPerServing?.calories || null;
      dbUpdates.protein_per_serving = updates.macrosPerServing?.protein || null;
      dbUpdates.carbs_per_serving = updates.macrosPerServing?.carbs || null;
      dbUpdates.fat_per_serving = updates.macrosPerServing?.fat || null;
    }
    if (updates.servingGrams !== undefined) dbUpdates.serving_grams = updates.servingGrams || null;
    if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite;

    await supabase
      .from('foods')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id);

    setFoods(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, [user]);

  const deleteFood = useCallback(async (id: string) => {
    if (!user) return;

    await supabase
      .from('foods')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    setFoods(prev => prev.filter(f => f.id !== id));
  }, [user]);

  const incrementFoodUsage = useCallback(async (id: string) => {
    if (!user) return;

    const food = foods.find(f => f.id === id);
    if (!food) return;

    await supabase
      .from('foods')
      .update({
        use_count: food.useCount + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    setFoods(prev => prev.map(f => 
      f.id === id 
        ? { ...f, useCount: f.useCount + 1, lastUsedAt: new Date().toISOString() }
        : f
    ));
  }, [user, foods]);

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
    const matches = foods.filter(f => 
      f.name.toLowerCase().includes(lower) || 
      f.brand?.toLowerCase().includes(lower)
    );
    
    // Sort: favorites first, then by recent usage, then by frequency
    return matches.sort((a, b) => {
      // Favorites first
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      
      // Then by recent usage
      if (a.lastUsedAt && b.lastUsedAt) {
        const diff = new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
        if (diff !== 0) return diff;
      }
      if (a.lastUsedAt && !b.lastUsedAt) return -1;
      if (!a.lastUsedAt && b.lastUsedAt) return 1;
      
      // Then by use count
      return b.useCount - a.useCount;
    });
  }, [foods]);

  return {
    foods,
    loading,
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
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch entries (last 30 days)
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    async function fetchEntries() {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateStr = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(thirtyDaysAgo.getDate()).padStart(2, '0')}`;

      const { data } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user!.id)
        .gte('date', dateStr)
        .order('created_at', { ascending: false });

      if (data) {
        setEntries(data.map((d) => dbEntryToEntry(d as DbEntry)));
      }
      setLoading(false);
    }

    fetchEntries();
  }, [user]);

  const addEntry = useCallback(async (entry: Omit<Entry, 'id' | 'createdAt'>) => {
    if (!user) return null;

    const dbEntry = {
      user_id: user.id,
      date: entry.date,
      meal: entry.meal,
      food_id: entry.foodId || null,
      food_name: entry.foodName,
      amount_grams: entry.amountGrams,
      calories: entry.computedMacros.calories,
      protein: entry.computedMacros.protein,
      carbs: entry.computedMacros.carbs,
      fat: entry.computedMacros.fat,
      note: entry.note || null,
    };

    const { data, error } = await supabase
      .from('entries')
      .insert(dbEntry)
      .select()
      .single();

    if (data && !error) {
      const newEntry = dbEntryToEntry(data as DbEntry);
      setEntries(prev => [newEntry, ...prev]);
      return newEntry;
    }
    return null;
  }, [user]);

  const copyEntriesFromDate = useCallback(async (sourceDate: string, targetDate: string) => {
    if (!user) return 0;

    const sourceEntries = entries.filter(e => e.date === sourceDate);
    if (sourceEntries.length === 0) return 0;

    const newDbEntries = sourceEntries.map(entry => ({
      user_id: user.id,
      date: targetDate,
      meal: entry.meal,
      food_id: entry.foodId || null,
      food_name: entry.foodName,
      amount_grams: entry.amountGrams,
      calories: entry.computedMacros.calories,
      protein: entry.computedMacros.protein,
      carbs: entry.computedMacros.carbs,
      fat: entry.computedMacros.fat,
      note: entry.note || null,
    }));

    const { data, error } = await supabase
      .from('entries')
      .insert(newDbEntries)
      .select();

    if (data && !error) {
      const newEntries = data.map((d) => dbEntryToEntry(d as DbEntry));
      setEntries(prev => [...newEntries, ...prev]);
      return newEntries.length;
    }
    return 0;
  }, [user, entries]);

  const updateEntry = useCallback(async (id: string, updates: Partial<Entry>) => {
    if (!user) return;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.meal !== undefined) dbUpdates.meal = updates.meal;
    if (updates.amountGrams !== undefined) dbUpdates.amount_grams = updates.amountGrams;
    if (updates.computedMacros !== undefined) {
      dbUpdates.calories = updates.computedMacros.calories;
      dbUpdates.protein = updates.computedMacros.protein;
      dbUpdates.carbs = updates.computedMacros.carbs;
      dbUpdates.fat = updates.computedMacros.fat;
    }
    if (updates.note !== undefined) dbUpdates.note = updates.note || null;

    await supabase
      .from('entries')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id);

    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, [user]);

  const deleteEntry = useCallback(async (id: string) => {
    if (!user) return;

    await supabase
      .from('entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    setEntries(prev => prev.filter(e => e.id !== id));
  }, [user]);

  const duplicateEntry = useCallback(async (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry || !user) return null;

    return await addEntry({
      date: entry.date,
      meal: entry.meal,
      foodId: entry.foodId,
      foodName: entry.foodName,
      amountGrams: entry.amountGrams,
      computedMacros: entry.computedMacros,
      note: entry.note,
    });
  }, [entries, user, addEntry]);

  const getEntriesForDate = useCallback((date: string) => {
    // Only return top-level entries for totals (not child ingredients)
    return entries.filter(e => e.date === date && !e.parentEntryId);
  }, [entries]);

  const getEntriesByMeal = useCallback((date: string, meal: MealType) => {
    // Only return top-level entries (not ingredients which have parentEntryId)
    return entries.filter(e => e.date === date && e.meal === meal && !e.parentEntryId);
  }, [entries]);

  const getIngredients = useCallback((parentId: string) => {
    return entries.filter(e => e.parentEntryId === parentId);
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

  // Get weekly averages for the last 7 days
  const getWeeklyAverages = useCallback((): Macros => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Get unique dates with entries in the last 7 days
    const daysWithEntries = new Set<string>();
    const totals: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    entries.forEach(e => {
      if (e.parentEntryId) return; // Skip ingredients
      const entryDate = new Date(e.date);
      if (entryDate >= sevenDaysAgo && entryDate <= now) {
        daysWithEntries.add(e.date);
        totals.calories += e.computedMacros.calories;
        totals.protein += e.computedMacros.protein;
        totals.carbs += e.computedMacros.carbs;
        totals.fat += e.computedMacros.fat;
      }
    });
    
    const dayCount = Math.max(daysWithEntries.size, 1);
    return {
      calories: Math.round(totals.calories / dayCount),
      protein: Math.round(totals.protein / dayCount),
      carbs: Math.round(totals.carbs / dayCount),
      fat: Math.round(totals.fat / dayCount),
    };
  }, [entries]);

  // Group multiple entries into a recipe
  const groupAsRecipe = useCallback(async (entryIds: string[], recipeName: string) => {
    if (!user || entryIds.length < 2) return null;

    const selectedEntries = entries.filter(e => entryIds.includes(e.id));
    if (selectedEntries.length < 2) return null;

    // Calculate combined macros
    const combinedMacros = selectedEntries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.computedMacros.calories,
        protein: acc.protein + entry.computedMacros.protein,
        carbs: acc.carbs + entry.computedMacros.carbs,
        fat: acc.fat + entry.computedMacros.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const combinedGrams = selectedEntries.reduce((acc, e) => acc + e.amountGrams, 0);
    const firstEntry = selectedEntries[0];

    // Create the parent recipe entry
    const dbRecipe = {
      user_id: user.id,
      date: firstEntry.date,
      meal: firstEntry.meal,
      food_id: null,
      food_name: recipeName,
      amount_grams: combinedGrams,
      calories: combinedMacros.calories,
      protein: combinedMacros.protein,
      carbs: combinedMacros.carbs,
      fat: combinedMacros.fat,
      note: null,
      is_recipe: true,
      parent_entry_id: null,
    };

    const { data: recipeData, error: recipeError } = await supabase
      .from('entries')
      .insert(dbRecipe)
      .select()
      .single();

    if (!recipeData || recipeError) return null;

    const newRecipe = dbEntryToEntry(recipeData as DbEntry);

    // Update all selected entries to become children of the recipe
    await supabase
      .from('entries')
      .update({ parent_entry_id: newRecipe.id })
      .in('id', entryIds)
      .eq('user_id', user.id);

    // Update local state
    setEntries(prev => {
      const updated = prev.map(e => 
        entryIds.includes(e.id) ? { ...e, parentEntryId: newRecipe.id } : e
      );
      return [newRecipe, ...updated];
    });

    return newRecipe;
  }, [user, entries]);

  // Ungroup a recipe back to individual entries
  const ungroupRecipe = useCallback(async (recipeId: string) => {
    if (!user) return;

    // Remove parent_entry_id from all children
    await supabase
      .from('entries')
      .update({ parent_entry_id: null })
      .eq('parent_entry_id', recipeId)
      .eq('user_id', user.id);

    // Delete the recipe entry
    await supabase
      .from('entries')
      .delete()
      .eq('id', recipeId)
      .eq('user_id', user.id);

    // Update local state
    setEntries(prev => {
      const updated = prev.map(e => 
        e.parentEntryId === recipeId ? { ...e, parentEntryId: undefined } : e
      );
      return updated.filter(e => e.id !== recipeId);
    });
  }, [user]);

  return {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    duplicateEntry,
    copyEntriesFromDate,
    getEntriesForDate,
    getEntriesByMeal,
    getIngredients,
    getTotalsForDate,
    getMealTotals,
    getHistoryDates,
    getWeeklyAverages,
    groupAsRecipe,
    ungroupRecipe,
  };
}

export function useTodayStats() {
  const { settings } = useSettings();
  const { getTotalsForDate } = useEntries();
  
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
