'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-[#1A1A2E] mb-2">Something went wrong</h2>
        <p className="text-sm text-[#6B7280] mb-6">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        {error.digest && (
          <p className="text-xs text-[#9CA3AF] mb-4 font-mono">Error ID: {error.digest}</p>
        )}
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} variant="outline" className="gap-1.5">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button asChild className="gap-1.5 bg-[#F5C518] text-[#0A0A0A] hover:bg-[#F5C518]/90">
            <a href="/dashboard">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
