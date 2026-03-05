export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 animate-pulse rounded bg-[#E5E5E5]" />
        <div className="h-4 w-48 animate-pulse rounded bg-[#F0F0F0]" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-sm">
            <div className="space-y-3">
              <div className="h-4 w-24 animate-pulse rounded bg-[#E5E5E5]" />
              <div className="h-8 w-20 animate-pulse rounded bg-[#E5E5E5]" />
              <div className="h-3 w-32 animate-pulse rounded bg-[#F0F0F0]" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts row skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-sm">
            <div className="h-5 w-40 animate-pulse rounded bg-[#E5E5E5] mb-2" />
            <div className="h-4 w-56 animate-pulse rounded bg-[#F0F0F0] mb-6" />
            <div className="h-[300px] animate-pulse rounded bg-[#F5F5F5]" />
          </div>
        ))}
      </div>
    </div>
  )
}
