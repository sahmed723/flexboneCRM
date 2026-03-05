'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

const ACTIVITY_TYPES = [
  { value: 'email', label: 'Email' },
  { value: 'call', label: 'Call' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'note', label: 'Note' },
  { value: 'enrichment', label: 'Enrichment' },
]

interface ActivityFiltersProps {
  owners: string[]
}

export function ActivityFilters({ owners }: ActivityFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const selectedTypes = searchParams.get('types')?.split(',').filter(Boolean) || []
  const dateFrom = searchParams.get('dateFrom') || ''
  const dateTo = searchParams.get('dateTo') || ''

  const update = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (!value) params.delete(key)
    else params.set(key, value)
    params.set('page', '1')
    startTransition(() => { router.push(`${pathname}?${params.toString()}`) })
  }

  const toggleType = (type: string) => {
    const current = new Set(selectedTypes)
    if (current.has(type)) current.delete(type)
    else current.add(type)
    const val = Array.from(current).join(',')
    update('types', val || null)
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF] mb-2">Activity Type</h3>
        <div className="space-y-2">
          {ACTIVITY_TYPES.map((t) => (
            <label key={t.value} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedTypes.includes(t.value)}
                onCheckedChange={() => toggleType(t.value)}
              />
              <span className="text-sm text-[#374151]">{t.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF] mb-2">User</h3>
        <Select
          value={searchParams.get('userId') || 'all'}
          onValueChange={(v) => update('userId', v === 'all' ? null : v)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {owners.map((o) => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF] mb-2">Date Range</h3>
        <div className="space-y-2">
          <div>
            <Label className="text-xs text-[#6B7280]">From</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => update('dateFrom', e.target.value || null)}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs text-[#6B7280]">To</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => update('dateTo', e.target.value || null)}
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {(selectedTypes.length > 0 || dateFrom || dateTo || searchParams.get('userId')) && (
        <button
          type="button"
          onClick={() => {
            startTransition(() => { router.push(pathname) })
          }}
          className="text-xs text-[#F5C518] hover:text-[#D4A516] font-medium"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}
