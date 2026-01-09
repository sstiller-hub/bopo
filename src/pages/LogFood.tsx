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
  const [isScanning, setIsScanning] = useState(false);
  
  const { getRecentFoods, getFrequentFoods, getFavorites, searchFoods, findByBarcode } = useFoods();
  
  const recentFoods = getRecentFoods(20);
  const frequentFoods = getFrequentFoods(10);
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border safe-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold flex-1">Log Food</h1>
          <span className="text-sm text-muted-foreground capitalize">{meal}</span>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pb-3 gap-2">
          {tabs.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                activeTab === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="px-4 py-4">
        <AnimatePresence mode="wait">
          {/* Recent Tab */}
          {activeTab === 'recent' && (
            <motion.div
              key="recent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Favorites */}
              {favorites.length > 0 && (
                <section>
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
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
                <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
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
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No foods logged yet</p>
                    <Button onClick={handleCreateFood}>Create Your First Food</Button>
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search foods..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                  autoFocus
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

              {/* Results */}
              {searchQuery.length >= 2 ? (
                searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map(food => (
                      <FoodCard key={food.id} food={food} onClick={() => handleFoodSelect(food)} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No foods found for "{searchQuery}"</p>
                    <Button onClick={handleCreateFood}>Create New Food</Button>
                  </div>
                )
              ) : (
                <div className="text-center py-12 text-muted-foreground">
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
                    // Not found - navigate to create with barcode prefilled
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
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let codeReader: any = null;

    async function startScanning() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        codeReader = new BrowserMultiFormatReader();
        
        if (videoRef.current) {
          setIsScanning(true);
          await codeReader.decodeFromVideoDevice(
            undefined,
            videoRef.current,
            (result: any, err: any) => {
              if (result) {
                const barcode = result.getText();
                codeReader.reset();
                onScan(barcode);
              }
            }
          );
        }
      } catch (err) {
        console.error('Scanner error:', err);
        setError('Camera access denied or not available');
        setIsScanning(false);
      }
    }

    startScanning();

    return () => {
      if (codeReader) {
        codeReader.reset();
      }
    };
  }, [onScan]);

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <p className="text-muted-foreground text-sm">
          Please allow camera access to scan barcodes
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] bg-muted rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Scan overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-32 border-2 border-primary rounded-lg relative">
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
