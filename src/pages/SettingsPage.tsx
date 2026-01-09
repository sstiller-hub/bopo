import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, RefreshCw, LogOut, ChevronRight, Sun, Moon, Monitor } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { UnitToggle } from '@/components/UnitToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/hooks/useNutritionStore';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Macros, defaultSettings } from '@/types/nutrition';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { theme, setTheme } = useTheme();
  
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header - KovaFit style */}
      <div className="px-5 pt-12 pb-6 safe-top">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
      </div>

      <main className="px-4 space-y-4">
        {/* Theme Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-foreground">Appearance</div>
              <div className="text-sm text-muted-foreground">
                Choose your theme
              </div>
            </div>
            <div className="flex gap-1 p-1 bg-muted rounded-xl">
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  'p-2.5 rounded-lg transition-all',
                  theme === 'light' 
                    ? 'bg-card shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  'p-2.5 rounded-lg transition-all',
                  theme === 'dark' 
                    ? 'bg-card shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme('system')}
                className={cn(
                  'p-2.5 rounded-lg transition-all',
                  theme === 'system' 
                    ? 'bg-card shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Default Unit Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-foreground">Weight Unit</div>
              <div className="text-sm text-muted-foreground">
                Used when logging food
              </div>
            </div>
            <UnitToggle 
              value={settings.preferredUnit} 
              onChange={handleUnitChange}
            />
          </div>
        </motion.div>

        {/* Daily Targets Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl p-4 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Daily Targets</h2>
            <button 
              onClick={resetToDefaults}
              className="text-sm text-primary flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
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
          
          <Button onClick={handleSaveTargets} className="w-full bg-gradient-primary hover:opacity-90">
            <Save className="w-4 h-4 mr-2" />
            Save Targets
          </Button>
        </motion.div>

        {/* Templates Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl shadow-sm overflow-hidden"
        >
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center justify-between w-full p-4"
          >
            <h2 className="font-semibold text-foreground">Day Templates</h2>
            <ChevronRight className={cn(
              "w-5 h-5 text-muted-foreground transition-transform",
              showTemplates && "rotate-90"
            )} />
          </button>
          
          {showTemplates && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="px-4 pb-4 space-y-4"
            >
              {/* Training Day */}
              <div className="bg-success-light rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-success">🏋️ Training Day</h3>
                  {trainingDay && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => applyTemplate(trainingDay)}
                      className="h-7 text-xs"
                    >
                      Apply Today
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
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
              <div className="bg-muted rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-muted-foreground">😴 Rest Day</h3>
                  {restDay && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => applyTemplate(restDay)}
                      className="h-7 text-xs"
                    >
                      Apply Today
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
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
        </motion.div>

        {/* Account Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-foreground">Account</div>
              <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                {user?.email}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSignOut}
              className="text-destructive hover:text-destructive border-destructive/30"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </motion.div>

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground pt-6 pb-4">
          <p>Macro Tracker v1.0</p>
          <p className="mt-1">Built with ❤️ for fast nutrition tracking</p>
        </div>
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
    <div className="space-y-1">
      <Label className={cn('text-xs font-medium', colorClass)}>
        {label} ({unit})
      </Label>
      <Input
        type="number"
        inputMode="numeric"
        value={value || ''}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className={cn(
          'font-bold font-tabular bg-background',
          size === 'sm' ? 'h-9 text-sm' : 'h-11 text-base'
        )}
      />
    </div>
  );
}
