-- Add serving label for per-serving foods
ALTER TABLE public.foods
ADD COLUMN serving_label TEXT;
