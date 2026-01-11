import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFoods } from '@/hooks/useNutritionStore';
import { Macros, ouncesToGrams } from '@/types/nutrition';
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

// Parse serving size input like "85", "85g", "3oz", "3 oz", "200 grams"
function parseServingSize(input: string): { grams: number | null; display: string } {
  if (!input.trim()) return { grams: null, display: '' };
  
  const trimmed = input.trim().toLowerCase();
  
  // Match patterns: "3oz", "3 oz", "3 ounces", "3 ounce"
  const ozMatch = trimmed.match(/^([\d.]+)\s*(oz|ounces?)?$/);
  if (ozMatch && (trimmed.includes('oz') || trimmed.includes('ounce'))) {
    const value = parseFloat(ozMatch[1]);
    if (!isNaN(value)) {
      const grams = Math.round(ouncesToGrams(value));
      return { grams, display: `${value} oz = ${grams}g` };
    }
  }
  
  // Match patterns: "85g", "85 g", "85 grams", "85 gram"
  const gMatch = trimmed.match(/^([\d.]+)\s*(g|grams?)?$/);
  if (gMatch) {
    const value = parseFloat(gMatch[1]);
    if (!isNaN(value)) {
      return { grams: Math.round(value), display: `${Math.round(value)}g` };
    }
  }
  
  // No valid pattern found
  return { grams: null, display: '' };
}

export default function FoodEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: editId } = useParams();
  const prefillBarcode = searchParams.get('barcode');
  const prefillName = searchParams.get('name');
  const prefillBrand = searchParams.get('brand');
  const prefillCalories = searchParams.get('calories');
  const prefillProtein = searchParams.get('protein');
  const prefillCarbs = searchParams.get('carbs');
  const prefillFat = searchParams.get('fat');
  const meal = searchParams.get('meal');
  
  const { foods, addFood, updateFood, deleteFood } = useFoods();
  const existingFood = editId ? foods.find(f => f.id === editId) : null;
  
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [barcode, setBarcode] = useState('');
  const [nutritionBasis, setNutritionBasis] = useState<NutritionBasis>('per_serving');
  const [servingInput, setServingInput] = useState('');
  const [servingLabel, setServingLabel] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Parse the serving input
  const parsedServing = useMemo(() => parseServingSize(servingInput), [servingInput]);

  // Check if we have prefill data from URL params
  const hasPrefillData = prefillName || prefillCalories || prefillProtein || prefillCarbs || prefillFat;

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
        setServingInput(existingFood.servingGrams.toString() + 'g');
      }
      setServingLabel(existingFood.servingLabel || '');
    } else if (hasPrefillData) {
      // Pre-fill from URL params (from scanned/searched product)
      if (prefillName) setName(prefillName);
      if (prefillBrand) setBrand(prefillBrand);
      if (prefillBarcode) setBarcode(prefillBarcode);
      if (prefillCalories) setCalories(prefillCalories);
      if (prefillProtein) setProtein(prefillProtein);
      if (prefillCarbs) setCarbs(prefillCarbs);
      if (prefillFat) setFat(prefillFat);
    } else if (prefillBarcode) {
      setBarcode(prefillBarcode);
    }
  }, [existingFood, hasPrefillData, prefillBarcode, prefillName, prefillBrand, prefillCalories, prefillProtein, prefillCarbs, prefillFat]);

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
    if (nutritionBasis === 'per_serving' && (!parsedServing.grams || parsedServing.grams <= 0)) {
      newErrors.servingInput = 'Valid serving size required (e.g., 85g or 3oz)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
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
            servingGrams: parsedServing.grams || 0,
            servingLabel: servingLabel.trim() || undefined,
          }
      ),
    };

    if (existingFood) {
      await updateFood(existingFood.id, foodData);
    } else {
      const newFood = await addFood(foodData);
      // If we came from barcode scan, navigate to confirm entry
      if (prefillBarcode && meal && newFood) {
        navigate(`/confirm?foodId=${newFood.id}&meal=${meal}`);
        return;
      }
    }

    navigate('/foods');
  };

  const handleDelete = async () => {
    if (existingFood) {
      await deleteFood(existingFood.id);
      navigate('/foods');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - KovaFit style */}
      <div className="px-5 pt-12 pb-4 safe-top">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              // If we have navigation history, go back; otherwise go to foods or log
              if (window.history.length > 2) {
                navigate(-1);
              } else {
                navigate(meal ? `/log?meal=${meal}` : '/foods');
              }
            }}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">
              {existingFood ? 'Edit Food' : 'Create Food'}
            </h1>
          </div>
          {existingFood && (
            <button 
              onClick={() => setShowDelete(true)}
              className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm"
            >
              <Trash2 className="w-5 h-5 text-destructive" />
            </button>
          )}
        </div>
      </div>

      <main className="px-4 pb-32 space-y-4">
        {/* Basic info */}
        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-4">
          <h2 className="font-semibold text-foreground">Basic Info</h2>
          
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm text-muted-foreground">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Chicken Breast"
              className={cn('bg-background border-0 rounded-xl', errors.name && 'ring-2 ring-destructive')}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand" className="text-sm text-muted-foreground">Brand (optional)</Label>
            <Input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g., Tyson"
              className="bg-background border-0 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcode" className="text-sm text-muted-foreground">Barcode (optional)</Label>
            <Input
              id="barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan or enter barcode"
              className="bg-background border-0 rounded-xl"
            />
          </div>
        </div>

        {/* Nutrition basis */}
        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-4">
          <h2 className="font-semibold text-foreground">Nutrition Basis</h2>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setNutritionBasis('per_100g')}
              className={cn(
                'p-4 rounded-xl text-center transition-all',
                nutritionBasis === 'per_100g'
                  ? 'bg-gradient-primary text-white'
                  : 'bg-muted text-foreground'
              )}
            >
              <div className="font-semibold">Per 100g</div>
              <div className="text-xs opacity-80">Recommended</div>
            </button>
            <button
              onClick={() => setNutritionBasis('per_serving')}
              className={cn(
                'p-4 rounded-xl text-center transition-all',
                nutritionBasis === 'per_serving'
                  ? 'bg-gradient-primary text-white'
                  : 'bg-muted text-foreground'
              )}
            >
              <div className="font-semibold">Per Serving</div>
              <div className="text-xs opacity-80">Custom size</div>
            </button>
          </div>

          {nutritionBasis === 'per_serving' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="serving" className="text-sm text-muted-foreground">Serving Size *</Label>
                {parsedServing.display && (
                  <span className="text-xs text-primary font-medium">{parsedServing.display}</span>
                )}
              </div>
              <Input
                id="serving"
                type="text"
                value={servingInput}
                onChange={(e) => setServingInput(e.target.value)}
                placeholder="e.g., 85g, 3oz, 200"
                className={cn('bg-background border-0 rounded-xl', errors.servingInput && 'ring-2 ring-destructive')}
              />
              <p className="text-xs text-muted-foreground">
                Enter a number (defaults to grams) or include a unit like "3oz" or "100g"
              </p>
              <div className="space-y-2 pt-2">
                <Label htmlFor="servingLabel" className="text-sm text-muted-foreground">Serving Label (optional)</Label>
                <Input
                  id="servingLabel"
                  type="text"
                  value={servingLabel}
                  onChange={(e) => setServingLabel(e.target.value)}
                  placeholder="e.g., package, 4 waffles"
                  className="bg-background border-0 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  This shows as "1 serving = 4 waffles"
                </p>
              </div>
              {errors.servingInput && <p className="text-sm text-destructive">{errors.servingInput}</p>}
            </div>
          )}
        </div>

        {/* Macros */}
        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-4">
          <h2 className="font-semibold text-foreground">
            Nutrition {nutritionBasis === 'per_100g' ? 'per 100g' : 'per serving'}
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="calories" className="text-calories text-sm font-medium">Calories *</Label>
              <Input
                id="calories"
                type="number"
                inputMode="decimal"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="0"
                className={cn('text-lg font-bold bg-background border-0 rounded-xl', errors.calories && 'ring-2 ring-destructive')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein" className="text-protein text-sm font-medium">Protein (g) *</Label>
              <Input
                id="protein"
                type="number"
                inputMode="decimal"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="0"
                className={cn('text-lg font-bold bg-background border-0 rounded-xl', errors.protein && 'ring-2 ring-destructive')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs" className="text-carbs text-sm font-medium">Carbs (g) *</Label>
              <Input
                id="carbs"
                type="number"
                inputMode="decimal"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="0"
                className={cn('text-lg font-bold bg-background border-0 rounded-xl', errors.carbs && 'ring-2 ring-destructive')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat" className="text-fat text-sm font-medium">Fat (g) *</Label>
              <Input
                id="fat"
                type="number"
                inputMode="decimal"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="0"
                className={cn('text-lg font-bold bg-background border-0 rounded-xl', errors.fat && 'ring-2 ring-destructive')}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Fixed save button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md safe-bottom">
        <Button
          onClick={handleSave}
          size="lg"
          className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 rounded-2xl"
        >
          <Save className="w-5 h-5 mr-2" />
          {existingFood ? 'Update Food' : 'Save Food'}
        </Button>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Food?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{existingFood?.name}" from your library.
              Existing log entries will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
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
