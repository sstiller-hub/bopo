import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MacroBarProps {
  value: number;
  target: number;
  label: string;
  unit?: string;
  colorClass: string;
  bgColorClass: string;
  showRemaining?: boolean;
}

export function MacroBar({ 
  value, 
  target, 
  label, 
  unit = 'g',
  colorClass,
  bgColorClass,
  showRemaining = true,
}: MacroBarProps) {
  const percentage = Math.min((value / target) * 100, 100);
  const remaining = target - value;
  const isOver = remaining < 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={cn('text-sm font-semibold', colorClass)}>{label}</span>
        <div className="flex items-center gap-2 text-sm font-tabular">
          <span className="text-foreground font-medium">{Math.round(value)}</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{target}{unit}</span>
          {showRemaining && (
            <span className={cn(
              'font-semibold ml-1',
              isOver ? 'text-destructive' : 'text-success'
            )}>
              ({isOver ? '' : '+'}{Math.round(remaining)})
            </span>
          )}
        </div>
      </div>
      <div className={cn('h-2.5 rounded-full overflow-hidden', bgColorClass)}>
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
  );
}
