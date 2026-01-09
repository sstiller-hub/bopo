import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFoods } from '@/hooks/useNutritionStore';
import { Food, Macros } from '@/types/nutrition';
import { cn } from '@/lib/utils';
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

type NutritionBasis = 'per_100g' | 'per_serving';

export default function FoodEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: editId } = useParams();
  const prefillBarcode = searchParams.get('barcode');
  const meal = searchParams.get('meal');
  
  const { foods, addFood, updateFood, deleteFood } = useFoods();
  const existingFood = editId ? foods.find(f => f.id === editId) : null;
  
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [barcode, setBarcode] = useState('');
  const [nutritionBasis, setNutritionBasis] = useState<NutritionBasis>('per_100g');
  const [servingGrams, setServingGrams] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize from existing food or prefill
  useEffect(() => {
    if (existingFood) {
      setName(existingFood.name);
      setBrand(existingFood.brand || '');
      setBarcode(existingFood.barcode || '');
      setNutritionBasis(existingFood.nutritionBasis);
      
      const macros = existingFood.nutritionBasis === 'per_100g' 
        ? existingFood.macrosPer100g 
        : existingFood.macrosPerServing;
      
      if (macros) {
        setCalories(macros.calories.toString());
        setProtein(macros.protein.toString());
        setCarbs(macros.carbs.toString());
        setFat(macros.fat.toString());
      }
      
      if (existingFood.servingGrams) {
        setServingGrams(existingFood.servingGrams.toString());
      }
    } else if (prefillBarcode) {
      setBarcode(prefillBarcode);
    }
  }, [existingFood, prefillBarcode]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!calories || parseFloat(calories) < 0) {
      newErrors.calories = 'Valid calories required';
    }
    if (!protein || parseFloat(protein) < 0) {
      newErrors.protein = 'Valid protein required';
    }
    if (!carbs || parseFloat(carbs) < 0) {
      newErrors.carbs = 'Valid carbs required';
    }
    if (!fat || parseFloat(fat) < 0) {
      newErrors.fat = 'Valid fat required';
    }
    if (nutritionBasis === 'per_serving' && (!servingGrams || parseFloat(servingGrams) <= 0)) {
      newErrors.servingGrams = 'Serving size required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const macros: Macros = {
      calories: parseFloat(calories),
      protein: parseFloat(protein),
      carbs: parseFloat(carbs),
      fat: parseFloat(fat),
    };

    const foodData = {
      name: name.trim(),
      brand: brand.trim() || undefined,
      barcode: barcode.trim() || undefined,
      nutritionBasis,
      ...(nutritionBasis === 'per_100g' 
        ? { macrosPer100g: macros }
        : { 
            macrosPerServing: macros, 
            servingGrams: parseFloat(servingGrams) 
          }
      ),
    };

    if (existingFood) {
      updateFood(existingFood.id, foodData);
    } else {
      const newFood = addFood(foodData);
      // If we came from barcode scan, navigate to confirm entry
      if (prefillBarcode && meal) {
        navigate(`/confirm?foodId=${newFood.id}&meal=${meal}`);
        return;
      }
    }

    navigate('/foods');
  };

  const handleDelete = () => {
    if (existingFood) {
      deleteFood(existingFood.id);
      navigate('/foods');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border safe-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold flex-1">
            {existingFood ? 'Edit Food' : 'Create Food'}
          </h1>
          {existingFood && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="w-5 h-5 text-destructive" />
            </Button>
          )}
        </div>
      </div>

      <main className="px-4 py-6 space-y-6 pb-32">
        {/* Basic info */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Basic Info
          </h2>
          
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Chicken Breast"
              className={cn(errors.name && 'border-destructive')}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">Brand (optional)</Label>
            <Input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g., Tyson"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode (optional)</Label>
            <Input
              id="barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan or enter barcode"
            />
          </div>
        </section>

        {/* Nutrition basis */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Nutrition Basis
          </h2>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setNutritionBasis('per_100g')}
              className={cn(
                'p-4 rounded-xl border-2 text-center transition-colors',
                nutritionBasis === 'per_100g'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="font-semibold">Per 100g</div>
              <div className="text-sm text-muted-foreground">Recommended</div>
            </button>
            <button
              onClick={() => setNutritionBasis('per_serving')}
              className={cn(
                'p-4 rounded-xl border-2 text-center transition-colors',
                nutritionBasis === 'per_serving'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="font-semibold">Per Serving</div>
              <div className="text-sm text-muted-foreground">Custom size</div>
            </button>
          </div>

          {nutritionBasis === 'per_serving' && (
            <div className="space-y-2">
              <Label htmlFor="serving">Serving Size (grams) *</Label>
              <Input
                id="serving"
                type="number"
                inputMode="decimal"
                value={servingGrams}
                onChange={(e) => setServingGrams(e.target.value)}
                placeholder="e.g., 85"
                className={cn(errors.servingGrams && 'border-destructive')}
              />
              {errors.servingGrams && <p className="text-sm text-destructive">{errors.servingGrams}</p>}
            </div>
          )}
        </section>

        {/* Macros */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Nutrition {nutritionBasis === 'per_100g' ? 'per 100g' : 'per serving'}
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calories" className="text-calories font-medium">Calories *</Label>
              <Input
                id="calories"
                type="number"
                inputMode="decimal"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="0"
                className={cn('text-lg font-bold', errors.calories && 'border-destructive')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein" className="text-protein font-medium">Protein (g) *</Label>
              <Input
                id="protein"
                type="number"
                inputMode="decimal"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="0"
                className={cn('text-lg font-bold', errors.protein && 'border-destructive')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs" className="text-carbs font-medium">Carbs (g) *</Label>
              <Input
                id="carbs"
                type="number"
                inputMode="decimal"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="0"
                className={cn('text-lg font-bold', errors.carbs && 'border-destructive')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat" className="text-fat font-medium">Fat (g) *</Label>
              <Input
                id="fat"
                type="number"
                inputMode="decimal"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="0"
                className={cn('text-lg font-bold', errors.fat && 'border-destructive')}
              />
            </div>
          </div>
        </section>
      </main>

      {/* Fixed save button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border safe-bottom">
        <Button
          onClick={handleSave}
          size="lg"
          className="w-full h-14 text-lg font-semibold"
        >
          <Save className="w-5 h-5 mr-2" />
          {existingFood ? 'Update Food' : 'Save Food'}
        </Button>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Food?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{existingFood?.name}" from your library.
              Existing log entries will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
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
