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
        'rounded-xl p-2 transition-colors',
        bgClass
      )}>
        <div className={cn(
          'text-xl font-bold font-tabular leading-none',
          isOver ? 'text-destructive' : colorClass
        )}>
          {Math.round(remaining)}
          {unit !== 'kcal' && <span className="text-xs font-medium ml-0.5">{unit}</span>}
        </div>
        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
          {label}
        </div>
        {/* Mini progress bar */}
        <div className="h-1 rounded-full bg-background/50 mt-1.5 overflow-hidden">
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
      <div className="text-[10px] text-muted-foreground mt-1 font-tabular">
        {Math.round(consumed)}/{target}
      </div>
    </div>
  );
}

export function StickyMacroHeader({ consumed, targets, remaining }: StickyMacroHeaderProps) {
  return (
    <motion.div 
      className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border safe-top safe-x pb-3"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="pt-3">
        {/* Remaining label */}
        <div className="text-center mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Remaining Today
          </span>
        </div>
        
        {/* Macro grid */}
        <div className="flex gap-2 px-1">
          <MacroItem
            label="Cal"
            remaining={remaining.calories}
            consumed={consumed.calories}
            target={targets.calories}
            unit="kcal"
            colorClass="text-calories"
            bgClass="bg-calories-light"
          />
          <MacroItem
            label="Protein"
            remaining={remaining.protein}
            consumed={consumed.protein}
            target={targets.protein}
            colorClass="text-protein"
            bgClass="bg-protein-light"
          />
          <MacroItem
            label="Carbs"
            remaining={remaining.carbs}
            consumed={consumed.carbs}
            target={targets.carbs}
            colorClass="text-carbs"
            bgClass="bg-carbs-light"
          />
          <MacroItem
            label="Fat"
            remaining={remaining.fat}
            consumed={consumed.fat}
            target={targets.fat}
            colorClass="text-fat"
            bgClass="bg-fat-light"
          />
        </div>
      </div>
    </motion.div>
  );
}
