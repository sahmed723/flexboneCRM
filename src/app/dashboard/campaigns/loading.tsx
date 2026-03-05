export default function CampaignsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-[#E5E5E5]" />
          <div className="space-y-2">
            <div className="h-5 w-28 animate-pulse rounded bg-[#E5E5E5]" />
            <div className="h-3.5 w-56 animate-pulse rounded bg-[#F0F0F0]" />
          </div>
        </div>
        <div className="h-9 w-36 animate-pulse rounded-lg bg-[#E5E5E5]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm space-y-3">
            <div className="h-5 w-40 animate-pulse rounded bg-[#E5E5E5]" />
            <div className="h-3 w-24 animate-pulse rounded bg-[#F0F0F0]" />
            <div className="h-3 w-32 animate-pulse rounded bg-[#F5F5F5]" />
          </div>
        ))}
      </div>
    </div>
  )
}
