import { supabase } from '@/integrations/supabase/client'
import type { Macros } from '@/types/nutrition'

export interface ParsedFoodItem {
  name: string
  description: string
  amountGrams: number
  macros: Macros
}

export async function parseFoodLog(text: string): Promise<ParsedFoodItem[]> {
  const { data, error } = await supabase.functions.invoke('parse-food-log', { body: { text } })
  if (error) throw new Error(error.message)
  if (!Array.isArray(data?.items)) throw new Error('Unexpected response')
  return data.items
}
