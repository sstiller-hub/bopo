-- Add parent_entry_id to allow entries to be grouped as ingredients under a parent
ALTER TABLE public.entries 
ADD COLUMN parent_entry_id uuid REFERENCES public.entries(id) ON DELETE CASCADE;

-- Add is_recipe flag to identify parent entries that are recipes
ALTER TABLE public.entries
ADD COLUMN is_recipe boolean NOT NULL DEFAULT false;

-- Add index for efficient querying of child entries
CREATE INDEX idx_entries_parent_entry_id ON public.entries(parent_entry_id) WHERE parent_entry_id IS NOT NULL;