'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

const CATEGORIES = [
  'ASC', 'SNF', 'BPO', 'Health System', 'Insurer',
  'Optometry', 'DSO', 'Newsletter', 'ASC Association',
]

interface CompanyFiltersProps {
  states: string[]
}

export function CompanyFilters({ states }: CompanyFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const selectedCategories = searchParams.get('categories')?.split(',').filter(Boolean) || []
  const selectedState = searchParams.get('state') || ''
  const enriched = searchParams.get('enriched') || 'all'
  const hasAsc = searchParams.get('hasAsc') || 'all'

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    // Reset to page 1 when filters change
    params.set('page', '1')
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '' || value === 'all') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }, [router, pathname, searchParams, startTransition])

  const toggleCategory = (cat: string) => {
    const current = new Set(selectedCategories)
    if (current.has(cat)) {
      current.delete(cat)
    } else {
      current.add(cat)
    }
    const val = Array.from(current).join(',')
    updateParams({ categories: val || null })
  }

  const clearAll = () => {
    startTransition(() => {
      router.push(pathname)
    })
  }

  const hasActiveFilters = selectedCategories.length > 0 || selectedState || enriched !== 'all' || hasAsc !== 'all'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1A1A2E]">Filters</h3>
        {hasActiveFilters && (
          <button onClick={clearAll} className="text-xs text-[#6B7280] hover:text-[#0A0A0A] flex items-center gap-1">
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Category */}
      <div className="space-y-3">
        <Label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Category</Label>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedCategories.includes(cat)}
                onCheckedChange={() => toggleCategory(cat)}
                className="h-4 w-4"
              />
              <span className="text-sm text-[#374151]">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* State */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">State</Label>
        <Select value={selectedState || 'all'} onValueChange={(v) => updateParams({ state: v === 'all' ? null : v })}>
          <SelectTrigger className="w-full h-9 text-sm">
            <SelectValue placeholder="All states" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            {states.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Enriched */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Enriched</Label>
        <Select value={enriched} onValueChange={(v) => updateParams({ enriched: v })}>
          <SelectTrigger className="w-full h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="yes">Enriched only</SelectItem>
            <SelectItem value="no">Not enriched</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Has ASC */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Has ASC</Label>
        <Select value={hasAsc} onValueChange={(v) => updateParams({ hasAsc: v })}>
          <SelectTrigger className="w-full h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
