const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()
    if (!text || typeof text !== 'string') {
      return json({ error: 'Missing text' }, 400)
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return json({ error: 'Server misconfigured' }, 500)
    }

    const prompt = `Extract every food and drink item from the following text. For each item, estimate the gram weight consumed and nutritional values using standard USDA reference values.

Return ONLY a raw JSON array with no markdown, no code fences, no explanation. Each element must have exactly these fields:
- name: short display name (e.g. "Scrambled eggs")
- description: brief description including quantity (e.g. "2 large eggs, scrambled")
- amountGrams: estimated weight in grams as a number
- macros: object with calories (kcal), protein (g), carbs (g), fat (g) — all numbers

Text: "${text.replace(/"/g, '\\"')}"`

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text()
      return json({ error: `Anthropic error: ${err}` }, 502)
    }

    const anthropicData = await anthropicRes.json()
    const rawText: string = anthropicData.content?.[0]?.text ?? ''
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

    let items
    try {
      items = JSON.parse(cleaned)
    } catch {
      return json({ error: 'Failed to parse AI response', raw: rawText }, 502)
    }

    return json({ items })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})
