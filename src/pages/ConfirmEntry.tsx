import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Save, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { getDefaultMeal, isMealType, setStoredMeal } from '@/lib/meals';

type ServingUnit = 'serving' | 'g' | 'oz';

const mealOptions: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snacks', label: 'Snacks' },
];

function formatServingValue(value: number) {
  if (!Number.isFinite(value)) return '';
  if (value % 1 === 0) return value.toString();
  return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export default function ConfirmEntry() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const foodId = searchParams.get('foodId');
  const entryId = searchParams.get('entryId');
  const mealParam = searchParams.get('meal');
  const initialMeal = isMealType(mealParam) ? mealParam : getDefaultMeal();
  
  const { foods, updateFood, incrementFoodUsage } = useFoods();
  const { entries, addEntry, updateEntry } = useEntries();
  const { settings, updateSettings } = useSettings();
  
  const [selectedMeal, setSelectedMeal] = useState<MealType>(initialMeal);
  const [amountValue, setAmountValue] = useState('100');
  const [servingUnit, setServingUnit] = useState<ServingUnit>('g');
  const [note, setNote] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showMealPicker, setShowMealPicker] = useState(false);
  const initRef = useRef<string | null>(null);

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
    if (!food) return;
    const key = existingEntry?.id ?? `food-${food.id}`;
    if (initRef.current === key) return;
    initRef.current = key;

    if (existingEntry) {
      setSelectedMeal(existingEntry.meal);
      setNote(existingEntry.note || '');
      if (food.nutritionBasis === 'per_serving' && food.servingGrams) {
        setServingUnit('serving');
        const servings = existingEntry.amountGrams / food.servingGrams;
        setAmountValue(formatServingValue(servings));
      } else {
        const preferredUnit = settings.preferredUnit;
        setServingUnit(preferredUnit);
        const displayAmount = preferredUnit === 'oz' 
          ? gramsToOunces(existingEntry.amountGrams)
          : existingEntry.amountGrams;
        setAmountValue(formatServingValue(displayAmount));
      }
    } else {
      if (food.nutritionBasis === 'per_serving' && food.servingGrams) {
        setServingUnit('serving');
        setAmountValue('1');
      } else {
        const preferredUnit = settings.preferredUnit;
        setServingUnit(preferredUnit);
        const displayAmount = preferredUnit === 'oz' ? gramsToOunces(100) : 100;
        setAmountValue(formatServingValue(displayAmount));
      }
    }

    setIsFavorite(food.isFavorite || false);
  }, [existingEntry?.id, food, settings.preferredUnit]);

  const servingLabel = food?.servingLabel?.trim() || '';
  const servingGrams = food?.servingGrams || 0;
  const servingOunces = servingGrams ? gramsToOunces(servingGrams) : 0;

  // Calculate macros
  const amountGrams = useMemo(() => {
    const numValue = parseFloat(amountValue) || 0;
    if (servingUnit === 'serving') {
      return servingGrams ? numValue * servingGrams : numValue;
    }
    return servingUnit === 'oz' ? ouncesToGrams(numValue) : numValue;
  }, [amountValue, servingUnit, servingGrams]);

  const computedMacros = useMemo<Macros>(() => {
    if (!food) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return calculateMacros(food, amountGrams);
  }, [food, amountGrams]);

  const handleServingUnitChange = (nextUnit: ServingUnit) => {
    const currentValue = parseFloat(amountValue) || 0;
    const currentGrams = servingUnit === 'serving'
      ? (servingGrams ? currentValue * servingGrams : currentValue)
      : servingUnit === 'oz'
        ? ouncesToGrams(currentValue)
        : currentValue;

    const nextValue = nextUnit === 'serving'
      ? (servingGrams ? currentGrams / servingGrams : currentGrams)
      : nextUnit === 'oz'
        ? gramsToOunces(currentGrams)
        : currentGrams;

    setServingUnit(nextUnit);
    setAmountValue(formatServingValue(nextValue));

    if (nextUnit === 'g' || nextUnit === 'oz') {
      updateSettings({ preferredUnit: nextUnit });
    }
  };

  const handleEditFood = () => {
    if (!food) return;
    const returnTo = `${location.pathname}${location.search}`;
    navigate(`/foods/edit/${food.id}?returnTo=${encodeURIComponent(returnTo)}`);
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

    setStoredMeal(selectedMeal);
    navigate('/', { state: { refreshEntries: true } });
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
            onClick={() => {
              if (window.history.length > 2) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
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
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-foreground truncate">{food.name}</h2>
              {food.brand && (
                <p className="text-muted-foreground text-sm truncate">{food.brand}</p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleEditFood} className="shrink-0">
              Edit Food
            </Button>
          </div>
        </div>

        {/* Serving size + servings */}
        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm font-medium text-muted-foreground">Serving Size</Label>
            <Select value={servingUnit} onValueChange={handleServingUnitChange}>
              <SelectTrigger className="h-11 w-40 bg-background border-0 rounded-xl text-sm font-semibold justify-between">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {food.nutritionBasis === 'per_serving' && food.servingGrams && (
                  <SelectItem value="serving">
                    {servingLabel ? `1 serving (${servingLabel})` : '1 serving'}
                  </SelectItem>
                )}
                <SelectItem value="g">1 g</SelectItem>
                <SelectItem value="oz">1 oz</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm font-medium text-muted-foreground">Number of Servings</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={amountValue}
              onChange={(e) => setAmountValue(e.target.value)}
              className="h-12 w-28 text-lg font-bold text-center font-tabular bg-background rounded-xl border-0"
              autoFocus
            />
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
