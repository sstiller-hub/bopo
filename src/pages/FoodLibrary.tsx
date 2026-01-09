import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, X } from 'lucide-react';
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
    <div className="min-h-screen bg-background pb-28">
      {/* Header - KovaFit style */}
      <div className="px-5 pt-12 pb-4 safe-top">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Foods</h1>
          <Button 
            size="sm"
            onClick={() => navigate('/foods/new')}
            className="bg-gradient-primary hover:opacity-90 rounded-full h-10 px-4"
          >
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search your foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-card rounded-2xl border-0 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <main className="px-4">
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
          <div className="text-center py-12 bg-card rounded-2xl">
            <p className="text-muted-foreground mb-4">
              {searchQuery ? `No foods found for "${searchQuery}"` : 'No foods in your library yet'}
            </p>
            <Button onClick={() => navigate('/foods/new')} className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Food
            </Button>
          </div>
        )}
      </main>

      <BottomNav />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteFood} onOpenChange={() => setDeleteFood(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Food?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteFood?.name}" from your library.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
