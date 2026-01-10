import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Save, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UnitToggle } from '@/components/UnitToggle';
import { useFoods, useEntries, useSettings } from '@/hooks/useNutritionStore';
import { 
  Food, 
  MealType, 
  calculateMacros, 
  gramsToOunces, 
  ouncesToGrams,
  Macros 
} from '@/types/nutrition';
import { cn } from '@/lib/utils';

const mealOptions: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snacks', label: 'Snacks' },
];

export default function ConfirmEntry() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const foodId = searchParams.get('foodId');
  const entryId = searchParams.get('entryId');
  const initialMeal = (searchParams.get('meal') as MealType) || 'snacks';
  
  const { foods, updateFood, incrementFoodUsage } = useFoods();
  const { entries, addEntry, updateEntry } = useEntries();
  const { settings, updateSettings } = useSettings();
  
  const [selectedMeal, setSelectedMeal] = useState<MealType>(initialMeal);
  const [amountValue, setAmountValue] = useState('100');
  const [unit, setUnit] = useState<'g' | 'oz'>(settings.preferredUnit);
  const [note, setNote] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showMealPicker, setShowMealPicker] = useState(false);

  // Get food data
  const existingEntry = entryId ? entries.find(e => e.id === entryId) : null;
  const food = useMemo(() => {
    if (existingEntry) {
      return foods.find(f => f.id === existingEntry.foodId);
    }
    return foods.find(f => f.id === foodId);
  }, [foodId, existingEntry, foods]);

  // Initialize from existing entry or default to serving size
  useEffect(() => {
    if (existingEntry) {
      setSelectedMeal(existingEntry.meal);
      setNote(existingEntry.note || '');
      const displayAmount = unit === 'oz' 
        ? gramsToOunces(existingEntry.amountGrams).toFixed(1)
        : existingEntry.amountGrams.toString();
      setAmountValue(displayAmount);
    } else if (food) {
      // Default to serving size if available, otherwise 100g
      const defaultGrams = food.servingGrams || 100;
      const displayAmount = unit === 'oz' 
        ? gramsToOunces(defaultGrams).toFixed(1)
        : defaultGrams.toString();
      setAmountValue(displayAmount);
    }
    if (food) {
      setIsFavorite(food.isFavorite || false);
    }
  }, [existingEntry, food, unit]);

  // Calculate macros
  const amountGrams = useMemo(() => {
    const numValue = parseFloat(amountValue) || 0;
    return unit === 'oz' ? ouncesToGrams(numValue) : numValue;
  }, [amountValue, unit]);

  const computedMacros = useMemo<Macros>(() => {
    if (!food) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return calculateMacros(food, amountGrams);
  }, [food, amountGrams]);

  const handleUnitChange = (newUnit: 'g' | 'oz') => {
    const currentGrams = unit === 'oz' 
      ? ouncesToGrams(parseFloat(amountValue) || 0)
      : parseFloat(amountValue) || 0;
    
    const newValue = newUnit === 'oz'
      ? gramsToOunces(currentGrams).toFixed(1)
      : Math.round(currentGrams).toString();
    
    setUnit(newUnit);
    setAmountValue(newValue);
    updateSettings({ preferredUnit: newUnit });
  };

  const handleSave = () => {
    if (!food) return;

    // Use local date format to avoid timezone issues
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    if (existingEntry) {
      updateEntry(existingEntry.id, {
        meal: selectedMeal,
        amountGrams,
        computedMacros,
        note: note || undefined,
      });
    } else {
      addEntry({
        date: today,
        meal: selectedMeal,
        foodId: food.id,
        foodName: food.name,
        amountGrams,
        computedMacros,
        note: note || undefined,
      });
      incrementFoodUsage(food.id);
    }

    // Update favorite status
    if (food.isFavorite !== isFavorite) {
      updateFood(food.id, { isFavorite });
    }

    navigate('/');
  };

  if (!food) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Food not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - KovaFit style */}
      <div className="px-5 pt-12 pb-4 safe-top">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">
              {existingEntry ? 'Edit Entry' : 'Add Entry'}
            </h1>
          </div>
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm"
          >
            <Heart className={cn(
              'w-5 h-5 transition-colors',
              isFavorite ? 'fill-destructive text-destructive' : 'text-muted-foreground'
            )} />
          </button>
        </div>
      </div>

      <main className="px-4 pb-32 space-y-4">
        {/* Food info card */}
        <div className="bg-gradient-card rounded-2xl p-4 shadow-sm">
          <h2 className="text-xl font-bold text-foreground">{food.name}</h2>
          {food.brand && (
            <p className="text-muted-foreground text-sm">{food.brand}</p>
          )}
        </div>

        {/* Amount input with unit toggle */}
        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
          <div className="flex gap-3">
            <Input
              type="number"
              inputMode="decimal"
              value={amountValue}
              onChange={(e) => setAmountValue(e.target.value)}
              className="flex-1 h-14 text-2xl font-bold text-center font-tabular bg-background rounded-xl border-0"
              autoFocus
            />
            <UnitToggle value={unit} onChange={handleUnitChange} />
          </div>
        </div>

        {/* Live computed macros */}
        <motion.div 
          className="bg-card rounded-2xl p-4 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-sm text-muted-foreground mb-3 text-center">
            This entry adds
          </div>
          <div className="grid grid-cols-4 gap-2">
            <MacroDisplay 
              value={computedMacros.calories} 
              label="Calories" 
              unit="kcal"
              colorClass="text-calories bg-calories-light" 
            />
            <MacroDisplay 
              value={computedMacros.protein} 
              label="Protein" 
              colorClass="text-protein bg-protein-light" 
            />
            <MacroDisplay 
              value={computedMacros.carbs} 
              label="Carbs" 
              colorClass="text-carbs bg-carbs-light" 
            />
            <MacroDisplay 
              value={computedMacros.fat} 
              label="Fat" 
              colorClass="text-fat bg-fat-light" 
            />
          </div>
        </motion.div>

        {/* Meal selector */}
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setShowMealPicker(!showMealPicker)}
            className="w-full flex items-center justify-between p-4"
          >
            <div>
              <div className="text-sm text-muted-foreground">Meal</div>
              <div className="font-semibold capitalize">{selectedMeal}</div>
            </div>
            <ChevronDown className={cn(
              'w-5 h-5 text-muted-foreground transition-transform',
              showMealPicker && 'rotate-180'
            )} />
          </button>
          
          {showMealPicker && (
            <motion.div 
              className="grid grid-cols-2 gap-2 px-4 pb-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              {mealOptions.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedMeal(key);
                    setShowMealPicker(false);
                  }}
                  className={cn(
                    'p-3 rounded-xl font-medium text-sm transition-all',
                    selectedMeal === key
                      ? 'bg-gradient-primary text-white'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  )}
                >
                  {label}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Note */}
        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Note (optional)</Label>
          <Textarea
            placeholder="e.g., cooked weight, brand variant..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="resize-none bg-background border-0 rounded-xl"
            rows={2}
          />
        </div>
      </main>

      {/* Fixed save button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md safe-bottom">
        <Button
          onClick={handleSave}
          size="lg"
          className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 rounded-2xl"
          disabled={!amountValue || parseFloat(amountValue) <= 0}
        >
          <Save className="w-5 h-5 mr-2" />
          {existingEntry ? 'Update Entry' : 'Save Entry'}
        </Button>
      </div>
    </div>
  );
}

function MacroDisplay({ 
  value, 
  label, 
  unit = 'g',
  colorClass 
}: { 
  value: number; 
  label: string; 
  unit?: string;
  colorClass: string;
}) {
  return (
    <div className={cn('rounded-xl p-3 text-center', colorClass.split(' ')[1])}>
      <div className={cn('text-xl font-bold font-tabular', colorClass.split(' ')[0])}>
        {Math.round(value * 10) / 10}
      </div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
        {label}
      </div>
    </div>
  );
}
