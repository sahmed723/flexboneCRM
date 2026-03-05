export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-[#E5E5E5]" />
        <div className="space-y-2">
          <div className="h-5 w-20 animate-pulse rounded bg-[#E5E5E5]" />
          <div className="h-3.5 w-48 animate-pulse rounded bg-[#F0F0F0]" />
        </div>
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
          <div className="border-b border-[#F0F0F0] px-5 py-3.5">
            <div className="h-4 w-32 animate-pulse rounded bg-[#E5E5E5]" />
          </div>
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-12 animate-pulse rounded-lg bg-[#F0F0F0]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
