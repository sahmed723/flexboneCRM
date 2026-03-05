import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.CF_PAGES_COMMIT_SHA?.slice(0, 7) || 'local',
    environment: process.env.CF_PAGES_BRANCH === 'main' ? 'production' : 'preview',
  }

  return NextResponse.json(health, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
