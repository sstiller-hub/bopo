import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { StickyMacroHeader } from '@/components/StickyMacroHeader';
import { MealSection } from '@/components/MealSection';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { useSettings, useEntries, useTodayStats } from '@/hooks/useNutritionStore';
import { MealType, Entry } from '@/types/nutrition';

const meals: { key: MealType; defaultName: string }[] = [
  { key: 'breakfast', defaultName: 'Breakfast' },
  { key: 'lunch', defaultName: 'Lunch' },
  { key: 'dinner', defaultName: 'Dinner' },
  { key: 'snacks', defaultName: 'Snacks' },
];

export default function TodayDashboard() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { getEntriesByMeal, getMealTotals, deleteEntry, duplicateEntry } = useEntries();
  const { consumed, targets, remaining, today } = useTodayStats();

  const handleAddFood = (meal: MealType) => {
    navigate(`/log?meal=${meal}`);
  };

  const handleEditEntry = (entry: Entry) => {
    navigate(`/confirm?entryId=${entry.id}`);
  };

  const handleDeleteEntry = (id: string) => {
    deleteEntry(id);
  };

  const handleDuplicateEntry = (id: string) => {
    duplicateEntry(id);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <StickyMacroHeader
        consumed={consumed}
        targets={targets}
        remaining={remaining}
      />

      <main className="px-4 py-4 space-y-3">
        {meals.map(({ key, defaultName }, index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <MealSection
              title={settings.mealNames?.[key] || defaultName}
              meal={key}
              entries={getEntriesByMeal(today, key)}
              totals={getMealTotals(today, key)}
              preferredUnit={settings.preferredUnit}
              onAddFood={handleAddFood}
              onEditEntry={handleEditEntry}
              onDeleteEntry={handleDeleteEntry}
              onDuplicateEntry={handleDuplicateEntry}
            />
          </motion.div>
        ))}
      </main>

      {/* Floating Add Button */}
      <motion.div
        className="fixed bottom-20 right-4 z-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
      >
        <Button
          size="lg"
          onClick={() => navigate('/log')}
          className="h-14 w-14 rounded-full shadow-lg shadow-primary/25"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </motion.div>

      <BottomNav />
    </div>
  );
}
