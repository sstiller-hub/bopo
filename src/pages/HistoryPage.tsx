import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Check, AlertTriangle } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { BottomNav } from '@/components/BottomNav';
import { useEntries, useSettings } from '@/hooks/useNutritionStore';
import { Macros } from '@/types/nutrition';
import { cn } from '@/lib/utils';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { entries, getTotalsForDate, getHistoryDates } = useEntries();
  const { settings } = useSettings();
  const [viewDays, setViewDays] = useState<7 | 30>(7);

  // Generate all dates in range for display
  const allDates = Array.from({ length: viewDays }, (_, i) => {
    const date = subDays(new Date(), i);
    return format(date, 'yyyy-MM-dd');
  });

  const getStatusForDate = (totals: Macros, targets: Macros) => {
    const tolerance = settings.tolerance || { macros: 5, calories: 50 };
    
    const calDiff = Math.abs(totals.calories - targets.calories);
    const pDiff = Math.abs(totals.protein - targets.protein);
    const cDiff = Math.abs(totals.carbs - targets.carbs);
    const fDiff = Math.abs(totals.fat - targets.fat);

    const isHit = calDiff <= tolerance.calories && 
                  pDiff <= tolerance.macros && 
                  cDiff <= tolerance.macros && 
                  fDiff <= tolerance.macros;

    const isOver = totals.calories > targets.calories ||
                   totals.protein > targets.protein ||
                   totals.carbs > targets.carbs ||
                   totals.fat > targets.fat;

    return { isHit, isOver };
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header - KovaFit style */}
      <div className="px-5 pt-12 pb-4 safe-top">
        <h1 className="text-3xl font-bold text-foreground">History</h1>
      </div>
      
      {/* Period toggle */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 p-1 bg-card rounded-2xl shadow-sm">
          <button
            onClick={() => setViewDays(7)}
            className={cn(
              'flex-1 py-3 rounded-xl font-medium text-sm transition-all',
              viewDays === 7
                ? 'bg-gradient-primary text-white shadow-md'
                : 'text-muted-foreground'
            )}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setViewDays(30)}
            className={cn(
              'flex-1 py-3 rounded-xl font-medium text-sm transition-all',
              viewDays === 30
                ? 'bg-gradient-primary text-white shadow-md'
                : 'text-muted-foreground'
            )}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      <main className="px-4">
        <div className="space-y-2">
          {allDates.map((date, index) => {
            const totals = getTotalsForDate(date);
            const hasEntries = totals.calories > 0;
            const { isHit, isOver } = hasEntries 
              ? getStatusForDate(totals, settings.dailyTargets)
              : { isHit: false, isOver: false };
            
            const dateObj = parseISO(date);
            const isToday = format(new Date(), 'yyyy-MM-dd') === date;
            const isYesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd') === date;

            let dateLabel = format(dateObj, 'EEEE, MMM d');
            if (isToday) dateLabel = 'Today';
            if (isYesterday) dateLabel = 'Yesterday';

            return (
              <motion.button
                key={date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => navigate(`/?date=${date}`)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 bg-card rounded-2xl shadow-sm transition-all active:scale-[0.98]',
                  !hasEntries && 'opacity-60'
                )}
              >
                {/* Status indicator */}
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                  !hasEntries && 'bg-muted',
                  hasEntries && isHit && 'bg-success-light',
                  hasEntries && isOver && !isHit && 'bg-destructive/10',
                  hasEntries && !isOver && !isHit && 'bg-warning/10'
                )}>
                  {hasEntries && isHit && <Check className="w-5 h-5 text-success" />}
                  {hasEntries && isOver && !isHit && <AlertTriangle className="w-5 h-5 text-destructive" />}
                  {hasEntries && !isOver && !isHit && (
                    <span className="text-sm font-bold text-warning">~</span>
                  )}
                  {!hasEntries && <span className="text-sm text-muted-foreground">-</span>}
                </div>

                {/* Date and totals */}
                <div className="flex-1 text-left">
                  <div className={cn(
                    'font-semibold',
                    isToday && 'text-primary'
                  )}>
                    {dateLabel}
                  </div>
                  {hasEntries && (
                    <div className="flex items-center gap-2 text-xs font-tabular mt-0.5">
                      <span className="text-calories">{Math.round(totals.calories)} kcal</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-protein">{Math.round(totals.protein)}P</span>
                      <span className="text-carbs">{Math.round(totals.carbs)}C</span>
                      <span className="text-fat">{Math.round(totals.fat)}F</span>
                    </div>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </motion.button>
            );
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
