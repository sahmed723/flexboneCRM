export default function CampaignDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Back link + Header */}
      <div>
        <div className="h-4 w-32 animate-pulse rounded bg-[#E5E5E5] mb-4" />
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-7 w-56 animate-pulse rounded bg-[#E5E5E5]" />
            <div className="h-4 w-72 animate-pulse rounded bg-[#F0F0F0]" />
          </div>
          <div className="h-5 w-16 animate-pulse rounded-full bg-[#F0F0F0]" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm">
            <div className="h-4 w-24 animate-pulse rounded bg-[#E5E5E5]" />
            <div className="mt-2 h-8 w-12 animate-pulse rounded bg-[#F0F0F0]" />
          </div>
        ))}
      </div>

      {/* Stage breakdown */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm">
        <div className="h-4 w-32 animate-pulse rounded bg-[#E5E5E5] mb-4" />
        <div className="flex gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-[#F0F0F0]" />
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-[#F5F5F5] px-4 py-3.5">
            {[120, 80, 150, 60, 50].map((w, j) => (
              <div key={j} className="h-4 animate-pulse rounded bg-[#F0F0F0]" style={{ width: w }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
