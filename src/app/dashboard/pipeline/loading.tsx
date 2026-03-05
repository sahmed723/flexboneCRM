export default function PipelineLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-[#E5E5E5]" />
          <div className="space-y-2">
            <div className="h-5 w-20 animate-pulse rounded bg-[#E5E5E5]" />
            <div className="h-3.5 w-52 animate-pulse rounded bg-[#F0F0F0]" />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-40 animate-pulse rounded-md bg-[#E5E5E5]" />
          <div className="h-9 w-40 animate-pulse rounded-md bg-[#E5E5E5]" />
        </div>
      </div>
      <div className="flex gap-4 overflow-hidden">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="w-[270px] shrink-0 rounded-lg border border-[#E5E5E5] bg-[#F9FAFB]">
            <div className="border-b border-[#E5E5E5] px-3 py-3">
              <div className="h-4 w-20 animate-pulse rounded bg-[#E5E5E5]" />
            </div>
            <div className="p-2 space-y-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="rounded-md border border-[#E5E5E5] bg-white p-3 space-y-2">
                  <div className="h-3.5 w-24 animate-pulse rounded bg-[#E5E5E5]" />
                  <div className="h-3 w-32 animate-pulse rounded bg-[#F0F0F0]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
