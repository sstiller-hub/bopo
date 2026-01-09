import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MealType } from '@/types/nutrition';
import { cn } from '@/lib/utils';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    meal: MealType;
    name: string;
    macros: { calories: number; protein: number; carbs: number; fat: number };
  }) => void;
  defaultMeal?: MealType;
}

const mealOptions: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snacks', label: 'Snacks' },
];

export function QuickAddModal({ isOpen, onClose, onSave, defaultMeal = 'snacks' }: QuickAddModalProps) {
  const [meal, setMeal] = useState<MealType>(defaultMeal);
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const handleSave = () => {
    if (!calories && !protein && !carbs && !fat) return;

    onSave({
      meal,
      name: name.trim() || 'Quick Add',
      macros: {
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
      },
    });

    // Reset form
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    onClose();
  };

  const hasValue = calories || protein || carbs || fat;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl p-6 safe-bottom"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Quick Add</h2>
                  <p className="text-sm text-muted-foreground">Log macros directly</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Meal selector */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {mealOptions.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setMeal(key)}
                  className={cn(
                    'py-2 px-3 rounded-xl text-sm font-medium transition-all',
                    meal === key
                      ? 'bg-gradient-primary text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Name input */}
            <div className="mb-4">
              <Label className="text-xs text-muted-foreground">Name (optional)</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Quick Add"
                className="mt-1 bg-background border-0 rounded-xl"
              />
            </div>

            {/* Macro inputs */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div>
                <Label className="text-xs text-calories font-medium">Calories</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="0"
                  className="mt-1 text-center font-bold bg-background border-0 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs text-protein font-medium">Protein</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                  className="mt-1 text-center font-bold bg-background border-0 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs text-carbs font-medium">Carbs</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0"
                  className="mt-1 text-center font-bold bg-background border-0 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs text-fat font-medium">Fat</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="0"
                  className="mt-1 text-center font-bold bg-background border-0 rounded-xl"
                />
              </div>
            </div>

            {/* Save button */}
            <Button
              onClick={handleSave}
              disabled={!hasValue}
              className="w-full h-12 bg-gradient-primary hover:opacity-90 rounded-xl font-semibold"
            >
              Add to {mealOptions.find(m => m.key === meal)?.label}
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
