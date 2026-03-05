'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const CATEGORIES = [
  'ASC', 'SNF', 'BPO', 'Health System', 'Insurer',
  'Optometry', 'DSO', 'Newsletter', 'ASC Association',
]

interface PipelineFiltersProps {
  owners: string[]
}

export function PipelineFilters({ owners }: PipelineFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const update = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === 'all') params.delete(key)
    else params.set(key, value)
    startTransition(() => { router.push(`${pathname}?${params.toString()}`) })
  }

  return (
    <div className="flex items-center gap-3">
      <Select value={searchParams.get('category') || 'all'} onValueChange={(v) => update('category', v)}>
        <SelectTrigger className="h-9 w-40 text-sm">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={searchParams.get('owner') || 'all'} onValueChange={(v) => update('owner', v)}>
        <SelectTrigger className="h-9 w-40 text-sm">
          <SelectValue placeholder="All owners" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All owners</SelectItem>
          {owners.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
