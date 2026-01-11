import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, Calendar, Zap, Copy, Package, X, Check, RefreshCw } from 'lucide-react';
import { format, addDays, subDays, isToday, parseISO } from 'date-fns';
import { MealSection } from '@/components/MealSection';
import { BottomNav } from '@/components/BottomNav';
import { QuickAddModal } from '@/components/QuickAddModal';
import { Button } from '@/components/ui/button';
import { useSettings, useEntries, useFoods } from '@/hooks/useNutritionStore';
import { useMealTemplates, MealTemplate } from '@/hooks/useMealTemplates';
import { Skeleton } from '@/components/ui/skeleton';
import { MealType, Entry, Macros } from '@/types/nutrition';
import { toast } from 'sonner';
import { getDefaultMeal, setStoredMeal } from '@/lib/meals';

const meals: { key: MealType; defaultName: string }[] = [
  { key: 'breakfast', defaultName: 'Breakfast' },
  { key: 'lunch', defaultName: 'Lunch' },
  { key: 'dinner', defaultName: 'Dinner' },
  { key: 'snacks', defaultName: 'Snacks' },
];

export default function TodayDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings, loading: settingsLoading } = useSettings();
  const { getEntriesByMeal, getMealTotals, getTotalsForDate, deleteEntry, duplicateEntry, addEntry, copyEntriesFromDate, getEntriesForDate, getIngredients, groupAsRecipe, ungroupRecipe, getWeeklyAverages, refetch: refetchEntries, loading: entriesLoading, refreshing } = useEntries();
  const { loading: foodsLoading } = useFoods();
  const { templates, createTemplate, getTemplatesForMeal, incrementUsage } = useMealTemplates();
  
  // Get weekly averages
  const weeklyAverages = getWeeklyAverages();
  
  const isLoading = settingsLoading || entriesLoading || foodsLoading;
  
  // Get selected date from URL or default to today
  const dateParam = searchParams.get('date');
  const selectedDate = dateParam || format(new Date(), 'yyyy-MM-dd');
  const selectedDateObj = parseISO(selectedDate);
  const isSelectedToday = isToday(selectedDateObj);
  const yesterdayDate = format(subDays(selectedDateObj, 1), 'yyyy-MM-dd');

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGrouping, setIsGrouping] = useState(false);
  const [completedMeals, setCompletedMeals] = useState<Set<MealType>>(new Set());

  // Refetch entries when page becomes visible (e.g., after navigating back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetchEntries();
      }
    };
    
    // Also refetch on focus (for SPA navigation)
    const handleFocus = () => {
      refetchEntries();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetchEntries]);

  useEffect(() => {
    if (location.state?.refreshEntries) {
      refetchEntries();
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
  }, [location, navigate, refetchEntries]);

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
    setStoredMeal(data.meal);
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

  const handleCopyMealFromYesterday = async (meal: MealType) => {
    const yesterdayMealEntries = getEntriesByMeal(yesterdayDate, meal);
    if (yesterdayMealEntries.length === 0) {
      toast.error('No entries to copy');
      return;
    }

    let copiedCount = 0;
    for (const entry of yesterdayMealEntries) {
      await addEntry({
        date: selectedDate,
        meal: entry.meal,
        foodId: entry.foodId,
        foodName: entry.foodName,
        amountGrams: entry.amountGrams,
        computedMacros: entry.computedMacros,
        note: entry.note,
      });
      copiedCount++;
    }
    
    toast.success(`Copied ${copiedCount} ${meal} item${copiedCount !== 1 ? 's' : ''} from yesterday`);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleGroupAsRecipe = async () => {
    if (selectedIds.length < 2) {
      toast.error('Select at least 2 items to group');
      return;
    }
    
    setIsGrouping(true);
    const recipeName = prompt('Enter a name for this recipe:');
    if (!recipeName) {
      setIsGrouping(false);
      return;
    }

    try {
      const result = await groupAsRecipe(selectedIds, recipeName);
      if (result) {
        toast.success(`Created recipe "${recipeName}"`);
        setSelectedIds([]);
        setSelectionMode(false);
      } else {
        toast.error('Failed to create recipe');
      }
    } catch {
      toast.error('Failed to create recipe');
    } finally {
      setIsGrouping(false);
    }
  };

  const handleUngroupRecipe = async (id: string) => {
    await ungroupRecipe(id);
    toast.success('Recipe ungrouped');
  };

  const handleToggleMealCompleted = (meal: MealType) => {
    setCompletedMeals(prev => {
      const next = new Set(prev);
      if (next.has(meal)) {
        next.delete(meal);
      } else {
        next.add(meal);
      }
      return next;
    });
  };

  const handleSaveAsTemplate = async (meal: MealType, entries: Entry[]) => {
    const name = prompt('Name this template:');
    if (!name) return;
    
    const template = await createTemplate(name, meal, entries);
    if (template) {
      toast.success(`Template "${name}" saved`);
    } else {
      toast.error('Failed to save template');
    }
  };

  const handleApplyTemplate = async (template: MealTemplate) => {
    for (const entry of template.entries) {
      await addEntry({
        date: selectedDate,
        meal: template.mealType,
        foodId: entry.foodId,
        foodName: entry.foodName,
        amountGrams: entry.amountGrams,
        computedMacros: entry.macros,
      });
    }
    await incrementUsage(template.id);
    toast.success(`Added ${template.entries.length} items from "${template.name}"`);
  };

  const getDateLabel = () => {
    if (isSelectedToday) return 'Today';
    if (format(subDays(new Date(), 1), 'yyyy-MM-dd') === selectedDate) return 'Yesterday';
    return format(selectedDateObj, 'EEE, MMM d');
  };

  return (
    <main className="relative min-h-screen pb-[calc(env(safe-area-inset-bottom)+140px)] glass-scope">
      {/* Refresh indicator */}
      {refreshing && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/90 backdrop-blur-md shadow-lg border border-white/10"
          >
            <RefreshCw className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Syncing...</span>
          </motion.div>
        </div>
      )}

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
            {/* Weekly averages - only show when we have 2+ days of data */}
            {isSelectedToday && weeklyAverages.daysWithData >= 2 && (
              <p 
                className="text-muted-foreground/70 dark:text-white/30 font-tabular"
                style={{ fontSize: '11px' }}
              >
                {weeklyAverages.daysWithData}-day avg: {weeklyAverages.calories} cal · {weeklyAverages.protein}P
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
        {isLoading ? (
          <div className="glass-hero p-5 space-y-4">
            <Skeleton className="h-3 w-28 bg-white/10" />
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24 bg-white/10" />
                    <Skeleton className="h-3 w-16 bg-white/10" />
                  </div>
                  <Skeleton className="h-2 w-full bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-hero p-5">
            <div 
              className="section-label mb-4"
              style={{ color: 'rgba(255, 255, 255, 0.4)' }}
            >
              DAILY PROGRESS
            </div>
            
            <div className="space-y-3">
              <MacroProgressBar 
                label="Calories" 
                consumed={consumed.calories} 
                target={targets.calories}
                unit=""
                color="hsl(210, 80%, 55%)"
                glowColor="rgba(59, 130, 246, 0.4)"
              />
              <MacroProgressBar 
                label="Protein" 
                consumed={consumed.protein} 
                target={targets.protein}
                unit="g"
                color="hsl(280, 65%, 60%)"
                glowColor="rgba(168, 85, 247, 0.4)"
              />
              <MacroProgressBar 
                label="Carbs" 
                consumed={consumed.carbs} 
                target={targets.carbs}
                unit="g"
                color="hsl(45, 85%, 55%)"
                glowColor="rgba(234, 179, 8, 0.4)"
              />
              <MacroProgressBar 
                label="Fat" 
                consumed={consumed.fat} 
                target={targets.fat}
                unit="g"
                color="hsl(340, 70%, 58%)"
                glowColor="rgba(236, 72, 153, 0.4)"
              />
            </div>
          </div>
        )}
        </section>

        {/* Meals section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="section-label">MEALS</div>
            {/* Selection mode toggle */}
            {!selectionMode ? (
              <button
                onClick={() => setSelectionMode(true)}
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                <Package className="w-3.5 h-3.5" />
                Group as Recipe
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {selectedIds.length} selected
                </span>
                <button
                  onClick={() => {
                    setSelectionMode(false);
                    setSelectedIds([]);
                  }}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={handleGroupAsRecipe}
                  disabled={selectedIds.length < 2 || isGrouping}
                  className="p-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {/* Copy Yesterday button */}
          {canCopyYesterday && !selectionMode && (
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
                getIngredients={getIngredients}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onUngroupRecipe={handleUngroupRecipe}
                isCompleted={completedMeals.has(key)}
                onToggleCompleted={handleToggleMealCompleted}
                templates={getTemplatesForMeal(key)}
                onSaveAsTemplate={handleSaveAsTemplate}
                onApplyTemplate={handleApplyTemplate}
                yesterdayMealEntries={getEntriesByMeal(yesterdayDate, key)}
                onCopyFromYesterday={handleCopyMealFromYesterday}
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
            onClick={() => navigate(`/log?meal=${getDefaultMeal()}`)}
            className="h-14 w-14 rounded-full flex items-center justify-center transition-all active:scale-95 bg-gradient-primary"
            style={{
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.35), 0 0 20px rgba(59, 130, 246, 0.15)',
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
        defaultMeal={getDefaultMeal()}
      />
    </main>
  );
}

function MacroProgressBar({ 
  label, 
  consumed, 
  target, 
  unit,
  color,
  glowColor
}: { 
  label: string; 
  consumed: number; 
  target: number;
  unit: string;
  color: string;
  glowColor: string;
}) {
  const remaining = target - consumed;
  const isOver = remaining < 0;
  const percentage = Math.min((consumed / target) * 100, 100);
  const displayRemaining = Math.abs(Math.round(remaining));
  const displayConsumed = Math.round(consumed);
  
  return (
    <div className="space-y-1.5">
      {/* Labels row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span 
            className="font-semibold text-sm"
            style={{ color }}
          >
            {label}
          </span>
          <span 
            className="font-tabular text-sm"
            style={{ color: 'rgba(255, 255, 255, 0.9)' }}
          >
            {displayConsumed}{unit}
          </span>
        </div>
        <span 
          className="font-tabular text-xs"
          style={{ 
            color: isOver ? 'rgba(239, 68, 68, 0.9)' : 'rgba(255, 255, 255, 0.5)'
          }}
        >
          {isOver ? `${displayRemaining}${unit} over` : `${displayRemaining}${unit} left`}
        </span>
      </div>
      
      {/* Progress bar */}
      <div 
        className="relative h-2 rounded-full overflow-hidden"
        style={{ background: 'rgba(255, 255, 255, 0.08)' }}
      >
        {/* Glow effect layer */}
        <div 
          className="absolute inset-0 rounded-full transition-all duration-700 ease-out"
          style={{ 
            width: `${percentage}%`,
            background: `linear-gradient(90deg, transparent 0%, ${glowColor} 50%, transparent 100%)`,
            filter: 'blur(4px)',
            opacity: 0.6
          }}
        />
        
        {/* Main progress bar */}
        <div 
          className="relative h-full rounded-full transition-all duration-700 ease-out"
          style={{ 
            width: `${percentage}%`,
            background: isOver 
              ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.7) 0%, rgba(239, 68, 68, 0.9) 100%)' 
              : `linear-gradient(90deg, ${color.replace(')', ', 0.7)')}, ${color})`,
            boxShadow: isOver 
              ? '0 0 12px rgba(239, 68, 68, 0.5)' 
              : `0 0 12px ${glowColor}`
          }}
        />
      </div>
    </div>
  );
}
