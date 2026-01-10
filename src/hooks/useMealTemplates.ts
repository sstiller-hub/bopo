import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MealType, Entry } from '@/types/nutrition';

export interface MealTemplate {
  id: string;
  name: string;
  mealType: MealType;
  entries: TemplateEntry[];
  useCount: number;
  lastUsedAt?: string;
}

export interface TemplateEntry {
  foodId?: string;
  foodName: string;
  amountGrams: number;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

type DbMealTemplate = {
  id: string;
  user_id: string;
  name: string;
  meal_type: MealType;
  entries: TemplateEntry[];
  use_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

function dbTemplateToTemplate(db: DbMealTemplate): MealTemplate {
  return {
    id: db.id,
    name: db.name,
    mealType: db.meal_type,
    entries: db.entries || [],
    useCount: db.use_count,
    lastUsedAt: db.last_used_at || undefined,
  };
}

export function useMealTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch templates
  useEffect(() => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    async function fetchTemplates() {
      const { data } = await supabase
        .from('meal_templates')
        .select('*')
        .eq('user_id', user!.id)
        .order('use_count', { ascending: false });

      if (data) {
        setTemplates(data.map((d) => dbTemplateToTemplate(d as unknown as DbMealTemplate)));
      }
      setLoading(false);
    }

    fetchTemplates();
  }, [user]);

  const createTemplate = useCallback(async (
    name: string,
    mealType: MealType,
    entries: Entry[]
  ) => {
    if (!user) return null;

    const templateEntries: TemplateEntry[] = entries.map(e => ({
      foodId: e.foodId,
      foodName: e.foodName,
      amountGrams: e.amountGrams,
      macros: e.computedMacros,
    }));

    const { data, error } = await supabase
      .from('meal_templates')
      .insert({
        user_id: user.id,
        name,
        meal_type: mealType,
        entries: JSON.parse(JSON.stringify(templateEntries)),
      })
      .select()
      .single();

    if (data && !error) {
      const newTemplate = dbTemplateToTemplate(data as unknown as DbMealTemplate);
      setTemplates(prev => [newTemplate, ...prev]);
      return newTemplate;
    }
    return null;
  }, [user]);

  const deleteTemplate = useCallback(async (id: string) => {
    if (!user) return;

    await supabase
      .from('meal_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    setTemplates(prev => prev.filter(t => t.id !== id));
  }, [user]);

  const incrementUsage = useCallback(async (id: string) => {
    if (!user) return;

    const template = templates.find(t => t.id === id);
    if (!template) return;

    await supabase
      .from('meal_templates')
      .update({
        use_count: template.useCount + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    setTemplates(prev => prev.map(t =>
      t.id === id
        ? { ...t, useCount: t.useCount + 1, lastUsedAt: new Date().toISOString() }
        : t
    ));
  }, [user, templates]);

  const getTemplatesForMeal = useCallback((mealType: MealType) => {
    return templates.filter(t => t.mealType === mealType);
  }, [templates]);

  return {
    templates,
    loading,
    createTemplate,
    deleteTemplate,
    incrementUsage,
    getTemplatesForMeal,
  };
}
