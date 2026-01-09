import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ScanLine, Clock, Star, X, ArrowLeft } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { FoodCard } from '@/components/FoodCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFoods } from '@/hooks/useNutritionStore';
import { Food } from '@/types/nutrition';

type TabType = 'recent' | 'search' | 'scan';

export default function LogFood() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const meal = searchParams.get('meal') || 'snacks';
  
  const [activeTab, setActiveTab] = useState<TabType>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { getRecentFoods, getFrequentFoods, getFavorites, searchFoods, findByBarcode } = useFoods();
  
  const recentFoods = getRecentFoods(20);
  const favorites = getFavorites();
  const searchResults = searchQuery.length >= 2 ? searchFoods(searchQuery) : [];

  const handleFoodSelect = (food: Food) => {
    navigate(`/confirm?foodId=${food.id}&meal=${meal}`);
  };

  const handleCreateFood = () => {
    navigate('/foods/new');
  };

  const tabs = [
    { key: 'recent' as TabType, icon: Clock, label: 'Recent' },
    { key: 'search' as TabType, icon: Search, label: 'Search' },
    { key: 'scan' as TabType, icon: ScanLine, label: 'Scan' },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header - KovaFit style */}
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
              onClick={() => setActiveTab(key)}
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
                searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map(food => (
                      <FoodCard key={food.id} food={food} onClick={() => handleFoodSelect(food)} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-card rounded-2xl">
                    <p className="text-muted-foreground mb-4">No foods found for "{searchQuery}"</p>
                    <Button onClick={handleCreateFood} className="bg-gradient-primary">
                      Create New Food
                    </Button>
                  </div>
                )
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
              <BarcodeScanner 
                onScan={(barcode) => {
                  const food = findByBarcode(barcode);
                  if (food) {
                    handleFoodSelect(food);
                  } else {
                    navigate(`/foods/new?barcode=${barcode}&meal=${meal}`);
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
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
