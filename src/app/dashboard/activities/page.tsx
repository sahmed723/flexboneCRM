import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { fetchActivities, fetchActivityStats, type ActivityFilters } from '@/lib/queries/activities'
import { fetchDistinctOwners } from '@/lib/queries/contacts'
import { ActivityFilters as ActivityFiltersPanel } from '@/components/activities/activity-filters'
import { ActivityTimeline } from '@/components/activities/activity-timeline'
import { Activity as ActivityIcon, Plus } from 'lucide-react'

export const runtime = 'edge'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex gap-4 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-[#E5E5E5]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 animate-pulse rounded bg-[#E5E5E5]" />
            <div className="h-3 w-72 animate-pulse rounded bg-[#F0F0F0]" />
            <div className="h-3 w-24 animate-pulse rounded bg-[#F5F5F5]" />
          </div>
        </div>
      ))}
    </div>
  )
}

async function StatsBar() {
  const supabase = await createClient()
  const { stats, total } = await fetchActivityStats(supabase)

  return (
    <div className="flex items-center gap-4 text-sm text-[#6B7280] flex-wrap">
      <span><span className="font-medium text-[#374151]">{total.toLocaleString()}</span> total activities</span>
      <span className="text-[#E5E5E5]">|</span>
      {Object.entries(stats).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
        <span key={type}>
          {type}: <span className="font-medium text-[#374151]">{count.toLocaleString()}</span>
        </span>
      ))}
    </div>
  )
}

async function TimelineContent({ filters }: { filters: ActivityFilters }) {
  const supabase = await createClient()
  const { data, count } = await fetchActivities(supabase, filters)
  const page = filters.page || 1
  const perPage = filters.perPage || 30
  const totalPages = Math.ceil((count || 0) / perPage)

  return (
    <div className="space-y-4">
      <ActivityTimeline activities={data} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#E5E5E5] pt-4">
          <p className="text-sm text-[#6B7280]">
            Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, count || 0)} of {count?.toLocaleString()}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}`}
                className="rounded-md border border-[#E5E5E5] px-3 py-1.5 text-sm text-[#374151] hover:bg-[#F9FAFB]"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?page=${page + 1}`}
                className="rounded-md border border-[#E5E5E5] px-3 py-1.5 text-sm text-[#374151] hover:bg-[#F9FAFB]"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

async function FiltersContent() {
  const supabase = await createClient()
  const owners = await fetchDistinctOwners(supabase)
  return <ActivityFiltersPanel owners={owners} />
}

export default async function ActivitiesPage({ searchParams }: PageProps) {
  const params = await searchParams

  const filters: ActivityFilters = {
    activityTypes: typeof params.types === 'string' ? params.types.split(',').filter(Boolean) : undefined,
    userId: typeof params.userId === 'string' ? params.userId : undefined,
    dateFrom: typeof params.dateFrom === 'string' ? params.dateFrom : undefined,
    dateTo: typeof params.dateTo === 'string' ? params.dateTo : undefined,
    page: typeof params.page === 'string' ? Number(params.page) : 1,
    perPage: 30,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#F5C518]/10 p-2">
            <ActivityIcon className="h-5 w-5 text-[#F5C518]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">Activities</h1>
            <p className="text-sm text-[#6B7280]">Track all engagement across contacts and companies</p>
          </div>
        </div>
        <LogActivityButton />
      </div>

      {/* Stats */}
      <Suspense fallback={<div className="h-5 w-96 animate-pulse rounded bg-[#E5E5E5]" />}>
        <StatsBar />
      </Suspense>

      {/* Content */}
      <div className="flex gap-6">
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-20 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm">
            <Suspense fallback={
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-6 animate-pulse rounded bg-[#F0F0F0]" />
                ))}
              </div>
            }>
              <FiltersContent />
            </Suspense>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <Suspense fallback={<TimelineSkeleton />}>
            <TimelineContent filters={filters} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

// Client-side log button wrapper
function LogActivityButton() {
  return <LogActivityButtonClient />
}

import { LogActivityButtonClient } from '@/components/activities/log-activity-button'
