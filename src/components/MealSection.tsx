import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Entry, Macros, MealType } from '@/types/nutrition';
import { SwipeableEntry } from './SwipeableEntry';

interface MealSectionProps {
  title: string;
  meal: MealType;
  entries: Entry[];
  totals: Macros;
  preferredUnit: 'g' | 'oz';
  onAddFood: (meal: MealType) => void;
  onEditEntry: (entry: Entry) => void;
  onDeleteEntry: (id: string) => void;
  onDuplicateEntry: (id: string) => void;
}

export function MealSection({
  title,
  meal,
  entries,
  totals,
  preferredUnit,
  onAddFood,
  onEditEntry,
  onDeleteEntry,
  onDuplicateEntry,
}: MealSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="glass-card">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 dark:hover:bg-white/5 transition-colors rounded-t-3xl"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-foreground dark:text-white/95">{title}</span>
          <span className="text-sm text-muted-foreground dark:text-white/45 font-tabular">
            {entries.length} {entries.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* Mini macro summary */}
          <div className="flex items-center gap-3 text-xs font-tabular">
            <span className="text-calories font-semibold">{Math.round(totals.calories)}</span>
            <span className="text-muted-foreground/50 dark:text-white/20">•</span>
            <span className="text-protein">{Math.round(totals.protein)}P</span>
            <span className="text-carbs">{Math.round(totals.carbs)}C</span>
            <span className="text-fat">{Math.round(totals.fat)}F</span>
          </div>
          <ChevronDown 
            className={cn(
              'w-5 h-5 text-muted-foreground dark:text-white/50 transition-transform',
              isExpanded && 'rotate-180'
            )} 
          />
        </div>
      </button>

      {/* Entries */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 dark:border-white/10">
              {entries.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground dark:text-white/40 text-sm">
                  No foods logged yet
                </div>
              ) : (
                <div className="divide-y divide-white/5 dark:divide-white/10">
                  {entries.map((entry) => (
                    <SwipeableEntry
                      key={entry.id}
                      entry={entry}
                      preferredUnit={preferredUnit}
                      onEdit={onEditEntry}
                      onDelete={onDeleteEntry}
                      onDuplicate={onDuplicateEntry}
                    />
                  ))}
                </div>
              )}

              {/* Add food button */}
              <button
                onClick={() => onAddFood(meal)}
                className="w-full p-3 flex items-center justify-center gap-2 text-primary font-medium hover:bg-white/5 dark:hover:bg-white/5 transition-colors border-t border-white/10 dark:border-white/10 rounded-b-3xl"
              >
                <Plus className="w-4 h-4" />
                Add Food
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}