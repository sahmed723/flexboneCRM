import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { fetchPipelineData, fetchDistinctOwners } from '@/lib/queries/contacts'
import { KanbanBoard } from '@/components/contacts/kanban-board'
import { PipelineFilters } from '@/components/contacts/pipeline-filters'
import { GitBranch } from 'lucide-react'

export const runtime = 'edge'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="w-[270px] shrink-0 rounded-lg border border-[#E5E5E5] bg-[#F9FAFB]">
          <div className="border-b border-[#E5E5E5] px-3 py-3">
            <div className="h-4 w-20 animate-pulse rounded bg-[#E5E5E5]" />
          </div>
          <div className="p-2 space-y-2">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="rounded-md border border-[#E5E5E5] bg-white p-3 space-y-2">
                <div className="h-3.5 w-24 animate-pulse rounded bg-[#E5E5E5]" />
                <div className="h-3 w-32 animate-pulse rounded bg-[#F0F0F0]" />
                <div className="h-3 w-16 animate-pulse rounded bg-[#F5F5F5]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

async function PipelineContent({ category, owner }: { category?: string; owner?: string }) {
  const supabase = await createClient()
  const { columns } = await fetchPipelineData(supabase, { category, owner })

  const totalContacts = columns.reduce((sum, col) => sum + col.count, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm text-[#6B7280]">
        <span><span className="font-medium text-[#374151]">{totalContacts.toLocaleString()}</span> total contacts in pipeline</span>
        <span className="text-[#E5E5E5]">|</span>
        {columns.map((col) => (
          <span key={col.stage}>
            {col.label}: <span className="font-medium text-[#374151]">{col.count.toLocaleString()}</span>
          </span>
        ))}
      </div>
      <KanbanBoard columns={columns} />
    </div>
  )
}

async function FiltersContent() {
  const supabase = await createClient()
  const owners = await fetchDistinctOwners(supabase)
  return <PipelineFilters owners={owners} />
}

export default async function PipelinePage({ searchParams }: PageProps) {
  const params = await searchParams
  const category = typeof params.category === 'string' ? params.category : undefined
  const owner = typeof params.owner === 'string' ? params.owner : undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#F5C518]/10 p-2">
            <GitBranch className="h-5 w-5 text-[#F5C518]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">Pipeline</h1>
            <p className="text-sm text-[#6B7280]">Drag contacts between stages to update</p>
          </div>
        </div>
        <Suspense fallback={<div className="h-9 w-64 animate-pulse rounded bg-[#E5E5E5]" />}>
          <FiltersContent />
        </Suspense>
      </div>

      {/* Kanban */}
      <Suspense fallback={<KanbanSkeleton />}>
        <PipelineContent category={category} owner={owner} />
      </Suspense>
    </div>
  )
}
