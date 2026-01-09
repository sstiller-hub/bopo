import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Macros } from '@/types/nutrition';

interface StickyMacroHeaderProps {
  consumed: Macros;
  targets: Macros;
  remaining: Macros;
}

interface MacroItemProps {
  label: string;
  remaining: number;
  consumed: number;
  target: number;
  unit?: string;
  colorClass: string;
  bgClass: string;
}

function MacroItem({ label, remaining, consumed, target, unit = 'g', colorClass, bgClass }: MacroItemProps) {
  const percentage = Math.min((consumed / target) * 100, 100);
  const isOver = remaining < 0;

  return (
    <div className="flex-1 text-center">
      <div className={cn(
        'rounded-2xl p-3 transition-colors',
        bgClass
      )}>
        <div className={cn(
          'text-2xl font-bold font-tabular leading-none',
          isOver ? 'text-destructive' : colorClass
        )}>
          {Math.round(remaining)}
        </div>
        <div className="text-[10px] text-foreground/60 font-medium uppercase tracking-wider mt-1">
          {label}
        </div>
        {/* Mini progress bar */}
        <div className="h-1 rounded-full bg-foreground/10 mt-2 overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full',
              isOver ? 'bg-destructive' : colorClass.replace('text-', 'bg-')
            )}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground mt-1.5 font-tabular">
        {Math.round(consumed)} / {target}
      </div>
    </div>
  );
}

export function StickyMacroHeader({ consumed, targets, remaining }: StickyMacroHeaderProps) {
  return (
    <motion.div 
      className="sticky top-0 z-40 bg-background safe-top safe-x pb-4"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Title */}
      <div className="pt-4 pb-3">
        <h1 className="text-2xl font-bold text-foreground">Today</h1>
      </div>

      {/* Main card with gradient like KovaFit */}
      <div className="bg-gradient-card rounded-3xl p-4 shadow-sm">
        <div className="text-xs text-foreground/60 font-medium uppercase tracking-widest mb-3">
          Remaining
        </div>
        
        {/* Macro grid */}
        <div className="flex gap-2">
          <MacroItem
            label="Cal"
            remaining={remaining.calories}
            consumed={consumed.calories}
            target={targets.calories}
            unit="kcal"
            colorClass="text-calories"
            bgClass="bg-white/40"
          />
          <MacroItem
            label="Protein"
            remaining={remaining.protein}
            consumed={consumed.protein}
            target={targets.protein}
            colorClass="text-protein"
            bgClass="bg-white/40"
          />
          <MacroItem
            label="Carbs"
            remaining={remaining.carbs}
            consumed={consumed.carbs}
            target={targets.carbs}
            colorClass="text-carbs"
            bgClass="bg-white/40"
          />
          <MacroItem
            label="Fat"
            remaining={remaining.fat}
            consumed={consumed.fat}
            target={targets.fat}
            colorClass="text-fat"
            bgClass="bg-white/40"
          />
        </div>
      </div>
    </motion.div>
  );
}
