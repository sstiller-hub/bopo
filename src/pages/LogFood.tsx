import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ScanLine, Clock, Star, X, ArrowLeft, Loader2, Check, Sparkles, Mic, MicOff, ChevronDown, ChevronUp } from 'lucide-react';
import type { IScannerControls } from '@zxing/browser';
import { format } from 'date-fns';
import { BottomNav } from '@/components/BottomNav';
import { FoodCard } from '@/components/FoodCard';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useFoods, useSettings, useEntries } from '@/hooks/useNutritionStore';
import { Food, MealType } from '@/types/nutrition';
import { fetchProductByBarcode, searchProducts, convertToFoodData, OpenFoodFactsProduct } from '@/lib/openFoodFacts';
import { defaultMealLabels, getDefaultMeal, isMealType, setStoredMeal } from '@/lib/meals';
import { parseFoodLog, ParsedFoodItem } from '@/lib/parseFoodLog';
import { toast } from 'sonner';

type TabType = 'recent' | 'search' | 'scan';
type Step = 'input' | 'review';

const SEARCH_STOP_WORDS = new Set([
  'fruit',
  'fresh',
  'raw',
  'whole',
  'organic',
  'plain',
  'food',
]);

function normalizeSearchQuery(query: string) {
  const tokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter(token => !SEARCH_STOP_WORDS.has(token));
  return tokens.join(' ');
}

function scoreApiProduct(product: OpenFoodFactsProduct, query: string) {
  const queryLower = query.toLowerCase().trim();
  if (!queryLower) return 0;

  const name = (product.product_name || '').toLowerCase();
  const brand = (product.brands || '').toLowerCase();
  const nameTokens = name.split(/[^a-z0-9]+/).filter(Boolean);
  const queryTokens = queryLower.split(/\s+/).filter(Boolean);

  let score = 0;

  if (name === queryLower) score += 120;
  if (name.startsWith(queryLower)) score += 60;
  if (name.includes(queryLower)) score += 30;
  if (!brand) score += 20;
  if (queryTokens.length === 1 && nameTokens.length <= 2) score += 20;

  const packagedTokens = [
    'bar', 'bars', 'juice', 'drink', 'snack', 'sauce', 'jam', 'spread',
    'flavor', 'flavoured', 'flavored', 'cookie', 'candy', 'chips',
  ];
  if (packagedTokens.some(token => nameTokens.includes(token))) {
    score -= 20;
  }

  return score;
}

export default function LogFood() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mealParam = searchParams.get('meal');
  const meal: MealType = isMealType(mealParam) ? mealParam : getDefaultMeal();

  // NL / review state
  const [step, setStep] = useState<Step>('input');
  const [nlText, setNlText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedFoodItem[]>([]);
  const [showManual, setShowManual] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Manual search state
  const [activeTab, setActiveTab] = useState<TabType>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [scannedProduct, setScannedProduct] = useState<OpenFoodFactsProduct | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [apiSearchResults, setApiSearchResults] = useState<OpenFoodFactsProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const { getRecentFoods, getFavorites, searchFoods, findByBarcode, addFood } = useFoods();
  const { settings } = useSettings();
  const { addEntry } = useEntries();

  const normalizedSearchQuery = useMemo(() => normalizeSearchQuery(searchQuery), [searchQuery]);
  const searchTerm = normalizedSearchQuery || searchQuery.trim();
  const recentFoods = getRecentFoods(20);
  const favorites = getFavorites();
  const localSearchResults = searchTerm.length >= 2 ? searchFoods(searchTerm) : [];
  const rankedApiResults = useMemo(() => {
    if (!searchTerm) return apiSearchResults;
    return [...apiSearchResults].sort((a, b) => scoreApiProduct(b, searchTerm) - scoreApiProduct(a, searchTerm));
  }, [apiSearchResults, searchTerm]);
  const mealLabels = {
    breakfast: settings.mealNames?.breakfast ?? defaultMealLabels.breakfast,
    lunch: settings.mealNames?.lunch ?? defaultMealLabels.lunch,
    dinner: settings.mealNames?.dinner ?? defaultMealLabels.dinner,
    snacks: settings.mealNames?.snacks ?? defaultMealLabels.snacks,
  };
  const mealOptions: { key: MealType; label: string }[] = [
    { key: 'breakfast', label: mealLabels.breakfast },
    { key: 'lunch', label: mealLabels.lunch },
    { key: 'dinner', label: mealLabels.dinner },
    { key: 'snacks', label: mealLabels.snacks },
  ];

  const hasSpeechRecognition = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!mealParam || mealParam !== meal) {
      setSearchParams({ meal }, { replace: true });
    }
    setStoredMeal(meal);
  }, [meal, mealParam, setSearchParams]);

  // Debounced API search
  useEffect(() => {
    if (searchTerm.length < 2) {
      setApiSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      const result = await searchProducts(searchTerm, 40);
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
  }, [searchQuery, searchTerm]);

  // NL handlers
  const handleParseNLInput = async () => {
    if (!nlText.trim()) return;
    setIsParsing(true);
    try {
      const items = await parseFoodLog(nlText);
      setParsedItems(items);
      setStep('review');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to parse food');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmParsed = async () => {
    setIsAdding(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    try {
      for (const item of parsedItems) {
        await addEntry({
          date: today,
          meal,
          foodName: item.name,
          amountGrams: item.amountGrams,
          computedMacros: item.macros,
        });
      }
      toast.success(`Added ${parsedItems.length} item${parsedItems.length !== 1 ? 's' : ''} to ${mealLabels[meal]}`);
      navigate('/', { state: { refreshEntries: true } });
    } catch {
      toast.error('Failed to add entries');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveParsedItem = (index: number) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAmountChange = (index: number, newGrams: number) => {
    setParsedItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const originalGrams = item.amountGrams;
      if (originalGrams === 0) return { ...item, amountGrams: newGrams };
      const ratio = newGrams / originalGrams;
      return {
        ...item,
        amountGrams: newGrams,
        macros: {
          calories: Math.round(item.macros.calories * ratio),
          protein: Math.round(item.macros.protein * ratio * 10) / 10,
          carbs: Math.round(item.macros.carbs * ratio * 10) / 10,
          fat: Math.round(item.macros.fat * ratio * 10) / 10,
        },
      };
    }));
  };

  const handleVoiceInput = useCallback(() => {
    if (!hasSpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognitionAPI = (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setNlText(prev => prev ? `${prev} ${transcript}` : transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [hasSpeechRecognition, isListening]);

  // Manual search handlers
  const handleApiProductSelect = (product: OpenFoodFactsProduct) => {
    setScannedProduct(product);
    setActiveTab('scan');
  };

  const handleFoodSelect = (food: Food) => {
    navigate(`/confirm?foodId=${food.id}&meal=${meal}`);
  };

  const handleCreateFood = () => {
    navigate('/foods/new');
  };

  const handleBarcodeScan = async (barcode: string) => {
    const existingFood = findByBarcode(barcode);
    if (existingFood) {
      handleFoodSelect(existingFood);
      return;
    }

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
      macrosPerServing: foodData.macrosPerServing,
      servingGrams: foodData.servingGrams,
      servingLabel: foodData.servingLabel,
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

  // ── Review step ──────────────────────────────────────────────────────────
  if (step === 'review') {
    const totals = parsedItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.macros.calories,
        protein: acc.protein + item.macros.protein,
        carbs: acc.carbs + item.macros.carbs,
        fat: acc.fat + item.macros.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return (
      <div className="min-h-screen bg-background pb-28">
        {/* Review header */}
        <div className="px-5 pt-12 pb-4 safe-top">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep('input')}
              className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Review Items</h1>
              <p className="text-sm text-muted-foreground">
                {parsedItems.length} item{parsedItems.length !== 1 ? 's' : ''} for {mealLabels[meal]}
              </p>
            </div>
          </div>
        </div>

        <main className="px-4 space-y-3">
          <AnimatePresence>
            {parsedItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-card rounded-2xl p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveParsedItem(index)}
                    className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>

                {/* Macro chips */}
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-calories/10 text-calories">
                    {Math.round(item.macros.calories)} Cal
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-protein/10 text-protein">
                    {item.macros.protein}g P
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-carbs/10 text-carbs">
                    {item.macros.carbs}g C
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-fat/10 text-fat">
                    {item.macros.fat}g F
                  </span>
                </div>

                {/* Amount editor */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Amount</label>
                  <input
                    type="number"
                    min={1}
                    value={item.amountGrams}
                    onChange={(e) => handleAmountChange(index, Number(e.target.value))}
                    className="w-20 text-sm text-center bg-muted rounded-lg px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-xs text-muted-foreground">g</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {parsedItems.length === 0 && (
            <div className="text-center py-12 bg-card rounded-2xl text-muted-foreground text-sm">
              All items removed. Go back to re-parse.
            </div>
          )}

          {/* Totals bar */}
          {parsedItems.length > 0 && (
            <div className="bg-card rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Totals</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-calories font-tabular">{Math.round(totals.calories)}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Cal</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-protein font-tabular">{Math.round(totals.protein * 10) / 10}g</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Protein</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-carbs font-tabular">{Math.round(totals.carbs * 10) / 10}g</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Carbs</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-fat font-tabular">{Math.round(totals.fat * 10) / 10}g</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Fat</div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Sticky footer CTA */}
        {parsedItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t border-border pb-safe">
            <Button
              onClick={handleConfirmParsed}
              disabled={isAdding}
              className="w-full h-14 bg-gradient-primary text-white font-semibold text-base rounded-2xl"
            >
              {isAdding ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" />Adding…</>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Add {parsedItems.length} item{parsedItems.length !== 1 ? 's' : ''} to {mealLabels[meal]}
                </>
              )}
            </Button>
          </div>
        )}

        <BottomNav />
      </div>
    );
  }

  // ── Input step ───────────────────────────────────────────────────────────
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
            <p className="text-sm text-muted-foreground">{mealLabels[meal]}</p>
          </div>
        </div>
      </div>

      {/* Meal switcher */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-4 gap-2 p-1 bg-card rounded-2xl shadow-sm">
          {mealOptions.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSearchParams({ meal: key }, { replace: true })}
              aria-pressed={meal === key}
              className={`py-2 rounded-xl text-[11px] font-medium transition-all ${
                meal === key
                  ? 'bg-gradient-primary text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* NL input card */}
      <div className="px-4 pb-4">
        <div className="bg-card rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Describe what you ate</span>
          </div>
          <div className="relative">
            <Textarea
              placeholder="e.g. 'two scrambled eggs, bacon, and an OJ for breakfast'"
              value={nlText}
              onChange={(e) => setNlText(e.target.value)}
              className="min-h-[88px] resize-none bg-muted/50 border-0 rounded-xl text-sm pr-12"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleParseNLInput();
                }
              }}
            />
            {hasSpeechRecognition && (
              <button
                onClick={handleVoiceInput}
                className={`absolute right-3 bottom-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isListening
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
          </div>
          <Button
            onClick={handleParseNLInput}
            disabled={!nlText.trim() || isParsing}
            className="w-full bg-gradient-primary"
          >
            {isParsing ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Parsing…</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Parse</>
            )}
          </Button>
        </div>
      </div>

      {/* "Or find it manually" toggle */}
      <div className="px-4 pb-3">
        <button
          onClick={() => setShowManual(prev => !prev)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showManual ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showManual ? 'Hide manual search' : 'Or find it manually'}
        </button>
      </div>

      {/* Manual section */}
      <AnimatePresence>
        {showManual && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
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

                    {searchTerm.length >= 2 ? (
                      <div className="space-y-4">
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

                        <section>
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                            Open Food Facts
                          </h3>
                          {isSearching ? (
                            <div className="flex items-center justify-center py-8 bg-card rounded-2xl">
                              <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                              <span className="text-muted-foreground text-sm">Searching...</span>
                            </div>
                          ) : rankedApiResults.length > 0 ? (
                            <div className="space-y-2">
                              {rankedApiResults.map(product => (
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
          </motion.div>
        )}
      </AnimatePresence>

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

      <div className="bg-black/10 dark:bg-black/20 rounded-2xl p-4">
        <p className="text-xs text-muted-foreground dark:text-white/40 uppercase tracking-wider mb-3">
          {displayLabel}
        </p>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-calories font-tabular">{displayMacros.calories}</div>
            <div className="text-[10px] text-muted-foreground dark:text-white/50 uppercase">Cal</div>
          </div>
          <div>
            <div className="text-lg font-bold text-protein font-tabular">{displayMacros.protein}g</div>
            <div className="text-[10px] text-muted-foreground dark:text-white/50 uppercase">Protein</div>
          </div>
          <div>
            <div className="text-lg font-bold text-carbs font-tabular">{displayMacros.carbs}g</div>
            <div className="text-[10px] text-muted-foreground dark:text-white/50 uppercase">Carbs</div>
          </div>
          <div>
            <div className="text-lg font-bold text-fat font-tabular">{displayMacros.fat}g</div>
            <div className="text-[10px] text-muted-foreground dark:text-white/50 uppercase">Fat</div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">Scan Again</Button>
        <Button variant="outline" onClick={onEdit} className="flex-1">Edit</Button>
        <Button onClick={onConfirm} className="flex-1 bg-gradient-primary">
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
  const controlsRef = useRef<IScannerControls | null>(null);
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
            (result) => {
              if (result && !hasScannedRef.current) {
                hasScannedRef.current = true;
                const barcode = result.getText();
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
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-32 border-2 border-primary rounded-xl relative">
            <div className="absolute -top-1 left-4 right-4 h-0.5 bg-primary animate-pulse" />
          </div>
        </div>
      </div>
      <p className="text-center text-sm text-muted-foreground">Point your camera at a barcode</p>
    </div>
  );
}

function ApiProductCard({
  product,
  onClick,
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
