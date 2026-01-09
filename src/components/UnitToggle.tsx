import { cn } from '@/lib/utils';

interface UnitToggleProps {
  value: 'g' | 'oz';
  onChange: (value: 'g' | 'oz') => void;
  size?: 'sm' | 'md';
}

export function UnitToggle({ value, onChange, size = 'md' }: UnitToggleProps) {
  return (
    <div className={cn(
      'inline-flex rounded-lg bg-muted p-0.5',
      size === 'sm' && 'text-xs',
      size === 'md' && 'text-sm'
    )}>
      <button
        onClick={() => onChange('g')}
        className={cn(
          'px-3 py-1.5 rounded-md font-medium transition-all',
          value === 'g' 
            ? 'bg-card text-foreground shadow-sm' 
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        g
      </button>
      <button
        onClick={() => onChange('oz')}
        className={cn(
          'px-3 py-1.5 rounded-md font-medium transition-all',
          value === 'oz' 
            ? 'bg-card text-foreground shadow-sm' 
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        oz
      </button>
    </div>
  );
}
