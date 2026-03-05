export default function ContactDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Back link + Header */}
      <div>
        <div className="h-4 w-32 animate-pulse rounded bg-[#E5E5E5] mb-4" />
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-full bg-[#E5E5E5]" />
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-48 animate-pulse rounded bg-[#E5E5E5]" />
                <div className="h-5 w-16 animate-pulse rounded-full bg-[#F0F0F0]" />
              </div>
              <div className="h-4 w-64 animate-pulse rounded bg-[#F0F0F0]" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-20 animate-pulse rounded-md bg-[#E5E5E5]" />
            <div className="h-9 w-40 animate-pulse rounded-md bg-[#F5C518]/20" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-5 py-3.5">
              <div className="h-4 w-4 animate-pulse rounded bg-[#E5E5E5]" />
              <div className="h-4 w-36 animate-pulse rounded bg-[#E5E5E5]" />
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="h-3 w-16 animate-pulse rounded bg-[#E5E5E5]" />
                  <div className="h-4 w-40 animate-pulse rounded bg-[#F0F0F0]" />
                </div>
              ))}
            </div>
          </div>

          {/* Company Card */}
          <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-5 py-3.5">
              <div className="h-4 w-4 animate-pulse rounded bg-[#E5E5E5]" />
              <div className="h-4 w-20 animate-pulse rounded bg-[#E5E5E5]" />
            </div>
            <div className="p-5 space-y-2">
              <div className="h-5 w-48 animate-pulse rounded bg-[#E5E5E5]" />
              <div className="h-4 w-32 animate-pulse rounded bg-[#F0F0F0]" />
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-5 py-3.5">
              <div className="h-4 w-4 animate-pulse rounded bg-[#E5E5E5]" />
              <div className="h-4 w-28 animate-pulse rounded bg-[#E5E5E5]" />
            </div>
            <div className="p-5 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-5 w-5 animate-pulse rounded-full bg-[#E5E5E5]" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-32 animate-pulse rounded bg-[#E5E5E5]" />
                    <div className="h-3 w-full animate-pulse rounded bg-[#F0F0F0]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm space-y-3">
            <div className="h-3 w-16 animate-pulse rounded bg-[#E5E5E5]" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-20 animate-pulse rounded bg-[#F0F0F0]" />
                <div className="h-4 w-16 animate-pulse rounded bg-[#F0F0F0]" />
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <div className="h-8 w-8 animate-pulse rounded bg-[#F5C518]/20 mx-auto mb-2" />
            <div className="h-4 w-24 animate-pulse rounded bg-[#E5E5E5] mx-auto mb-1" />
            <div className="h-3 w-48 animate-pulse rounded bg-[#F0F0F0] mx-auto mb-3" />
            <div className="h-9 w-full animate-pulse rounded-md bg-[#F5C518]/20" />
          </div>
        </div>
      </div>
    </div>
  )
}
