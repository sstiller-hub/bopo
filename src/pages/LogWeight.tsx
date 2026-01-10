import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Scale, Check, Calendar, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWeightLog } from '@/hooks/useWeightLog';
import { WeightHistoryChart } from '@/components/WeightHistoryChart';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type WeightUnit = 'lb' | 'kg';

export default function LogWeight() {
  const navigate = useNavigate();
  const { saveWeight, saving, validateWeight, lbToKg, kgToLb, latestEntry, entries, loading } = useWeightLog();
  
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState<WeightUnit>('lb');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(true);

  // Pre-fill with last weight if available
  useEffect(() => {
    if (latestEntry && !weight) {
      const lastWeight = unit === 'lb' ? latestEntry.weight_lb : latestEntry.weight_kg;
      setWeight(lastWeight.toString());
    }
  }, [latestEntry, unit]);

  // Parse and validate weight
  const parsedWeight = useMemo(() => {
    const num = parseFloat(weight);
    return isNaN(num) ? 0 : num;
  }, [weight]);

  // Live converted value
  const convertedValue = useMemo(() => {
    if (!parsedWeight || parsedWeight <= 0) return null;
    if (unit === 'lb') {
      return `${lbToKg(parsedWeight).toFixed(1)} kg`;
    } else {
      return `${kgToLb(parsedWeight).toFixed(1)} lb`;
    }
  }, [parsedWeight, unit, lbToKg, kgToLb]);

  // Validate on change
  useEffect(() => {
    if (!weight) {
      setError(null);
      return;
    }
    const validationError = validateWeight(parsedWeight, unit);
    setError(validationError);
  }, [weight, parsedWeight, unit, validateWeight]);

  const handleUnitToggle = (newUnit: WeightUnit) => {
    if (newUnit === unit) return;
    
    // Convert the current value to the new unit
    if (parsedWeight > 0) {
      const converted = newUnit === 'lb' ? kgToLb(parsedWeight) : lbToKg(parsedWeight);
      setWeight(converted.toFixed(1));
    }
    setUnit(newUnit);
  };

  const handleSave = async () => {
    if (error || !parsedWeight) return;
    
    const success = await saveWeight(parsedWeight, unit, new Date(), notes);
    if (success) {
      navigate(-1);
    }
  };

  const canSave = parsedWeight > 0 && !error && !saving;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3 safe-top">
          <button 
            onClick={() => {
              if (window.history.length > 2) {
                navigate(-1);
              } else {
                navigate('/settings');
              }
            }} 
            className="p-2 -ml-2"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="font-semibold text-foreground">Log Weight</h1>
          <div className="w-10" />
        </div>
      </div>

      <main className="px-4 py-6 space-y-6">
        {/* Weight Input Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 shadow-sm space-y-5"
        >
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Scale className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Unit Toggle */}
          <div className="flex justify-center">
            <div className="flex gap-1 p-1 bg-muted rounded-xl">
              <button
                onClick={() => handleUnitToggle('lb')}
                className={cn(
                  'px-5 py-2 rounded-lg text-sm font-medium transition-all',
                  unit === 'lb'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                lb
              </button>
              <button
                onClick={() => handleUnitToggle('kg')}
                className={cn(
                  'px-5 py-2 rounded-lg text-sm font-medium transition-all',
                  unit === 'kg'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                kg
              </button>
            </div>
          </div>

          {/* Weight Input */}
          <div className="space-y-2">
            <div className="relative">
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                placeholder="0.0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className={cn(
                  'text-center text-4xl font-bold h-20 bg-background border-2',
                  error ? 'border-destructive' : 'border-border focus:border-primary'
                )}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                {unit}
              </span>
            </div>

            {/* Error or Converted Value */}
            <div className="h-6 text-center">
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : convertedValue ? (
                <p className="text-sm text-muted-foreground">= {convertedValue}</p>
              ) : null}
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(), 'MMM d, yyyy · h:mm a')}</span>
          </div>

          {/* Notes Toggle */}
          {!showNotes ? (
            <button
              onClick={() => setShowNotes(true)}
              className="flex items-center justify-center gap-2 text-sm text-primary w-full py-2"
            >
              <MessageSquare className="w-4 h-4" />
              Add note
            </button>
          ) : (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Notes (optional)</Label>
              <Textarea
                placeholder="Morning weigh-in, after workout..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none"
                rows={2}
              />
            </div>
          )}
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 disabled:opacity-50"
          >
            {saving ? (
              'Saving...'
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Save Weight
              </>
            )}
          </Button>
        </motion.div>

        {/* History Section */}
        {entries.length > 0 && (
          <div className="pt-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full mb-3"
            >
              <h2 className="font-semibold text-foreground">History</h2>
              {showHistory ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            
            {showHistory && (
              <WeightHistoryChart entries={entries} unit={unit} loading={loading} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
