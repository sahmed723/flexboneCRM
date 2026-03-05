export default function ContactsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-[#E5E5E5]" />
          <div className="space-y-2">
            <div className="h-5 w-24 animate-pulse rounded bg-[#E5E5E5]" />
            <div className="h-3.5 w-48 animate-pulse rounded bg-[#F0F0F0]" />
          </div>
        </div>
        <div className="h-9 w-36 animate-pulse rounded-lg bg-[#E5E5E5]" />
      </div>
      <div className="h-9 w-96 animate-pulse rounded-md bg-[#E5E5E5]" />
      <div className="flex gap-6">
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-5 animate-pulse rounded bg-[#F0F0F0]" />
            ))}
          </div>
        </aside>
        <div className="flex-1 rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
          {[...Array(14)].map((_, i) => (
            <div key={i} className="flex gap-5 border-b border-[#F5F5F5] px-4 py-3">
              {[28, 110, 90, 130, 150, 55, 55, 50, 65].map((w, j) => (
                <div key={j} className="h-4 animate-pulse rounded bg-[#F0F0F0]" style={{ width: w }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
