'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { LayoutList, Columns3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ViewToggleProps {
  current: 'table' | 'kanban'
}

export function ViewToggle({ current }: ViewToggleProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const setView = (view: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (view === 'table') params.delete('view')
    else params.set('view', view)
    startTransition(() => { router.push(`${pathname}?${params.toString()}`) })
  }

  return (
    <div className="flex items-center rounded-lg border border-[#E5E5E5] bg-white p-0.5">
      <button
        onClick={() => setView('table')}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          current === 'table' ? 'bg-[#1A1A2E] text-white' : 'text-[#6B7280] hover:text-[#0A0A0A]'
        )}
      >
        <LayoutList className="h-4 w-4" /> Table
      </button>
      <button
        onClick={() => setView('kanban')}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          current === 'kanban' ? 'bg-[#1A1A2E] text-white' : 'text-[#6B7280] hover:text-[#0A0A0A]'
        )}
      >
        <Columns3 className="h-4 w-4" /> Kanban
      </button>
    </div>
  )
}
