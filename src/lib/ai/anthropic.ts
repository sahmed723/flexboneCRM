import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = 'claude-sonnet-4-20250514' as const

interface CompletionOpts {
  system: string
  prompt: string
  maxTokens?: number
  temperature?: number
}

interface CompletionResult {
  text: string
  inputTokens: number
  outputTokens: number
  model: string
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function complete(opts: CompletionOpts): Promise<CompletionResult> {
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: opts.maxTokens || 4096,
        temperature: opts.temperature ?? 0.3,
        system: opts.system,
        messages: [{ role: 'user', content: opts.prompt }],
      })

      const textBlock = response.content.find((b) => b.type === 'text')
      const text = textBlock && textBlock.type === 'text' ? textBlock.text : ''

      return {
        text,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        model: MODEL,
      }
    } catch (error) {
      lastError = error as Error

      // Don't retry on auth errors or invalid requests
      if (error instanceof Anthropic.AuthenticationError) throw error
      if (error instanceof Anthropic.BadRequestError) throw error

      // Retry on rate limit or server errors with exponential backoff
      if (
        error instanceof Anthropic.RateLimitError ||
        error instanceof Anthropic.InternalServerError ||
        error instanceof Anthropic.APIConnectionError
      ) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000)
        await sleep(delay)
        continue
      }

      throw error
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

export function extractJSON(text: string): Record<string, unknown> | null {
  // Try to find JSON in the response (may be wrapped in ```json blocks)
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null

  try {
    const jsonStr = jsonMatch[1] || jsonMatch[0]
    return JSON.parse(jsonStr)
  } catch {
    return null
  }
}

// Load enrichment config from Supabase with fallback defaults
export async function loadEnrichmentConfig(supabase: { from: (table: string) => unknown }) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('enrichment_config') as any)
      .select('config_key, value')

    if (!data || data.length === 0) return null

    const config: Record<string, string> = {}
    for (const row of data as { config_key: string; value: string }[]) {
      config[row.config_key] = row.value
    }
    return config
  } catch {
    return null
  }
}

export { MODEL }
