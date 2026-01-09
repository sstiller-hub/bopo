import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, ArrowLeft, Trash2, Edit2, X } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { FoodCard } from '@/components/FoodCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFoods } from '@/hooks/useNutritionStore';
import { Food } from '@/types/nutrition';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function FoodLibrary() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteFood, setDeleteFood] = useState<Food | null>(null);
  
  const { foods, deleteFood: removeFoodFromLibrary, searchFoods } = useFoods();
  
  const displayedFoods = searchQuery.length >= 2 
    ? searchFoods(searchQuery)
    : [...foods].sort((a, b) => a.name.localeCompare(b.name));

  const handleFoodClick = (food: Food) => {
    navigate(`/foods/edit/${food.id}`);
  };

  const handleDeleteConfirm = () => {
    if (deleteFood) {
      removeFoodFromLibrary(deleteFood.id);
      setDeleteFood(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border safe-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <h1 className="text-lg font-semibold flex-1">Food Library</h1>
          <Button 
            size="sm"
            onClick={() => navigate('/foods/new')}
          >
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search your foods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="px-4 py-4">
        {displayedFoods.length > 0 ? (
          <div className="space-y-2">
            {displayedFoods.map((food, index) => (
              <motion.div
                key={food.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <FoodCard
                  food={food}
                  onClick={() => handleFoodClick(food)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchQuery ? `No foods found for "${searchQuery}"` : 'No foods in your library yet'}
            </p>
            <Button onClick={() => navigate('/foods/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Food
            </Button>
          </div>
        )}
      </main>

      <BottomNav />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteFood} onOpenChange={() => setDeleteFood(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Food?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteFood?.name}" from your library.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
