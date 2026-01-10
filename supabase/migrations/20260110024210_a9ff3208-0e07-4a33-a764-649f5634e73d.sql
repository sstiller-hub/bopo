-- Create body_weight_entries table
CREATE TABLE public.body_weight_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  measured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  weight_kg NUMERIC(5,2) NOT NULL,
  weight_lb NUMERIC(5,2) NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  source_row_id TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, source_row_id)
);

-- Enable RLS
ALTER TABLE public.body_weight_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own weight entries"
ON public.body_weight_entries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weight entries"
ON public.body_weight_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight entries"
ON public.body_weight_entries
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight entries"
ON public.body_weight_entries
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_body_weight_entries_updated_at
BEFORE UPDATE ON public.body_weight_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_body_weight_entries_user_measured ON public.body_weight_entries(user_id, measured_at DESC);