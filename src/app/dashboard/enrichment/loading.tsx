export default function EnrichmentLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-[#E5E5E5]" />
        <div className="space-y-2">
          <div className="h-5 w-32 animate-pulse rounded bg-[#E5E5E5]" />
          <div className="h-3.5 w-64 animate-pulse rounded bg-[#F0F0F0]" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-lg bg-[#E5E5E5]" />
              <div className="h-4 w-28 animate-pulse rounded bg-[#E5E5E5]" />
            </div>
            <div className="h-3 w-48 animate-pulse rounded bg-[#F0F0F0]" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm">
            <div className="h-4 w-20 animate-pulse rounded bg-[#E5E5E5]" />
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-[#F0F0F0]" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-5 border-b border-[#F5F5F5] px-4 py-3">
            {[80, 150, 60, 80, 50, 90].map((w, j) => (
              <div key={j} className="h-4 animate-pulse rounded bg-[#F0F0F0]" style={{ width: w }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
