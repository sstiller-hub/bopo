-- Create enum for nutrition basis
CREATE TYPE public.nutrition_basis AS ENUM ('per_100g', 'per_serving');

-- Create enum for meal types
CREATE TYPE public.meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snacks');

-- Create enum for food source
CREATE TYPE public.food_source AS ENUM ('user', 'open_food_facts');

-- Create enum for weight unit
CREATE TYPE public.weight_unit AS ENUM ('g', 'oz');

-- User settings table
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_unit weight_unit NOT NULL DEFAULT 'g',
  -- Daily targets
  daily_calories INTEGER NOT NULL DEFAULT 2000,
  daily_protein INTEGER NOT NULL DEFAULT 150,
  daily_carbs INTEGER NOT NULL DEFAULT 200,
  daily_fat INTEGER NOT NULL DEFAULT 65,
  -- Training day template (optional)
  training_calories INTEGER,
  training_protein INTEGER,
  training_carbs INTEGER,
  training_fat INTEGER,
  -- Rest day template (optional)
  rest_calories INTEGER,
  rest_protein INTEGER,
  rest_carbs INTEGER,
  rest_fat INTEGER,
  -- Tolerance settings
  tolerance_macros INTEGER DEFAULT 5,
  tolerance_calories INTEGER DEFAULT 50,
  -- Custom meal names
  meal_name_breakfast TEXT DEFAULT 'Breakfast',
  meal_name_lunch TEXT DEFAULT 'Lunch',
  meal_name_dinner TEXT DEFAULT 'Dinner',
  meal_name_snacks TEXT DEFAULT 'Snacks',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Foods table (user's food library)
CREATE TABLE public.foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  barcode TEXT,
  nutrition_basis nutrition_basis NOT NULL DEFAULT 'per_100g',
  -- Macros per 100g
  calories_per_100g NUMERIC,
  protein_per_100g NUMERIC,
  carbs_per_100g NUMERIC,
  fat_per_100g NUMERIC,
  -- Macros per serving
  calories_per_serving NUMERIC,
  protein_per_serving NUMERIC,
  carbs_per_serving NUMERIC,
  fat_per_serving NUMERIC,
  serving_grams NUMERIC,
  -- Metadata
  source food_source NOT NULL DEFAULT 'user',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  use_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for barcode lookups
CREATE INDEX idx_foods_barcode ON public.foods(user_id, barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_foods_user_id ON public.foods(user_id);

-- Entries table (food log)
CREATE TABLE public.entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal meal_type NOT NULL,
  food_id UUID REFERENCES public.foods(id) ON DELETE SET NULL,
  food_name TEXT NOT NULL,
  amount_grams NUMERIC NOT NULL,
  -- Computed macros snapshot
  calories NUMERIC NOT NULL,
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fat NUMERIC NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX idx_entries_user_date ON public.entries(user_id, date);
CREATE INDEX idx_entries_user_date_meal ON public.entries(user_id, date, meal);

-- Enable RLS on all tables
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings
CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for foods
CREATE POLICY "Users can view their own foods"
  ON public.foods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own foods"
  ON public.foods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own foods"
  ON public.foods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own foods"
  ON public.foods FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for entries
CREATE POLICY "Users can view their own entries"
  ON public.entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entries"
  ON public.entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries"
  ON public.entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
  ON public.entries FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_foods_updated_at
  BEFORE UPDATE ON public.foods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();