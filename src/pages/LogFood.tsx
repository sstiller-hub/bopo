import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ScanLine, Clock, Star, X, ArrowLeft, Loader2, Check } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { FoodCard } from '@/components/FoodCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFoods } from '@/hooks/useNutritionStore';
import { Food } from '@/types/nutrition';
import { fetchProductByBarcode, searchProducts, convertToFoodData, OpenFoodFactsProduct } from '@/lib/openFoodFacts';
import { toast } from 'sonner';

type TabType = 'recent' | 'search' | 'scan';

export default function LogFood() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const meal = searchParams.get('meal') || 'snacks';
  
  const [activeTab, setActiveTab] = useState<TabType>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [scannedProduct, setScannedProduct] = useState<OpenFoodFactsProduct | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [apiSearchResults, setApiSearchResults] = useState<OpenFoodFactsProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { getRecentFoods, getFavorites, searchFoods, findByBarcode, addFood } = useFoods();
  
  const recentFoods = getRecentFoods(20);
  const favorites = getFavorites();
  const localSearchResults = searchQuery.length >= 2 ? searchFoods(searchQuery) : [];

  // Debounced API search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setApiSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      const result = await searchProducts(searchQuery, 15);
      setIsSearching(false);
      if (result.success) {
        setApiSearchResults(result.products);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleApiProductSelect = (product: OpenFoodFactsProduct) => {
    setScannedProduct(product);
    setActiveTab('scan'); // Reuse the scan tab's preview UI
  };

  const handleFoodSelect = (food: Food) => {
    navigate(`/confirm?foodId=${food.id}&meal=${meal}`);
  };

  const handleCreateFood = () => {
    navigate('/foods/new');
  };

  const handleBarcodeScan = async (barcode: string) => {
    // First check if we already have this food saved
    const existingFood = findByBarcode(barcode);
    if (existingFood) {
      handleFoodSelect(existingFood);
      return;
    }

    // Look up in Open Food Facts
    setIsLookingUp(true);
    const result = await fetchProductByBarcode(barcode);
    setIsLookingUp(false);

    if (result.success && result.product) {
      setScannedProduct(result.product);
    } else {
      toast.error(result.error || 'Product not found');
      navigate(`/foods/new?barcode=${barcode}&meal=${meal}`);
    }
  };

  const handleSaveScannedProduct = async () => {
    if (!scannedProduct) return;

    const foodData = convertToFoodData(scannedProduct);
    const newFood = await addFood({
      name: foodData.name,
      brand: foodData.brand,
      barcode: foodData.barcode,
      nutritionBasis: foodData.nutritionBasis,
      macrosPer100g: foodData.macrosPer100g,
      servingGrams: foodData.servingGrams,
      isFavorite: false,
    });

    if (newFood) {
      toast.success('Food saved to library');
      handleFoodSelect(newFood);
    } else {
      toast.error('Failed to save food');
    }
  };

  const handleEditScannedProduct = () => {
    if (!scannedProduct) return;
    const foodData = convertToFoodData(scannedProduct);
    // Navigate to food editor with pre-filled data
    const params = new URLSearchParams({
      barcode: foodData.barcode || '',
      name: foodData.name,
      brand: foodData.brand || '',
      calories: String(foodData.macrosPer100g?.calories || 0),
      protein: String(foodData.macrosPer100g?.protein || 0),
      carbs: String(foodData.macrosPer100g?.carbs || 0),
      fat: String(foodData.macrosPer100g?.fat || 0),
      meal,
    });
    navigate(`/foods/new?${params.toString()}`);
  };

  const tabs = [
    { key: 'recent' as TabType, icon: Clock, label: 'Recent' },
    { key: 'search' as TabType, icon: Search, label: 'Search' },
    { key: 'scan' as TabType, icon: ScanLine, label: 'Scan' },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 safe-top">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Log Food</h1>
            <p className="text-sm text-muted-foreground capitalize">{meal}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 p-1 bg-card rounded-2xl shadow-sm">
          {tabs.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
                setScannedProduct(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
                activeTab === key
                  ? 'bg-gradient-primary text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="px-4">
        <AnimatePresence mode="wait">
          {/* Recent Tab */}
          {activeTab === 'recent' && (
            <motion.div
              key="recent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-5"
            >
              {/* Favorites */}
              {favorites.length > 0 && (
                <section>
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3 px-1">
                    <Star className="w-4 h-4" />
                    Favorites
                  </h2>
                  <div className="space-y-2">
                    {favorites.slice(0, 5).map(food => (
                      <FoodCard key={food.id} food={food} onClick={() => handleFoodSelect(food)} />
                    ))}
                  </div>
                </section>
              )}

              {/* Recent */}
              <section>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3 px-1">
                  <Clock className="w-4 h-4" />
                  Recent
                </h2>
                {recentFoods.length > 0 ? (
                  <div className="space-y-2">
                    {recentFoods.map(food => (
                      <FoodCard key={food.id} food={food} onClick={() => handleFoodSelect(food)} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-card rounded-2xl">
                    <p className="text-muted-foreground mb-4">No foods logged yet</p>
                    <Button onClick={handleCreateFood} className="bg-gradient-primary">
                      Create Your First Food
                    </Button>
                  </div>
                )}
              </section>
            </motion.div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search foods..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-card rounded-2xl border-0 shadow-sm"
                  autoFocus
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

              {/* Results */}
              {searchQuery.length >= 2 ? (
                <div className="space-y-4">
                  {/* Local library results */}
                  {localSearchResults.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                        Your Library
                      </h3>
                      <div className="space-y-2">
                        {localSearchResults.map(food => (
                          <FoodCard key={food.id} food={food} onClick={() => handleFoodSelect(food)} />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* API search results */}
                  <section>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                      Open Food Facts
                    </h3>
                    {isSearching ? (
                      <div className="flex items-center justify-center py-8 bg-card rounded-2xl">
                        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                        <span className="text-muted-foreground text-sm">Searching...</span>
                      </div>
                    ) : apiSearchResults.length > 0 ? (
                      <div className="space-y-2">
                        {apiSearchResults.map(product => (
                          <ApiProductCard 
                            key={product.code} 
                            product={product} 
                            onClick={() => handleApiProductSelect(product)} 
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-card rounded-2xl text-sm text-muted-foreground">
                        No online results found
                      </div>
                    )}
                  </section>

                  {/* Create new option */}
                  <div className="pt-2">
                    <Button onClick={handleCreateFood} variant="outline" className="w-full">
                      Create New Food
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl">
                  Type at least 2 characters to search
                </div>
              )}
            </motion.div>
          )}

          {/* Scan Tab */}
          {activeTab === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {isLookingUp ? (
                <div className="text-center py-12 bg-card rounded-2xl">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Looking up product...</p>
                </div>
              ) : scannedProduct ? (
                <ScannedProductPreview
                  product={scannedProduct}
                  onConfirm={handleSaveScannedProduct}
                  onEdit={handleEditScannedProduct}
                  onCancel={() => setScannedProduct(null)}
                />
              ) : (
                <BarcodeScanner onScan={handleBarcodeScan} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}

function ScannedProductPreview({
  product,
  onConfirm,
  onEdit,
  onCancel,
}: {
  product: OpenFoodFactsProduct;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
}) {
  const nutriments = product.nutriments || {};
  const hasServingData = nutriments['energy-kcal_serving'] !== undefined;
  
  // Use serving data if available, otherwise fall back to per 100g
  const displayMacros = hasServingData ? {
    calories: Math.round(nutriments['energy-kcal_serving'] || 0),
    protein: Math.round(nutriments.proteins_serving || 0),
    carbs: Math.round(nutriments.carbohydrates_serving || 0),
    fat: Math.round(nutriments.fat_serving || 0),
  } : {
    calories: Math.round(nutriments['energy-kcal_100g'] || 0),
    protein: Math.round(nutriments.proteins_100g || 0),
    carbs: Math.round(nutriments.carbohydrates_100g || 0),
    fat: Math.round(nutriments.fat_100g || 0),
  };
  
  const displayLabel = hasServingData ? 'Per Serving' : 'Per 100g';

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-start gap-4">
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.product_name}
            className="w-20 h-20 rounded-xl object-cover bg-muted"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground dark:text-white/95 truncate">
            {product.product_name || 'Unknown Product'}
          </h3>
          {product.brands && (
            <p className="text-sm text-muted-foreground dark:text-white/50 truncate">
              {product.brands}
            </p>
          )}
          <p className="text-xs text-muted-foreground dark:text-white/40 mt-1">
            Barcode: {product.code}
          </p>
        </div>
      </div>

      {/* Nutrition display */}
      <div className="bg-black/10 dark:bg-black/20 rounded-2xl p-4">
        <p className="text-xs text-muted-foreground dark:text-white/40 uppercase tracking-wider mb-3">
          {displayLabel}
        </p>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-calories font-tabular">
              {displayMacros.calories}
            </div>
            <div className="text-[10px] text-muted-foreground dark:text-white/50 uppercase">Cal</div>
          </div>
          <div>
            <div className="text-lg font-bold text-protein font-tabular">
              {displayMacros.protein}g
            </div>
            <div className="text-[10px] text-muted-foreground dark:text-white/50 uppercase">Protein</div>
          </div>
          <div>
            <div className="text-lg font-bold text-carbs font-tabular">
              {displayMacros.carbs}g
            </div>
            <div className="text-[10px] text-muted-foreground dark:text-white/50 uppercase">Carbs</div>
          </div>
          <div>
            <div className="text-lg font-bold text-fat font-tabular">
              {displayMacros.fat}g
            </div>
            <div className="text-[10px] text-muted-foreground dark:text-white/50 uppercase">Fat</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Scan Again
        </Button>
        <Button
          variant="outline"
          onClick={onEdit}
          className="flex-1"
        >
          Edit
        </Button>
        <Button
          onClick={onConfirm}
          className="flex-1 bg-gradient-primary"
        >
          <Check className="w-4 h-4 mr-1" />
          Save
        </Button>
      </div>
    </div>
  );
}

function BarcodeScanner({ onScan }: { onScan: (barcode: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function startScanning() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const codeReader = new BrowserMultiFormatReader();
        
        if (videoRef.current && isMounted) {
          controlsRef.current = await codeReader.decodeFromVideoDevice(
            undefined,
            videoRef.current,
            (result, err) => {
              if (result && !hasScannedRef.current) {
                hasScannedRef.current = true;
                const barcode = result.getText();
                // Stop the scanner
                if (controlsRef.current) {
                  controlsRef.current.stop();
                }
                onScan(barcode);
              }
            }
          );
        }
      } catch (err) {
        console.error('Scanner error:', err);
        if (isMounted) {
          setError('Camera access denied or not available');
        }
      }
    }

    startScanning();

    return () => {
      isMounted = false;
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, [onScan]);

  if (error) {
    return (
      <div className="text-center py-12 bg-card rounded-2xl">
        <p className="text-destructive mb-4">{error}</p>
        <p className="text-muted-foreground text-sm">
          Please allow camera access to scan barcodes
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] bg-card rounded-2xl overflow-hidden shadow-sm">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Scan overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-32 border-2 border-primary rounded-xl relative">
            <div className="absolute -top-1 left-4 right-4 h-0.5 bg-primary animate-pulse" />
          </div>
        </div>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Point your camera at a barcode
      </p>
    </div>
  );
}

function ApiProductCard({ 
  product, 
  onClick 
}: { 
  product: OpenFoodFactsProduct; 
  onClick: () => void;
}) {
  const nutriments = product.nutriments || {};
  const hasServingData = nutriments['energy-kcal_serving'] !== undefined;
  
  const displayCalories = hasServingData 
    ? Math.round(nutriments['energy-kcal_serving'] || 0)
    : Math.round(nutriments['energy-kcal_100g'] || 0);
  
  const displayLabel = hasServingData ? 'per serving' : 'per 100g';

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3">
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.product_name}
            className="w-12 h-12 rounded-xl object-cover bg-muted flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">
            {product.product_name || 'Unknown'}
          </h4>
          {product.brands && (
            <p className="text-xs text-muted-foreground truncate">{product.brands}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-semibold text-calories">{displayCalories} kcal</div>
          <div className="text-[10px] text-muted-foreground">{displayLabel}</div>
        </div>
      </div>
    </button>
  );
}