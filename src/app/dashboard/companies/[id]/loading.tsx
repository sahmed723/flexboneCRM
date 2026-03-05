export default function CompanyDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Back link + Header */}
      <div>
        <div className="h-4 w-32 animate-pulse rounded bg-[#E5E5E5] mb-4" />
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-7 w-56 animate-pulse rounded bg-[#E5E5E5]" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-[#F0F0F0]" />
            </div>
            <div className="h-4 w-72 animate-pulse rounded bg-[#F0F0F0]" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-20 animate-pulse rounded-md bg-[#E5E5E5]" />
            <div className="h-9 w-40 animate-pulse rounded-md bg-[#F5C518]/20" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex gap-1 h-10 rounded-md border border-[#E5E5E5] bg-white p-1">
            {['Overview', 'Contacts', 'Enrichment', 'Procedures', 'Activities'].map((t) => (
              <div key={t} className="h-8 w-24 animate-pulse rounded bg-[#F0F0F0]" />
            ))}
          </div>
          {/* Overview skeleton */}
          <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-5 py-3.5">
              <div className="h-4 w-4 animate-pulse rounded bg-[#E5E5E5]" />
              <div className="h-4 w-28 animate-pulse rounded bg-[#E5E5E5]" />
            </div>
            <div className="p-5 grid grid-cols-3 gap-4">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="h-3 w-16 animate-pulse rounded bg-[#E5E5E5]" />
                  <div className="h-4 w-28 animate-pulse rounded bg-[#F0F0F0]" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="hidden xl:block w-72 shrink-0">
          <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm space-y-3">
            <div className="h-3 w-20 animate-pulse rounded bg-[#E5E5E5]" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-20 animate-pulse rounded bg-[#F0F0F0]" />
                <div className="h-4 w-12 animate-pulse rounded bg-[#F0F0F0]" />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
