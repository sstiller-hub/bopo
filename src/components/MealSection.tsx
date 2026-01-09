import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Trash2, Copy, Edit2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Entry, Macros, MealType, gramsToOunces } from '@/types/nutrition';

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
  const [swipedEntryId, setSwipedEntryId] = useState<string | null>(null);

  const formatAmount = (grams: number) => {
    if (preferredUnit === 'oz') {
      return `${gramsToOunces(grams).toFixed(1)} oz`;
    }
    return `${Math.round(grams)}g`;
  };

  return (
    <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-foreground">{title}</span>
          <span className="text-sm text-muted-foreground font-tabular">
            {entries.length} {entries.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* Mini macro summary */}
          <div className="flex items-center gap-3 text-xs font-tabular">
            <span className="text-calories font-semibold">{Math.round(totals.calories)}</span>
            <span className="text-muted-foreground/50">•</span>
            <span className="text-protein">{Math.round(totals.protein)}P</span>
            <span className="text-carbs">{Math.round(totals.carbs)}C</span>
            <span className="text-fat">{Math.round(totals.fat)}F</span>
          </div>
          <ChevronDown 
            className={cn(
              'w-5 h-5 text-muted-foreground transition-transform',
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
            <div className="border-t border-border/50">
              {entries.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No foods logged yet
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="relative overflow-hidden"
                    >
                      {/* Entry content */}
                      <motion.div
                        className="flex items-center justify-between p-4 bg-card"
                        animate={{ x: swipedEntryId === entry.id ? -120 : 0 }}
                        transition={{ type: 'spring', damping: 20 }}
                        onClick={() => setSwipedEntryId(swipedEntryId === entry.id ? null : entry.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground truncate">
                            {entry.foodName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatAmount(entry.amountGrams)}
                            {entry.note && <span className="ml-2 italic">• {entry.note}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-tabular shrink-0 ml-4">
                          <span className="text-calories font-semibold">{Math.round(entry.computedMacros.calories)}</span>
                          <span className="text-muted-foreground/40">|</span>
                          <span className="text-protein">{Math.round(entry.computedMacros.protein)}</span>
                          <span className="text-carbs">{Math.round(entry.computedMacros.carbs)}</span>
                          <span className="text-fat">{Math.round(entry.computedMacros.fat)}</span>
                        </div>
                      </motion.div>

                      {/* Swipe actions */}
                      <div className="absolute right-0 top-0 bottom-0 flex items-stretch">
                        <button
                          onClick={() => onEditEntry(entry)}
                          className="w-10 bg-primary flex items-center justify-center text-primary-foreground"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDuplicateEntry(entry.id)}
                          className="w-10 bg-muted flex items-center justify-center text-foreground"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteEntry(entry.id)}
                          className="w-10 bg-destructive flex items-center justify-center text-destructive-foreground"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add food button */}
              <button
                onClick={() => onAddFood(meal)}
                className="w-full p-3 flex items-center justify-center gap-2 text-primary font-medium hover:bg-primary/5 transition-colors border-t border-border/50"
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
