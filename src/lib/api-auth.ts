import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

interface AuthResult {
  user: { id: string; email: string }
  supabase: Awaited<ReturnType<typeof createClient>>
}

interface AuthError {
  response: NextResponse
}

/**
 * Authenticate the request and optionally rate-limit.
 * Returns the authenticated user and supabase client, or an error response.
 */
export async function authenticateRequest(
  options?: { rateLimit?: number; rateLimitWindow?: number }
): Promise<AuthResult | AuthError> {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      response: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    }
  }

  // Rate limiting
  if (options?.rateLimit) {
    const { allowed, remaining, resetMs } = checkRateLimit(
      user.id,
      options.rateLimit,
      options.rateLimitWindow || 60_000
    )

    if (!allowed) {
      return {
        response: NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil(resetMs / 1000)),
              'X-RateLimit-Remaining': '0',
            },
          }
        ),
      }
    }

    // We'll add remaining to the success response headers via the caller
  }

  return {
    user: { id: user.id, email: user.email || '' },
    supabase,
  }
}

export function isAuthError(result: AuthResult | AuthError): result is AuthError {
  return 'response' in result
}
