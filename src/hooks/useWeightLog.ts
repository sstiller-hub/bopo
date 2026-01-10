import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const LB_TO_KG = 0.45359237;
const KG_TO_LB = 2.20462262;

export interface WeightEntry {
  id: string;
  user_id: string;
  measured_at: string;
  weight_kg: number;
  weight_lb: number;
  source: string;
  source_row_id: string;
  notes: string | null;
  created_at: string;
}

export function useWeightLog() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch entries
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const fetchEntries = async () => {
      const { data, error } = await supabase
        .from('body_weight_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('measured_at', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching weight entries:', error);
      } else {
        setEntries(data || []);
      }
      setLoading(false);
    };

    fetchEntries();
  }, [user]);

  // Convert between units
  const lbToKg = (lb: number): number => Math.round(lb * LB_TO_KG * 100) / 100;
  const kgToLb = (kg: number): number => Math.round(kg * KG_TO_LB * 100) / 100;

  // Generate deterministic source_row_id for de-dupe
  const generateSourceRowId = (measuredAt: Date): string => {
    const dateStr = measuredAt.toISOString().split('T')[0];
    const timeStr = measuredAt.toISOString().split('T')[1].substring(0, 5);
    return `manual_${dateStr}_${timeStr}`;
  };

  // Validate weight value
  const validateWeight = (value: number, unit: 'lb' | 'kg'): string | null => {
    if (isNaN(value) || value <= 0) {
      return 'Enter a valid weight';
    }
    
    // Absurd value checks
    if (unit === 'lb') {
      if (value < 50 || value > 700) {
        return 'Weight must be between 50-700 lb';
      }
    } else {
      if (value < 22 || value > 320) {
        return 'Weight must be between 22-320 kg';
      }
    }
    
    return null;
  };

  // Save weight entry
  const saveWeight = async (
    weight: number,
    unit: 'lb' | 'kg',
    measuredAt: Date = new Date(),
    notes?: string
  ): Promise<boolean> => {
    if (!user) {
      toast.error('Please sign in to log weight');
      return false;
    }

    const validationError = validateWeight(weight, unit);
    if (validationError) {
      toast.error(validationError);
      return false;
    }

    setSaving(true);

    const weight_kg = unit === 'kg' ? weight : lbToKg(weight);
    const weight_lb = unit === 'lb' ? weight : kgToLb(weight);
    const source_row_id = generateSourceRowId(measuredAt);

    try {
      const { data, error } = await supabase
        .from('body_weight_entries')
        .upsert(
          {
            user_id: user.id,
            measured_at: measuredAt.toISOString(),
            weight_kg,
            weight_lb,
            source: 'manual',
            source_row_id,
            notes: notes?.trim() || null,
          },
          {
            onConflict: 'user_id,source_row_id',
          }
        )
        .select()
        .single();

      if (error) {
        console.error('Error saving weight:', error);
        toast.error('Failed to save weight');
        return false;
      }

      // Update local state
      setEntries((prev) => {
        const filtered = prev.filter((e) => e.source_row_id !== source_row_id);
        return [data, ...filtered].sort(
          (a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()
        );
      });

      toast.success('Weight logged!');
      return true;
    } catch (err) {
      console.error('Error saving weight:', err);
      toast.error('Failed to save weight');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Delete entry
  const deleteEntry = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('body_weight_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting weight entry:', error);
        toast.error('Failed to delete entry');
        return false;
      }

      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success('Entry deleted');
      return true;
    } catch (err) {
      console.error('Error deleting weight entry:', err);
      return false;
    }
  };

  // Get latest weight
  const latestEntry = entries[0] || null;

  return {
    entries,
    loading,
    saving,
    saveWeight,
    deleteEntry,
    validateWeight,
    lbToKg,
    kgToLb,
    latestEntry,
  };
}
