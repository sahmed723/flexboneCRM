import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.CF_PAGES_COMMIT_SHA?.slice(0, 7) || 'local',
    environment: process.env.CF_PAGES_BRANCH === 'main' ? 'production' : 'preview',
    env_check: {
      has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      has_supabase_anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      has_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      has_anthropic: !!process.env.ANTHROPIC_API_KEY,
      supabase_url_prefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 20) || 'MISSING',
    },
  }

  return NextResponse.json(health, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
