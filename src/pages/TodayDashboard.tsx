import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, Calendar, Zap } from 'lucide-react';
import { format, addDays, subDays, isToday, parseISO } from 'date-fns';
import { MealSection } from '@/components/MealSection';
import { BottomNav } from '@/components/BottomNav';
import { QuickAddModal } from '@/components/QuickAddModal';
import { Button } from '@/components/ui/button';
import { useSettings, useEntries } from '@/hooks/useNutritionStore';
import { MealType, Entry, Macros } from '@/types/nutrition';
import { toast } from 'sonner';

const meals: { key: MealType; defaultName: string }[] = [
  { key: 'breakfast', defaultName: 'Breakfast' },
  { key: 'lunch', defaultName: 'Lunch' },
  { key: 'dinner', defaultName: 'Dinner' },
  { key: 'snacks', defaultName: 'Snacks' },
];

export default function TodayDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings } = useSettings();
  const { getEntriesByMeal, getMealTotals, getTotalsForDate, deleteEntry, duplicateEntry, addEntry } = useEntries();
  
  // Get selected date from URL or default to today
  const dateParam = searchParams.get('date');
  const selectedDate = dateParam || format(new Date(), 'yyyy-MM-dd');
  const selectedDateObj = parseISO(selectedDate);
  const isSelectedToday = isToday(selectedDateObj);

  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Calculate stats for selected date
  const consumed = getTotalsForDate(selectedDate);
  const targets = settings.dailyTargets;
  const remaining: Macros = {
    calories: targets.calories - consumed.calories,
    protein: targets.protein - consumed.protein,
    carbs: targets.carbs - consumed.carbs,
    fat: targets.fat - consumed.fat,
  };

  const navigateToDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (isToday(date)) {
      setSearchParams({});
    } else {
      setSearchParams({ date: dateStr });
    }
  };

  const goToPreviousDay = () => {
    navigateToDate(subDays(selectedDateObj, 1));
  };

  const goToNextDay = () => {
    navigateToDate(addDays(selectedDateObj, 1));
  };

  const goToToday = () => {
    setSearchParams({});
  };

  const handleAddFood = (meal: MealType) => {
    navigate(`/log?meal=${meal}`);
  };

  const handleEditEntry = (entry: Entry) => {
    navigate(`/confirm?entryId=${entry.id}`);
  };

  const handleDeleteEntry = (id: string) => {
    deleteEntry(id);
    toast.success('Entry deleted');
  };

  const handleDuplicateEntry = (id: string) => {
    duplicateEntry(id);
    toast.success('Entry duplicated');
  };

  const handleQuickAdd = async (data: {
    meal: MealType;
    name: string;
    macros: { calories: number; protein: number; carbs: number; fat: number };
  }) => {
    await addEntry({
      date: selectedDate,
      meal: data.meal,
      foodName: data.name,
      amountGrams: 0,
      computedMacros: data.macros,
    });
    toast.success('Quick entry added');
  };

  // Format date display
  const getDateLabel = () => {
    if (isSelectedToday) return 'Today';
    if (format(subDays(new Date(), 1), 'yyyy-MM-dd') === selectedDate) return 'Yesterday';
    return format(selectedDateObj, 'EEE, MMM d');
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header with date navigation */}
      <div className="sticky top-0 z-40 bg-background safe-top safe-x pb-2">
        {/* Title row */}
        <div className="pt-4 pb-2 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-1">MACRO TRACKER</p>
            <h1 className="text-3xl font-bold text-foreground">{getDateLabel()}</h1>
          </div>
          
          {/* Date navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={goToPreviousDay}
              className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={goToNextDay}
              className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
            {!isSelectedToday && (
              <button
                onClick={goToToday}
                className="h-10 px-3 rounded-full bg-primary text-primary-foreground flex items-center gap-1 shadow-sm text-sm font-medium"
              >
                <Calendar className="w-4 h-4" />
                Today
              </button>
            )}
          </div>
        </div>

        {/* Date subtitle */}
        {!isSelectedToday && (
          <p className="text-sm text-muted-foreground mb-2">
            {format(selectedDateObj, 'MMMM d, yyyy')}
          </p>
        )}

        {/* Macro summary card */}
        <div className="bg-gradient-primary rounded-3xl p-4 shadow-lg">
          <div className="text-xs text-white/70 font-medium uppercase tracking-widest mb-3">
            Remaining
          </div>
          
          <div className="flex gap-2">
            <MacroItem label="Cal" value={remaining.calories} isOver={remaining.calories < 0} />
            <MacroItem label="Protein" value={remaining.protein} isOver={remaining.protein < 0} />
            <MacroItem label="Carbs" value={remaining.carbs} isOver={remaining.carbs < 0} />
            <MacroItem label="Fat" value={remaining.fat} isOver={remaining.fat < 0} />
          </div>
        </div>
      </div>

      <main className="px-4 py-2 space-y-3">
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
              entries={getEntriesByMeal(selectedDate, key)}
              totals={getMealTotals(selectedDate, key)}
              preferredUnit={settings.preferredUnit}
              onAddFood={handleAddFood}
              onEditEntry={handleEditEntry}
              onDeleteEntry={handleDeleteEntry}
              onDuplicateEntry={handleDuplicateEntry}
            />
          </motion.div>
        ))}
      </main>

      {/* Floating buttons */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-3">
        {/* Quick Add button */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <Button
            size="lg"
            variant="secondary"
            onClick={() => setShowQuickAdd(true)}
            className="h-12 w-12 rounded-full shadow-lg"
          >
            <Zap className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* Add Food button */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          <Button
            size="lg"
            onClick={() => navigate('/log')}
            className="h-14 w-14 rounded-full shadow-lg shadow-primary/30 bg-gradient-primary hover:opacity-90"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </motion.div>
      </div>

      <BottomNav />

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onSave={handleQuickAdd}
      />
    </div>
  );
}

function MacroItem({ label, value, isOver }: { label: string; value: number; isOver: boolean }) {
  return (
    <div className="flex-1 text-center">
      <div className="rounded-2xl p-3 bg-black/20 dark:bg-black/30">
        <div className={`text-2xl font-bold font-tabular leading-none ${isOver ? 'text-red-300' : 'text-white'}`}>
          {Math.round(value)}
        </div>
        <div className="text-[10px] text-white/70 font-medium uppercase tracking-wider mt-1">
          {label}
        </div>
      </div>
    </div>
  );
}
