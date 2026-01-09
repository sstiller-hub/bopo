import { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Trash2, Copy, Edit2 } from 'lucide-react';
import { Entry, gramsToOunces } from '@/types/nutrition';

interface SwipeableEntryProps {
  entry: Entry;
  preferredUnit: 'g' | 'oz';
  onEdit: (entry: Entry) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function SwipeableEntry({
  entry,
  preferredUnit,
  onEdit,
  onDelete,
  onDuplicate,
}: SwipeableEntryProps) {
  const constraintsRef = useRef(null);
  const x = useMotionValue(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const actionsWidth = 120; // Width of the actions panel

  const formatAmount = (grams: number) => {
    if (preferredUnit === 'oz') {
      return `${gramsToOunces(grams).toFixed(1)} oz`;
    }
    return `${Math.round(grams)}g`;
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = -60;
    if (info.offset.x < threshold) {
      setIsRevealed(true);
    } else {
      setIsRevealed(false);
    }
  };

  const handleTap = () => {
    if (isRevealed) {
      setIsRevealed(false);
    }
  };

  return (
    <div className="relative overflow-hidden" ref={constraintsRef}>
      {/* Actions behind */}
      <div className="absolute right-0 top-0 bottom-0 flex items-stretch">
        <button
          onClick={() => {
            onEdit(entry);
            setIsRevealed(false);
          }}
          className="w-10 bg-primary flex items-center justify-center text-primary-foreground"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            onDuplicate(entry.id);
            setIsRevealed(false);
          }}
          className="w-10 bg-muted flex items-center justify-center text-foreground"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            onDelete(entry.id);
          }}
          className="w-10 bg-destructive flex items-center justify-center text-destructive-foreground"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Swipeable content */}
      <motion.div
        className="relative bg-card cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: -actionsWidth, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={{ x: isRevealed ? -actionsWidth : 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onTap={handleTap}
        style={{ x }}
      >
        <div className="flex items-center justify-between p-4">
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
        </div>
      </motion.div>
    </div>
  );
}
