import { Heart, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Food } from '@/types/nutrition';

interface FoodCardProps {
  food: Food;
  onClick: () => void;
  showFavorite?: boolean;
}

export function FoodCard({ food, onClick, showFavorite = true }: FoodCardProps) {
  const macros = food.nutritionBasis === 'per_100g' 
    ? food.macrosPer100g 
    : food.macrosPerServing;

  if (!macros) return null;

  const basisLabel = food.nutritionBasis === 'per_100g' 
    ? 'per 100g' 
    : `per serving (${food.servingGrams}g)`;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all text-left active:scale-[0.98]"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground truncate">{food.name}</span>
          {showFavorite && food.isFavorite && (
            <Heart className="w-3.5 h-3.5 fill-destructive text-destructive shrink-0" />
          )}
        </div>
        {food.brand && (
          <div className="text-sm text-muted-foreground truncate">{food.brand}</div>
        )}
        <div className="flex items-center gap-2 mt-1 text-xs">
          <span className="text-muted-foreground">{basisLabel}</span>
          <span className="text-muted-foreground">•</span>
          <span className="font-tabular text-calories">{macros.calories} kcal</span>
          <span className="font-tabular text-protein">{macros.protein}P</span>
          <span className="font-tabular text-carbs">{macros.carbs}C</span>
          <span className="font-tabular text-fat">{macros.fat}F</span>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
    </button>
  );
}
