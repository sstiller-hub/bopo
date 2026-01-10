import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, ChevronRight, Package, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Entry, Macros, MealType } from '@/types/nutrition';
import { SwipeableEntry } from './SwipeableEntry';
import { Checkbox } from '@/components/ui/checkbox';

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
  getIngredients?: (parentId: string) => Entry[];
  selectionMode?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onUngroupRecipe?: (id: string) => void;
  isCompleted?: boolean;
  onToggleCompleted?: (meal: MealType) => void;
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
  getIngredients,
  selectionMode = false,
  selectedIds = [],
  onToggleSelect,
  onUngroupRecipe,
  isCompleted = false,
  onToggleCompleted,
}: MealSectionProps) {
  const [isExpanded, setIsExpanded] = useState(!isCompleted);
  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(new Set());

  // Auto-collapse when completed, auto-expand when uncompleted
  useEffect(() => {
    setIsExpanded(!isCompleted);
  }, [isCompleted]);

  const toggleRecipeExpanded = (recipeId: string) => {
    setExpandedRecipes(prev => {
      const next = new Set(prev);
      if (next.has(recipeId)) {
        next.delete(recipeId);
      } else {
        next.add(recipeId);
      }
      return next;
    });
  };

  const handleToggleCompleted = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCompleted?.(meal);
  };

  return (
    <div className={cn("glass-card transition-all duration-300", isCompleted && "opacity-75")}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between p-4 transition-colors rounded-t-3xl",
          !isCompleted && "hover:bg-white/5 dark:hover:bg-white/5"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
          {/* Completion indicator - subtle square checkbox */}
          {entries.length > 0 && onToggleCompleted && (
            <div
              onClick={handleToggleCompleted}
              className={cn(
                "w-4 h-4 rounded flex items-center justify-center transition-all cursor-pointer flex-shrink-0",
                isCompleted 
                  ? "bg-primary/20 text-primary" 
                  : "border border-white/25 text-transparent hover:border-white/40 hover:text-white/30"
              )}
            >
              <Check className="w-2.5 h-2.5" />
            </div>
          )}
          
          <span className={cn(
            "font-semibold transition-all",
            isCompleted 
              ? "text-muted-foreground" 
              : "text-foreground dark:text-white/95"
          )}>
            {title}
          </span>
          <span className="text-xs text-muted-foreground dark:text-white/45 font-tabular flex-shrink-0">
            {entries.length}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {/* Mini macro summary - tighter spacing */}
          <div className="flex items-center gap-1.5 text-xs font-tabular">
            <span className={cn("font-semibold", isCompleted ? "text-muted-foreground" : "text-calories")}>
              {Math.round(totals.calories)}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className={isCompleted ? "text-muted-foreground" : "text-protein"}>
              {Math.round(totals.protein)}P
            </span>
            <span className={isCompleted ? "text-muted-foreground" : "text-carbs"}>
              {Math.round(totals.carbs)}C
            </span>
            <span className={isCompleted ? "text-muted-foreground" : "text-fat"}>
              {Math.round(totals.fat)}F
            </span>
          </div>
          <ChevronDown 
            className={cn(
              'w-4 h-4 text-muted-foreground dark:text-white/50 transition-transform flex-shrink-0',
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
                <button
                  onClick={() => onAddFood(meal)}
                  className="w-full p-4 flex items-center justify-center hover:bg-white/5 dark:hover:bg-white/5 transition-colors rounded-b-3xl"
                >
                  <Plus className="w-5 h-5 text-primary" />
                </button>
              ) : (
                <>
                  <div className="divide-y divide-white/5 dark:divide-white/10">
                    {entries.map((entry) => {
                      const ingredients = entry.isRecipe && getIngredients ? getIngredients(entry.id) : [];
                      const isRecipeExpanded = expandedRecipes.has(entry.id);
                      
                      return (
                        <div key={entry.id}>
                          {/* Main entry row */}
                          <div className="flex items-center">
                            {/* Selection checkbox */}
                            {selectionMode && !entry.isRecipe && (
                              <div className="pl-4 pr-2 py-4">
                                <Checkbox
                                  checked={selectedIds.includes(entry.id)}
                                  onCheckedChange={() => onToggleSelect?.(entry.id)}
                                  className="border-white/30"
                                />
                              </div>
                            )}
                            
                            {/* Recipe expand toggle */}
                            {entry.isRecipe && (
                              <button
                                onClick={() => toggleRecipeExpanded(entry.id)}
                                className="pl-4 pr-2 py-4 flex items-center"
                              >
                                <ChevronRight 
                                  className={cn(
                                    'w-4 h-4 text-muted-foreground transition-transform',
                                    isRecipeExpanded && 'rotate-90'
                                  )} 
                                />
                                <Package className="w-4 h-4 text-primary ml-1" />
                              </button>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <SwipeableEntry
                                entry={entry}
                                preferredUnit={preferredUnit}
                                onEdit={onEditEntry}
                                onDelete={onDeleteEntry}
                                onDuplicate={onDuplicateEntry}
                                isRecipe={entry.isRecipe}
                                onUngroup={entry.isRecipe ? () => onUngroupRecipe?.(entry.id) : undefined}
                              />
                            </div>
                          </div>
                          
                          {/* Ingredients tree */}
                          {entry.isRecipe && isRecipeExpanded && ingredients.length > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="bg-white/2 dark:bg-white/2"
                            >
                              {ingredients.map((ingredient, idx) => (
                                <div 
                                  key={ingredient.id}
                                  className="flex items-stretch"
                                >
                                  {/* Tree branch lines */}
                                  <div className="w-10 flex-shrink-0 flex items-stretch justify-center">
                                    <div className="relative w-full h-full flex items-center justify-center">
                                      {/* Vertical line */}
                                      <div 
                                        className={cn(
                                          "absolute left-1/2 w-px bg-white/20",
                                          idx === 0 ? "top-0 h-1/2" : "top-0 h-full",
                                          idx === ingredients.length - 1 ? "h-1/2" : ""
                                        )}
                                        style={{
                                          height: idx === ingredients.length - 1 ? '50%' : '100%',
                                          top: idx === ingredients.length - 1 ? '0' : '0'
                                        }}
                                      />
                                      {/* Horizontal line */}
                                      <div className="absolute left-1/2 top-1/2 w-3 h-px bg-white/20" />
                                      {/* Dot */}
                                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ml-3 w-1.5 h-1.5 rounded-full bg-white/40" />
                                    </div>
                                  </div>
                                  
                                  {/* Ingredient content */}
                                  <div className="flex-1 py-2 pr-4">
                                    <IngredientRow 
                                      entry={ingredient} 
                                      preferredUnit={preferredUnit} 
                                    />
                                  </div>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add food button */}
                  <button
                    onClick={() => onAddFood(meal)}
                    className="w-full p-3 flex items-center justify-center hover:bg-white/5 dark:hover:bg-white/5 transition-colors border-t border-white/10 dark:border-white/10 rounded-b-3xl"
                  >
                    <Plus className="w-4 h-4 text-primary" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IngredientRow({ entry, preferredUnit }: { entry: Entry; preferredUnit: 'g' | 'oz' }) {
  const formatAmount = (grams: number) => {
    if (preferredUnit === 'oz') {
      return `${(grams / 28.3495).toFixed(1)} oz`;
    }
    return `${Math.round(grams)}g`;
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex-1 min-w-0">
        <div className="text-muted-foreground truncate">{entry.foodName}</div>
        <div className="text-xs text-muted-foreground/60">{formatAmount(entry.amountGrams)}</div>
      </div>
      <div className="flex items-center gap-2 text-xs font-tabular text-muted-foreground/80 shrink-0 ml-2">
        <span>{Math.round(entry.computedMacros.calories)}</span>
        <span className="text-muted-foreground/30">|</span>
        <span>{Math.round(entry.computedMacros.protein)}</span>
        <span>{Math.round(entry.computedMacros.carbs)}</span>
        <span>{Math.round(entry.computedMacros.fat)}</span>
      </div>
    </div>
  );
}