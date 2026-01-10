-- Switch auth ownership to Clerk user IDs (text) and update RLS policies

-- Drop Supabase auth FK constraints
ALTER TABLE public.user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;
ALTER TABLE public.foods DROP CONSTRAINT IF EXISTS foods_user_id_fkey;
ALTER TABLE public.entries DROP CONSTRAINT IF EXISTS entries_user_id_fkey;

-- Update user_id columns to text for Clerk user IDs
ALTER TABLE public.user_settings ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.foods ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.entries ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.meal_templates ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.body_weight_entries ALTER COLUMN user_id TYPE text USING user_id::text;

-- Recreate RLS policies using Clerk JWT subject
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;

CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Users can view their own foods" ON public.foods;
DROP POLICY IF EXISTS "Users can insert their own foods" ON public.foods;
DROP POLICY IF EXISTS "Users can update their own foods" ON public.foods;
DROP POLICY IF EXISTS "Users can delete their own foods" ON public.foods;

CREATE POLICY "Users can view their own foods"
  ON public.foods FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can insert their own foods"
  ON public.foods FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can update their own foods"
  ON public.foods FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can delete their own foods"
  ON public.foods FOR DELETE
  USING ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Users can view their own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can insert their own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON public.entries;

CREATE POLICY "Users can view their own entries"
  ON public.entries FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can insert their own entries"
  ON public.entries FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can update their own entries"
  ON public.entries FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can delete their own entries"
  ON public.entries FOR DELETE
  USING ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Users can view their own templates" ON public.meal_templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON public.meal_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.meal_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.meal_templates;

CREATE POLICY "Users can view their own templates"
  ON public.meal_templates FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can insert their own templates"
  ON public.meal_templates FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can update their own templates"
  ON public.meal_templates FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.meal_templates FOR DELETE
  USING ((auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Users can view their own weight entries" ON public.body_weight_entries;
DROP POLICY IF EXISTS "Users can insert their own weight entries" ON public.body_weight_entries;
DROP POLICY IF EXISTS "Users can update their own weight entries" ON public.body_weight_entries;
DROP POLICY IF EXISTS "Users can delete their own weight entries" ON public.body_weight_entries;

CREATE POLICY "Users can view their own weight entries"
  ON public.body_weight_entries FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can insert their own weight entries"
  ON public.body_weight_entries FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can update their own weight entries"
  ON public.body_weight_entries FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can delete their own weight entries"
  ON public.body_weight_entries FOR DELETE
  USING ((auth.jwt() ->> 'sub') = user_id);
