import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { fetchCompanies, fetchDistinctStates, type CompanyFilters } from '@/lib/queries/companies'
import { CompanyTable } from '@/components/companies/company-table'
import { CompanyFilters as CompanyFiltersPanel } from '@/components/companies/company-filters'
import { CompanySearch } from '@/components/companies/company-search'
import { AddCompanySheet } from '@/components/companies/add-company-sheet'
import { Building2, Filter } from 'lucide-react'

export const runtime = 'edge'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function TableSkeleton() {
  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
      <div className="border-b border-[#F0F0F0] px-4 py-3">
        <div className="flex gap-4">
          {[120, 80, 100, 60, 100, 60, 60, 60].map((w, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-[#E5E5E5]" style={{ width: w }} />
          ))}
        </div>
      </div>
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-[#F5F5F5] px-4 py-3.5">
          {[140, 70, 90, 50, 110, 40, 40, 60].map((w, j) => (
            <div key={j} className="h-4 animate-pulse rounded bg-[#F0F0F0]" style={{ width: w }} />
          ))}
        </div>
      ))}
    </div>
  )
}

async function CompaniesContent({ filters }: { filters: CompanyFilters }) {
  const supabase = await createClient()
  const { data, count } = await fetchCompanies(supabase, filters)

  return (
    <CompanyTable
      data={data}
      totalCount={count}
      page={filters.page || 1}
      perPage={filters.perPage || 50}
    />
  )
}

async function FilterPanel() {
  const supabase = await createClient()
  const states = await fetchDistinctStates(supabase)
  return <CompanyFiltersPanel states={states} />
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const params = await searchParams

  const filters: CompanyFilters = {
    search: typeof params.search === 'string' ? params.search : undefined,
    categories: typeof params.categories === 'string' ? params.categories.split(',').filter(Boolean) : undefined,
    state: typeof params.state === 'string' ? params.state : undefined,
    sizeMin: typeof params.sizeMin === 'string' ? Number(params.sizeMin) : undefined,
    sizeMax: typeof params.sizeMax === 'string' ? Number(params.sizeMax) : undefined,
    enriched: (params.enriched as 'yes' | 'no' | 'all') || undefined,
    hasAsc: (params.hasAsc as 'yes' | 'no' | 'all') || undefined,
    sortBy: typeof params.sortBy === 'string' ? params.sortBy : 'company_name',
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
            <Building2 className="h-5 w-5 text-[#F5C518]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">Companies</h1>
            <p className="text-sm text-[#6B7280]">Manage your company database</p>
          </div>
        </div>
        <AddCompanySheet />
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3">
        <CompanySearch />
      </div>

      {/* Main content with sidebar filters */}
      <div className="flex gap-6">
        {/* Filters sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-20 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm">
            <Suspense fallback={
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-8 animate-pulse rounded bg-[#F0F0F0]" />
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
            <CompaniesContent filters={filters} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
