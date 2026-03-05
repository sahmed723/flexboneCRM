'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X } from 'lucide-react'

const STAGES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'demo_scheduled', label: 'Demo Scheduled' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed_won', label: 'Closed Won' },
  { value: 'closed_lost', label: 'Closed Lost' },
]

const CATEGORIES = [
  'ASC', 'SNF', 'BPO', 'Health System', 'Insurer',
  'Optometry', 'DSO', 'Newsletter', 'ASC Association',
]

const SOURCES = [
  'Apollo', 'Beckers ASC Review', 'ASCA.org', 'GA_Urology',
  'GA_Eye_Partners', 'Resurgens', 'Orlando_Health_Execs', 'Manual', 'Import', 'Other',
]

const TIERS = [
  { value: 'all', label: 'All' },
  { value: 'tier_1', label: 'Tier 1' },
  { value: 'tier_2', label: 'Tier 2' },
  { value: 'tier_3', label: 'Tier 3' },
  { value: 'unassigned', label: 'Unassigned' },
]

interface ContactFiltersProps {
  owners: string[]
  campaignBatches: string[]
}

export function ContactFilters({ owners, campaignBatches }: ContactFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const selectedStages = searchParams.get('stages')?.split(',').filter(Boolean) || []
  const selectedCategories = searchParams.get('categories')?.split(',').filter(Boolean) || []
  const selectedSources = searchParams.get('sources')?.split(',').filter(Boolean) || []

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
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

  const toggleMulti = (key: string, current: string[], value: string) => {
    const set = new Set(current)
    if (set.has(value)) set.delete(value)
    else set.add(value)
    updateParams({ [key]: Array.from(set).join(',') || null })
  }

  const clearAll = () => {
    startTransition(() => { router.push(pathname) })
  }

  const hasFilters = selectedStages.length > 0 || selectedCategories.length > 0 ||
    selectedSources.length > 0 || searchParams.has('owner') || searchParams.has('priorityTier') ||
    searchParams.has('campaignBatch') || searchParams.has('hasEmail') || searchParams.has('hasLinkedin')

  return (
    <ScrollArea className="h-[calc(100vh-220px)]">
      <div className="space-y-5 pr-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1A1A2E]">Filters</h3>
          {hasFilters && (
            <button onClick={clearAll} className="text-xs text-[#6B7280] hover:text-[#0A0A0A] flex items-center gap-1">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Stage */}
        <FilterSection label="Stage">
          {STAGES.map((s) => (
            <label key={s.value} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedStages.includes(s.value)}
                onCheckedChange={() => toggleMulti('stages', selectedStages, s.value)}
                className="h-3.5 w-3.5"
              />
              <span className="text-sm text-[#374151]">{s.label}</span>
            </label>
          ))}
        </FilterSection>

        {/* Category */}
        <FilterSection label="Category">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedCategories.includes(cat)}
                onCheckedChange={() => toggleMulti('categories', selectedCategories, cat)}
                className="h-3.5 w-3.5"
              />
              <span className="text-sm text-[#374151]">{cat}</span>
            </label>
          ))}
        </FilterSection>

        {/* Source */}
        <FilterSection label="Source">
          {SOURCES.map((src) => (
            <label key={src} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedSources.includes(src)}
                onCheckedChange={() => toggleMulti('sources', selectedSources, src)}
                className="h-3.5 w-3.5"
              />
              <span className="text-sm text-[#374151]">{src}</span>
            </label>
          ))}
        </FilterSection>

        {/* Priority Tier */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Priority Tier</Label>
          <Select value={searchParams.get('priorityTier') || 'all'} onValueChange={(v) => updateParams({ priorityTier: v })}>
            <SelectTrigger className="w-full h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIERS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Owner */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Owner</Label>
          <Select value={searchParams.get('owner') || 'all'} onValueChange={(v) => updateParams({ owner: v === 'all' ? null : v })}>
            <SelectTrigger className="w-full h-8 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All owners</SelectItem>
              {owners.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Campaign Batch */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Campaign Batch</Label>
          <Select value={searchParams.get('campaignBatch') || 'all'} onValueChange={(v) => updateParams({ campaignBatch: v === 'all' ? null : v })}>
            <SelectTrigger className="w-full h-8 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All batches</SelectItem>
              {campaignBatches.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Has Email / LinkedIn */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Has Email</Label>
            <Select value={searchParams.get('hasEmail') || 'all'} onValueChange={(v) => updateParams({ hasEmail: v })}>
              <SelectTrigger className="w-full h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">LinkedIn</Label>
            <Select value={searchParams.get('hasLinkedin') || 'all'} onValueChange={(v) => updateParams({ hasLinkedin: v })}>
              <SelectTrigger className="w-full h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date Imported */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Date Imported</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={searchParams.get('dateImportedFrom') || ''}
              onChange={(e) => updateParams({ dateImportedFrom: e.target.value || null })}
              className="h-8 text-xs"
            />
            <Input
              type="date"
              value={searchParams.get('dateImportedTo') || ''}
              onChange={(e) => updateParams({ dateImportedTo: e.target.value || null })}
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Last Contacted */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Last Contacted</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={searchParams.get('lastContactedFrom') || ''}
              onChange={(e) => updateParams({ lastContactedFrom: e.target.value || null })}
              className="h-8 text-xs"
            />
            <Input
              type="date"
              value={searchParams.get('lastContactedTo') || ''}
              onChange={(e) => updateParams({ lastContactedTo: e.target.value || null })}
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">{label}</Label>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}
