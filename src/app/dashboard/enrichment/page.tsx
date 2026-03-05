import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Sparkles, Zap, Building2, Users, Clock } from 'lucide-react'
import { EnrichmentActions } from '@/components/enrichment/enrichment-actions'
import { BatchProgress } from '@/components/enrichment/batch-progress'

export const runtime = 'edge'

interface EnrichmentJob {
  id: string
  company_id: string | null
  contact_id: string | null
  job_type: string
  status: string
  model_used: string
  tokens_used: number | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

async function EnrichmentStats() {
  const supabase = await createClient()

  const [
    { count: totalJobs },
    { count: completedJobs },
    { count: enrichedCompanies },
    { data: tokenData },
  ] = await Promise.all([
    supabase.from('ai_enrichment_jobs').select('*', { count: 'exact', head: true }),
    supabase.from('ai_enrichment_jobs').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('company_enrichments').select('*', { count: 'exact', head: true }),
    supabase.from('ai_enrichment_jobs').select('tokens_used').eq('status', 'completed'),
  ])

  const totalTokens = (tokenData || []).reduce(
    (sum, row) => sum + ((row as { tokens_used: number | null }).tokens_used || 0),
    0
  )

  const stats = [
    { label: 'Total Jobs', value: (totalJobs || 0).toLocaleString(), icon: Zap },
    { label: 'Completed', value: (completedJobs || 0).toLocaleString(), icon: Sparkles },
    { label: 'Enriched Companies', value: (enrichedCompanies || 0).toLocaleString(), icon: Building2 },
    { label: 'Tokens Used', value: totalTokens.toLocaleString(), icon: Clock },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <stat.icon className="h-4 w-4" />
            {stat.label}
          </div>
          <p className="mt-1 text-2xl font-bold text-[#1A1A2E]">{stat.value}</p>
        </div>
      ))}
    </div>
  )
}

async function RecentJobs() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('ai_enrichment_jobs')
    .select('id, company_id, contact_id, job_type, status, model_used, tokens_used, error_message, created_at, completed_at')
    .order('created_at', { ascending: false })
    .limit(20)

  const jobs = (data || []) as EnrichmentJob[]

  // Fetch related names
  const companyIds = jobs.filter(j => j.company_id).map(j => j.company_id!)
  const contactIds = jobs.filter(j => j.contact_id).map(j => j.contact_id!)

  let companyNames: Record<string, string> = {}
  let contactNames: Record<string, string> = {}

  if (companyIds.length > 0) {
    const { data: companies } = await supabase
      .from('companies')
      .select('id, company_name')
      .in('id', companyIds)
    companyNames = Object.fromEntries(
      (companies || []).map((c: Record<string, unknown>) => [c.id, c.company_name as string])
    )
  }

  if (contactIds.length > 0) {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .in('id', contactIds)
    contactNames = Object.fromEntries(
      (contacts || []).map((c: Record<string, unknown>) => [c.id, `${c.first_name} ${c.last_name || ''}`.trim()])
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-lg border border-[#E5E5E5] bg-white p-12 text-center shadow-sm">
        <Sparkles className="mx-auto h-10 w-10 text-[#D1D5DB]" />
        <h3 className="mt-3 text-sm font-semibold text-[#374151]">No enrichment jobs yet</h3>
        <p className="mt-1 text-sm text-[#9CA3AF]">Use the buttons above to start enriching companies and contacts</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E5E5E5] bg-[#F9FAFB]">
            <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Type</th>
            <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Target</th>
            <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Status</th>
            <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Model</th>
            <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Tokens</th>
            <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Date</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const targetName = job.company_id
              ? companyNames[job.company_id] || 'Unknown company'
              : job.contact_id
              ? contactNames[job.contact_id] || 'Unknown contact'
              : 'Batch job'

            return (
              <tr key={job.id} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA]">
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    {job.job_type.includes('company') ? (
                      <Building2 className="h-3.5 w-3.5 text-blue-500" />
                    ) : job.job_type.includes('contact') ? (
                      <Users className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Zap className="h-3.5 w-3.5 text-purple-500" />
                    )}
                    <span className="text-[#374151]">
                      {job.job_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 text-[#6B7280] max-w-[200px] truncate">{targetName}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    job.status === 'completed' ? 'bg-green-50 text-green-700' :
                    job.status === 'processing' ? 'bg-blue-50 text-blue-700' :
                    job.status === 'failed' ? 'bg-red-50 text-red-700' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs font-mono text-[#9CA3AF]">{job.model_used}</td>
                <td className="px-4 py-3 text-[#6B7280]">
                  {job.tokens_used?.toLocaleString() || '—'}
                </td>
                <td className="px-4 py-3 text-xs text-[#9CA3AF]">
                  {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

async function UnenrichedCompanies() {
  const supabase = await createClient()

  // Get companies that don't have enrichments
  const { data: allCompanies } = await supabase
    .from('companies')
    .select('id')

  const { data: enriched } = await supabase
    .from('company_enrichments')
    .select('company_id')

  const enrichedSet = new Set((enriched || []).map((e: Record<string, unknown>) => e.company_id as string))
  const unenrichedCount = (allCompanies || []).filter(
    (c: Record<string, unknown>) => !enrichedSet.has(c.id as string)
  ).length

  const totalCount = allCompanies?.length || 0

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-[#374151] mb-3">Enrichment Coverage</h3>
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-[#6B7280]">Companies enriched</span>
            <span className="font-medium text-[#374151]">
              {enrichedSet.size} / {totalCount}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#F0F0F0]">
            <div
              className="h-2 rounded-full bg-[#F5C518]"
              style={{ width: `${totalCount > 0 ? (enrichedSet.size / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-[#9CA3AF]">
          {unenrichedCount > 0
            ? `${unenrichedCount} companies still need enrichment`
            : 'All companies have been enriched'
          }
        </p>
      </div>
    </div>
  )
}

export default async function EnrichmentPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#F5C518]/10 p-2">
            <Sparkles className="h-5 w-5 text-[#F5C518]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">AI Enrichment</h1>
            <p className="text-sm text-[#6B7280]">Enrich companies and contacts with AI-powered intelligence</p>
          </div>
        </div>
      </div>

      {/* Action cards */}
      <EnrichmentActions />

      {/* Stats */}
      <Suspense fallback={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm">
              <div className="h-4 w-20 animate-pulse rounded bg-[#E5E5E5]" />
              <div className="mt-2 h-8 w-16 animate-pulse rounded bg-[#F0F0F0]" />
            </div>
          ))}
        </div>
      }>
        <EnrichmentStats />
      </Suspense>

      {/* Coverage */}
      <Suspense fallback={
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm">
          <div className="h-4 w-40 animate-pulse rounded bg-[#E5E5E5]" />
          <div className="mt-3 h-2 animate-pulse rounded-full bg-[#F0F0F0]" />
        </div>
      }>
        <UnenrichedCompanies />
      </Suspense>

      {/* Batch Progress */}
      <BatchProgress />

      {/* Recent jobs */}
      <div>
        <h2 className="text-sm font-semibold text-[#374151] mb-3">Recent Enrichment Jobs</h2>
        <Suspense fallback={
          <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-5 border-b border-[#F5F5F5] px-4 py-3">
                {[80, 150, 60, 80, 50, 90].map((w, j) => (
                  <div key={j} className="h-4 animate-pulse rounded bg-[#F0F0F0]" style={{ width: w }} />
                ))}
              </div>
            ))}
          </div>
        }>
          <RecentJobs />
        </Suspense>
      </div>
    </div>
  )
}
