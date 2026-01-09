import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MacroRingProps {
  value: number;
  target: number;
  remaining: number;
  label: string;
  unit?: string;
  colorClass: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MacroRing({ 
  value, 
  target, 
  remaining, 
  label, 
  unit = 'g',
  colorClass,
  size = 'md' 
}: MacroRingProps) {
  const percentage = Math.min((value / target) * 100, 100);
  const isOver = remaining < 0;
  
  const sizes = {
    sm: { ring: 56, stroke: 4, text: 'text-sm' },
    md: { ring: 72, stroke: 5, text: 'text-base' },
    lg: { ring: 88, stroke: 6, text: 'text-lg' },
  };
  
  const { ring, stroke, text } = sizes[size];
  const radius = (ring - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: ring, height: ring }}>
        <svg 
          className="transform -rotate-90" 
          width={ring} 
          height={ring}
        >
          {/* Background ring */}
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-muted/50"
          />
          {/* Progress ring */}
          <motion.circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            className={cn(colorClass, isOver && 'text-destructive')}
            stroke="currentColor"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            'font-bold font-tabular leading-none',
            text,
            isOver && 'text-destructive'
          )}>
            {Math.round(remaining)}
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}
