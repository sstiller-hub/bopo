import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, Calendar, Zap, Copy } from 'lucide-react';
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
  const { getEntriesByMeal, getMealTotals, getTotalsForDate, deleteEntry, duplicateEntry, addEntry, copyEntriesFromDate, getEntriesForDate } = useEntries();
  
  // Get selected date from URL or default to today
  const dateParam = searchParams.get('date');
  const selectedDate = dateParam || format(new Date(), 'yyyy-MM-dd');
  const selectedDateObj = parseISO(selectedDate);
  const isSelectedToday = isToday(selectedDateObj);
  const yesterdayDate = format(subDays(selectedDateObj, 1), 'yyyy-MM-dd');

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // Check if yesterday has entries and today is empty
  const yesterdayEntries = getEntriesForDate(yesterdayDate);
  const todayEntries = getEntriesForDate(selectedDate);
  const canCopyYesterday = yesterdayEntries.length > 0 && todayEntries.length === 0;

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

  const handleCopyYesterday = async () => {
    setIsCopying(true);
    try {
      const count = await copyEntriesFromDate(yesterdayDate, selectedDate);
      if (count > 0) {
        toast.success(`Copied ${count} entries from yesterday`);
      } else {
        toast.error('No entries to copy');
      }
    } catch {
      toast.error('Failed to copy entries');
    } finally {
      setIsCopying(false);
    }
  };

  const getDateLabel = () => {
    if (isSelectedToday) return 'Today';
    if (format(subDays(new Date(), 1), 'yyyy-MM-dd') === selectedDate) return 'Yesterday';
    return format(selectedDateObj, 'EEE, MMM d');
  };

  return (
    <main className="relative min-h-screen pb-[calc(env(safe-area-inset-bottom)+140px)] glass-scope">
      {/* Atmospheric background particles */}
      <div className="home-atmosphere" aria-hidden="true">
        <span className="home-particle" />
        <span className="home-particle" />
        <span className="home-particle" />
        <span className="home-particle" />
        <span className="home-particle" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-10 bg-transparent">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-3">
          <div className="flex-1 text-left min-w-0 space-y-1">
            <div 
              className="section-label"
              style={{ fontSize: '10px', fontWeight: 500 }}
            >
              MACRO TRACKER
            </div>
            <h1 
              className="text-foreground dark:text-white/95"
              style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em' }}
            >
              {getDateLabel()}
            </h1>
            {!isSelectedToday && (
              <p 
                className="text-muted-foreground dark:text-white/40"
                style={{ fontSize: '13px', fontWeight: 500 }}
              >
                {format(selectedDateObj, 'MMMM d, yyyy')}
              </p>
            )}
            {isSelectedToday && (
              <p 
                className="text-muted-foreground dark:text-white/40"
                style={{ fontSize: '13px', fontWeight: 500 }}
              >
                {format(selectedDateObj, 'MMM d, yyyy')}
              </p>
            )}
          </div>

          {/* Date navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousDay}
              aria-label="Previous day"
              className="h-10 w-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextDay}
              aria-label="Next day"
              className="h-10 w-10"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
            {!isSelectedToday && (
              <Button
                variant="ghost"
                size="icon"
                onClick={goToToday}
                aria-label="Go to today"
                className="h-10 w-10"
              >
                <Calendar className="w-6 h-6" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 px-6 pt-4 space-y-6">
        {/* Hero macro summary card */}
        <section>
          <div className="glass-hero p-5">
            <div 
              className="section-label mb-3"
              style={{ color: 'rgba(255, 255, 255, 0.4)' }}
            >
              REMAINING
            </div>
            
            <div className="grid grid-cols-4 gap-1.5">
              <MacroItem label="Cal" value={remaining.calories} isOver={remaining.calories < 0} />
              <MacroItem label="Pro" value={remaining.protein} isOver={remaining.protein < 0} />
              <MacroItem label="Carb" value={remaining.carbs} isOver={remaining.carbs < 0} />
              <MacroItem label="Fat" value={remaining.fat} isOver={remaining.fat < 0} />
            </div>
          </div>
        </section>

        {/* Meals section */}
        <section className="space-y-3">
          <div className="section-label">MEALS</div>
          
          {/* Copy Yesterday button */}
          {canCopyYesterday && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button
                onClick={handleCopyYesterday}
                disabled={isCopying}
                className="w-full glass-card p-4 flex items-center justify-center gap-2 text-primary font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                <Copy className="w-4 h-4" />
                {isCopying ? 'Copying...' : `Copy Yesterday's Meals (${yesterdayEntries.length} items)`}
              </button>
            </motion.div>
          )}

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
        </section>
      </div>

      {/* Floating buttons */}
      <div className="fixed bottom-32 right-6 z-40 flex flex-col gap-3">
        {/* Quick Add button */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <button
            onClick={() => setShowQuickAdd(true)}
            className="h-12 w-12 rounded-full flex items-center justify-center glass-card hover:bg-white/10 transition-colors"
            style={{
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            }}
          >
            <Zap className="w-5 h-5 text-primary" />
          </button>
        </motion.div>

        {/* Add Food button */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          <button
            onClick={() => navigate('/log')}
            className="h-14 w-14 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, hsl(12, 65%, 55%) 0%, hsl(8, 55%, 45%) 100%)',
              boxShadow: '0 8px 24px rgba(255, 87, 51, 0.35), 0 0 20px rgba(255, 87, 51, 0.15)',
            }}
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        </motion.div>
      </div>

      <BottomNav />

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onSave={handleQuickAdd}
      />
    </main>
  );
}

function MacroItem({ label, value, isOver }: { label: string; value: number; isOver: boolean }) {
  return (
    <div className="flex-1 text-center">
      <div 
        className="rounded-2xl p-3"
        style={{ background: 'rgba(0, 0, 0, 0.2)' }}
      >
        <div 
          className="font-tabular leading-none"
          style={{ 
            fontSize: '26px', 
            fontWeight: 800, 
            letterSpacing: '-0.03em',
            color: isOver ? 'rgba(239, 68, 68, 0.85)' : 'rgba(255, 255, 255, 0.95)'
          }}
        >
          {Math.round(value)}
        </div>
        <div 
          className="font-medium uppercase tracking-wider mt-1"
          style={{ 
            fontSize: '10px', 
            color: 'rgba(255, 255, 255, 0.5)' 
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}