import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCw } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { UnitToggle } from '@/components/UnitToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/hooks/useNutritionStore';
import { Macros, defaultSettings } from '@/types/nutrition';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  
  const [targets, setTargets] = useState<Macros>(settings.dailyTargets);
  const [trainingDay, setTrainingDay] = useState<Macros | null>(settings.templates?.trainingDay || null);
  const [restDay, setRestDay] = useState<Macros | null>(settings.templates?.restDay || null);
  const [showTemplates, setShowTemplates] = useState(!!settings.templates?.trainingDay || !!settings.templates?.restDay);

  const handleSaveTargets = () => {
    updateSettings({ dailyTargets: targets });
    toast.success('Daily targets saved!');
  };

  const handleUnitChange = (unit: 'g' | 'oz') => {
    updateSettings({ preferredUnit: unit });
    toast.success(`Default unit set to ${unit === 'g' ? 'grams' : 'ounces'}`);
  };

  const applyTemplate = (template: Macros) => {
    setTargets(template);
    updateSettings({ dailyTargets: template });
    toast.success('Template applied to today!');
  };

  const handleSaveTemplates = () => {
    updateSettings({
      templates: {
        trainingDay: trainingDay || undefined,
        restDay: restDay || undefined,
      },
    });
    toast.success('Templates saved!');
  };

  const resetToDefaults = () => {
    setTargets(defaultSettings.dailyTargets);
    updateSettings({ dailyTargets: defaultSettings.dailyTargets });
    toast.success('Targets reset to defaults');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border safe-top">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      <main className="px-4 py-6 space-y-8">
        {/* Default Unit */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Default Unit
          </h2>
          <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
            <div>
              <div className="font-medium">Weight Unit</div>
              <div className="text-sm text-muted-foreground">
                Used when logging food
              </div>
            </div>
            <UnitToggle 
              value={settings.preferredUnit} 
              onChange={handleUnitChange}
            />
          </div>
        </section>

        {/* Daily Targets */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Daily Targets
            </h2>
            <button 
              onClick={resetToDefaults}
              className="text-sm text-primary flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <TargetInput
                label="Calories"
                value={targets.calories}
                onChange={(v) => setTargets({ ...targets, calories: v })}
                unit="kcal"
                colorClass="text-calories"
              />
              <TargetInput
                label="Protein"
                value={targets.protein}
                onChange={(v) => setTargets({ ...targets, protein: v })}
                unit="g"
                colorClass="text-protein"
              />
              <TargetInput
                label="Carbs"
                value={targets.carbs}
                onChange={(v) => setTargets({ ...targets, carbs: v })}
                unit="g"
                colorClass="text-carbs"
              />
              <TargetInput
                label="Fat"
                value={targets.fat}
                onChange={(v) => setTargets({ ...targets, fat: v })}
                unit="g"
                colorClass="text-fat"
              />
            </div>
            
            <Button onClick={handleSaveTargets} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save Targets
            </Button>
          </div>
        </section>

        {/* Templates */}
        <section className="space-y-4">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center justify-between w-full"
          >
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Day Templates (Optional)
            </h2>
            <span className="text-sm text-primary">
              {showTemplates ? 'Hide' : 'Show'}
            </span>
          </button>
          
          {showTemplates && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              {/* Training Day */}
              <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-success">🏋️ Training Day</h3>
                  {trainingDay && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => applyTemplate(trainingDay)}
                    >
                      Apply Today
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <TargetInput
                    label="Calories"
                    value={trainingDay?.calories || 0}
                    onChange={(v) => setTrainingDay({ ...(trainingDay || targets), calories: v })}
                    unit="kcal"
                    colorClass="text-calories"
                    size="sm"
                  />
                  <TargetInput
                    label="Protein"
                    value={trainingDay?.protein || 0}
                    onChange={(v) => setTrainingDay({ ...(trainingDay || targets), protein: v })}
                    unit="g"
                    colorClass="text-protein"
                    size="sm"
                  />
                  <TargetInput
                    label="Carbs"
                    value={trainingDay?.carbs || 0}
                    onChange={(v) => setTrainingDay({ ...(trainingDay || targets), carbs: v })}
                    unit="g"
                    colorClass="text-carbs"
                    size="sm"
                  />
                  <TargetInput
                    label="Fat"
                    value={trainingDay?.fat || 0}
                    onChange={(v) => setTrainingDay({ ...(trainingDay || targets), fat: v })}
                    unit="g"
                    colorClass="text-fat"
                    size="sm"
                  />
                </div>
              </div>

              {/* Rest Day */}
              <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-muted-foreground">😴 Rest Day</h3>
                  {restDay && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => applyTemplate(restDay)}
                    >
                      Apply Today
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <TargetInput
                    label="Calories"
                    value={restDay?.calories || 0}
                    onChange={(v) => setRestDay({ ...(restDay || targets), calories: v })}
                    unit="kcal"
                    colorClass="text-calories"
                    size="sm"
                  />
                  <TargetInput
                    label="Protein"
                    value={restDay?.protein || 0}
                    onChange={(v) => setRestDay({ ...(restDay || targets), protein: v })}
                    unit="g"
                    colorClass="text-protein"
                    size="sm"
                  />
                  <TargetInput
                    label="Carbs"
                    value={restDay?.carbs || 0}
                    onChange={(v) => setRestDay({ ...(restDay || targets), carbs: v })}
                    unit="g"
                    colorClass="text-carbs"
                    size="sm"
                  />
                  <TargetInput
                    label="Fat"
                    value={restDay?.fat || 0}
                    onChange={(v) => setRestDay({ ...(restDay || targets), fat: v })}
                    unit="g"
                    colorClass="text-fat"
                    size="sm"
                  />
                </div>
              </div>

              <Button onClick={handleSaveTemplates} variant="outline" className="w-full">
                Save Templates
              </Button>
            </motion.div>
          )}
        </section>

        {/* App Info */}
        <section className="text-center text-sm text-muted-foreground pt-8">
          <p>Macro Tracker v1.0</p>
          <p className="mt-1">Built with ❤️ for fast nutrition tracking</p>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

function TargetInput({
  label,
  value,
  onChange,
  unit,
  colorClass,
  size = 'md',
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit: string;
  colorClass: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="space-y-1.5">
      <Label className={cn('text-xs font-medium', colorClass)}>
        {label} ({unit})
      </Label>
      <Input
        type="number"
        inputMode="numeric"
        value={value || ''}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className={cn(
          'font-bold font-tabular',
          size === 'sm' ? 'h-10 text-base' : 'h-12 text-lg'
        )}
      />
    </div>
  );
}
