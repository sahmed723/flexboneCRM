export default function DataHealthLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-4 w-28 animate-pulse rounded bg-[#E5E5E5] mb-4" />
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-[#E5E5E5]" />
          <div className="space-y-2">
            <div className="h-5 w-28 animate-pulse rounded bg-[#E5E5E5]" />
            <div className="h-3.5 w-56 animate-pulse rounded bg-[#F0F0F0]" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border border-[#E5E5E5] bg-white p-4">
            <div className="h-4 w-16 animate-pulse rounded bg-[#E5E5E5]" />
            <div className="mt-2 h-8 w-12 animate-pulse rounded bg-[#F0F0F0]" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex gap-6 border-b border-[#F5F5F5] px-4 py-3">
            {[140, 80, 80, 60].map((w, j) => (
              <div key={j} className="h-4 animate-pulse rounded bg-[#F0F0F0]" style={{ width: w }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
