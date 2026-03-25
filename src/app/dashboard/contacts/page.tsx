import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import {
  fetchContacts,
  fetchDistinctOwners,
  fetchDistinctCampaignBatches,
  fetchPipelineData,
  type ContactFilters,
} from '@/lib/queries/contacts'
import { ContactTable } from '@/components/contacts/contact-table'
import { ContactFilters as ContactFiltersPanel } from '@/components/contacts/contact-filters'
import { ContactSearch } from '@/components/contacts/contact-search'
import { KanbanBoard } from '@/components/contacts/kanban-board'
import { ViewToggle } from '@/components/contacts/view-toggle'
import { Users } from 'lucide-react'

export const runtime = 'edge'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function TableSkeleton() {
  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
      <div className="border-b border-[#F0F0F0] px-4 py-3">
        <div className="flex gap-6">
          {[28, 100, 100, 120, 140, 60, 60, 50, 70].map((w, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-[#E5E5E5]" style={{ width: w }} />
          ))}
        </div>
      </div>
      {[...Array(12)].map((_, i) => (
        <div key={i} className="flex gap-6 border-b border-[#F5F5F5] px-4 py-3">
          {[28, 110, 90, 130, 150, 55, 55, 50, 65].map((w, j) => (
            <div key={j} className="h-4 animate-pulse rounded bg-[#F0F0F0]" style={{ width: w }} />
          ))}
        </div>
      ))}
    </div>
  )
}

function KanbanSkeleton() {
  return (
    <div className="flex gap-4">
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
  )
}

async function ContactsTableContent({ filters, filterParams }: { filters: ContactFilters; filterParams: string }) {
  const supabase = await createClient()
  const { data, count } = await fetchContacts(supabase, filters)
  return (
    <ContactTable
      data={data}
      totalCount={count}
      page={filters.page || 1}
      perPage={filters.perPage || 50}
      filterParams={filterParams}
    />
  )
}

async function KanbanContent({ category, owner }: { category?: string; owner?: string }) {
  const supabase = await createClient()
  const { columns } = await fetchPipelineData(supabase, { category, owner })
  return <KanbanBoard columns={columns} />
}

async function FilterPanel() {
  const supabase = await createClient()
  const [owners, batches] = await Promise.all([
    fetchDistinctOwners(supabase),
    fetchDistinctCampaignBatches(supabase),
  ])
  return <ContactFiltersPanel owners={owners} campaignBatches={batches} />
}

export default async function ContactsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const view = (typeof params.view === 'string' ? params.view : 'table') as 'table' | 'kanban'

  const filters: ContactFilters = {
    search: typeof params.search === 'string' ? params.search : undefined,
    titleSearch: typeof params.titleSearch === 'string' ? params.titleSearch : undefined,
    stages: typeof params.stages === 'string' ? params.stages.split(',').filter(Boolean) : undefined,
    categories: typeof params.categories === 'string' ? params.categories.split(',').filter(Boolean) : undefined,
    sources: typeof params.sources === 'string' ? params.sources.split(',').filter(Boolean) : undefined,
    priorityTier: typeof params.priorityTier === 'string' ? params.priorityTier : undefined,
    owner: typeof params.owner === 'string' ? params.owner : undefined,
    campaignBatch: typeof params.campaignBatch === 'string' ? params.campaignBatch : undefined,
    hasEmail: (params.hasEmail as 'yes' | 'no' | 'all') || undefined,
    hasLinkedin: (params.hasLinkedin as 'yes' | 'no' | 'all') || undefined,
    contactedStatus: (params.contactedStatus as 'all' | 'not_contacted' | 'contacted' | 'exported') || undefined,
    sizeMin: typeof params.sizeMin === 'string' ? Number(params.sizeMin) : undefined,
    sizeMax: typeof params.sizeMax === 'string' ? Number(params.sizeMax) : undefined,
    dateImportedFrom: typeof params.dateImportedFrom === 'string' ? params.dateImportedFrom : undefined,
    dateImportedTo: typeof params.dateImportedTo === 'string' ? params.dateImportedTo : undefined,
    lastContactedFrom: typeof params.lastContactedFrom === 'string' ? params.lastContactedFrom : undefined,
    lastContactedTo: typeof params.lastContactedTo === 'string' ? params.lastContactedTo : undefined,
    sortBy: typeof params.sortBy === 'string' ? params.sortBy : 'last_name',
    sortDir: (params.sortDir as 'asc' | 'desc') || 'asc',
    page: typeof params.page === 'string' ? Number(params.page) : 1,
    perPage: 50,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#F5C518]/10 p-2">
            <Users className="h-5 w-5 text-[#F5C518]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">Contacts</h1>
            <p className="text-sm text-[#6B7280]">Manage your 50K+ contact database</p>
          </div>
        </div>
        <ViewToggle current={view} />
      </div>

      {/* Search */}
      <ContactSearch />

      {/* Main content */}
      {view === 'table' ? (
        <div className="flex gap-6">
          {/* Filters sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-20 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm">
              <Suspense fallback={
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-6 animate-pulse rounded bg-[#F0F0F0]" />
                  ))}
                </div>
              }>
                <FilterPanel />
              </Suspense>
            </div>
          </aside>

          {/* Table */}
          <div className="flex-1 min-w-0">
            <Suspense fallback={<TableSkeleton />}>
              <ContactsTableContent filters={filters} filterParams={new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => typeof v === 'string') as [string, string][])).toString()} />
            </Suspense>
          </div>
        </div>
      ) : (
        <Suspense fallback={<KanbanSkeleton />}>
          <KanbanContent
            category={typeof params.categories === 'string' ? params.categories : undefined}
            owner={typeof params.owner === 'string' ? params.owner : undefined}
          />
        </Suspense>
      )}
    </div>
  )
}
