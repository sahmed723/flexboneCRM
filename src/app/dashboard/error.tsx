'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold text-[#1A1A2E]">Something went wrong</h2>
      <p className="text-sm text-[#6B7280] max-w-md text-center">
        {error.message || 'An unexpected error occurred loading the dashboard.'}
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-[#1A1A2E] px-4 py-2 text-sm text-white hover:bg-[#2A2A3E]"
      >
        Try again
      </button>
    </div>
  )
}
