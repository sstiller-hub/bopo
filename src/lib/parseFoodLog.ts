import type { Macros } from '@/types/nutrition'

export interface ParsedFoodItem {
  name: string
  description: string
  amountGrams: number
  macros: Macros
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

export async function parseFoodLog(text: string): Promise<ParsedFoodItem[]> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/parse-food-log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ text }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Edge function error ${res.status}: ${body}`)
  }

  const data = await res.json()
  if (!Array.isArray(data?.items)) throw new Error('Unexpected response')
  return data.items
}
