import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, Utensils } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { useMealTemplates, MealTemplate } from '@/hooks/useMealTemplates';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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

const mealTypeLabels: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

const mealTypeColors: Record<string, string> = {
  breakfast: 'bg-amber-500/20 text-amber-400',
  lunch: 'bg-green-500/20 text-green-400',
  dinner: 'bg-blue-500/20 text-blue-400',
  snacks: 'bg-purple-500/20 text-purple-400',
};

export default function MealTemplatesPage() {
  const navigate = useNavigate();
  const { templates, deleteTemplate, loading } = useMealTemplates();
  const [deleteTarget, setDeleteTarget] = useState<MealTemplate | null>(null);

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteTemplate(deleteTarget.id);
      toast.success(`Deleted "${deleteTarget.name}"`);
      setDeleteTarget(null);
    }
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.mealType]) {
      acc[template.mealType] = [];
    }
    acc[template.mealType].push(template);
    return acc;
  }, {} as Record<string, MealTemplate[]>);

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 safe-top">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Meal Templates</h1>
            <p className="text-sm text-muted-foreground">
              {templates.length} saved template{templates.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <main className="px-4 space-y-6">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading templates...
          </div>
        ) : templates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 bg-card rounded-2xl"
          >
            <Utensils className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No templates yet</p>
            <p className="text-sm text-muted-foreground/70 max-w-[250px] mx-auto">
              Add foods to a meal and tap "Save Template" to create one
            </p>
          </motion.div>
        ) : (
          Object.entries(groupedTemplates).map(([mealType, mealTemplates]) => (
            <section key={mealType}>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                {mealTypeLabels[mealType]}
              </h2>
              <div className="space-y-2">
                <AnimatePresence>
                  {mealTemplates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-card rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-medium",
                              mealTypeColors[mealType]
                            )}>
                              {mealTypeLabels[mealType]}
                            </span>
                            {template.useCount > 0 && (
                              <span className="text-xs text-muted-foreground">
                                Used {template.useCount}×
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-foreground truncate">
                            {template.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.entries.length} item{template.entries.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Macro summary */}
                          <div className="text-right">
                            <div className="text-sm font-semibold text-calories font-tabular">
                              {template.entries.reduce((acc, e) => acc + e.macros.calories, 0)} cal
                            </div>
                            <div className="text-xs text-muted-foreground font-tabular">
                              {template.entries.reduce((acc, e) => acc + e.macros.protein, 0)}P · 
                              {template.entries.reduce((acc, e) => acc + e.macros.carbs, 0)}C · 
                              {template.entries.reduce((acc, e) => acc + e.macros.fat, 0)}F
                            </div>
                          </div>
                          
                          {/* Delete button */}
                          <button
                            onClick={() => setDeleteTarget(template)}
                            className="p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Entries preview */}
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="flex flex-wrap gap-1">
                          {template.entries.slice(0, 4).map((entry, i) => (
                            <span
                              key={i}
                              className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground truncate max-w-[120px]"
                            >
                              {entry.foodName}
                            </span>
                          ))}
                          {template.entries.length > 4 && (
                            <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                              +{template.entries.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          ))
        )}
      </main>

      <BottomNav />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.name}".
              This action cannot be undone.
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
