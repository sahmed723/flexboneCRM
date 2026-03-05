import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/ui/stat-card'
import { CategoryChart } from '@/components/dashboard/category-chart'
import { PipelineChart } from '@/components/dashboard/pipeline-chart'
import {
  Users,
  Building2,
  Sparkles,
  Megaphone,
  UserPlus,
  Building,
  Zap,
  Send,
} from 'lucide-react'
import Link from 'next/link'

export const runtime = 'edge'

// ─── Loading Skeletons ──────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-sm">
          <div className="space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-[#E5E5E5]" />
            <div className="h-8 w-20 animate-pulse rounded bg-[#E5E5E5]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-sm">
      <div className="h-5 w-40 animate-pulse rounded bg-[#E5E5E5] mb-6" />
      <div className="h-[300px] animate-pulse rounded bg-[#F5F5F5]" />
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-sm">
      <div className="h-5 w-40 animate-pulse rounded bg-[#E5E5E5] mb-6" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-[#E5E5E5]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 animate-pulse rounded bg-[#E5E5E5]" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-[#F0F0F0]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Server Data Components ─────────────────────────────────

async function StatsCards() {
  const supabase = await createClient()

  const [contactRes, companyRes, enrichedRes, campaignRes] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('company_enrichments').select('*', { count: 'exact', head: true }),
    supabase.from('campaign_batches').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Contacts"
        value={contactRes.count || 0}
        icon={Users}
        subtitle="All imported contacts"
      />
      <StatCard
        title="Total Companies"
        value={companyRes.count || 0}
        icon={Building2}
        subtitle="Unique organizations"
      />
      <StatCard
        title="Enriched Companies"
        value={enrichedRes.count || 0}
        icon={Sparkles}
        subtitle="AI-enriched profiles"
      />
      <StatCard
        title="Active Campaigns"
        value={campaignRes.count || 0}
        icon={Megaphone}
        subtitle="Running campaigns"
      />
    </div>
  )
}

async function CategoryBreakdown() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('contacts')
    .select('flexbone_category')
    .returns<{ flexbone_category: string | null }[]>()

  // Aggregate counts
  const counts: Record<string, number> = {}
  if (data) {
    for (const row of data) {
      const cat = row.flexbone_category || 'Uncategorized'
      counts[cat] = (counts[cat] || 0) + 1
    }
  }

  const chartData = Object.entries(counts)
    .filter(([cat]) => cat !== 'Uncategorized')
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-[#1A1A2E] mb-1">Contacts by Category</h3>
      <p className="text-sm text-[#9CA3AF] mb-4">Distribution across healthcare verticals</p>
      {chartData.length > 0 ? (
        <CategoryChart data={chartData} />
      ) : (
        <div className="flex h-[300px] items-center justify-center text-sm text-[#9CA3AF]">
          No category data available yet. Import contacts to see the breakdown.
        </div>
      )}
    </div>
  )
}

async function PipelineFunnel() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('contacts')
    .select('stage')
    .returns<{ stage: string | null }[]>()

  const counts: Record<string, number> = {}
  if (data) {
    for (const row of data) {
      const stage = row.stage || 'new'
      counts[stage] = (counts[stage] || 0) + 1
    }
  }

  const stageOrder = [
    'new', 'contacted', 'qualified', 'demo_scheduled',
    'proposal_sent', 'negotiation', 'closed_won', 'closed_lost', 'churned'
  ]

  const pipelineData = stageOrder
    .map(stage => ({ stage, count: counts[stage] || 0 }))
    .filter(d => d.count > 0)

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-[#1A1A2E] mb-1">Pipeline Overview</h3>
      <p className="text-sm text-[#9CA3AF] mb-4">Contact distribution by sales stage</p>
      {pipelineData.length > 0 ? (
        <PipelineChart data={pipelineData} />
      ) : (
        <div className="flex h-40 items-center justify-center text-sm text-[#9CA3AF]">
          No pipeline data yet. Contacts will appear here once imported.
        </div>
      )}
    </div>
  )
}

interface ActivityRow {
  id: string
  activity_type: string
  subject: string | null
  channel: string | null
  created_at: string
  contacts: { first_name: string; last_name: string | null } | null
  companies: { company_name: string } | null
}

async function RecentActivity() {
  const supabase = await createClient()

  const { data: activities } = await supabase
    .from('activities')
    .select(`
      id,
      activity_type,
      subject,
      channel,
      created_at,
      contacts (first_name, last_name),
      companies (company_name)
    `)
    .order('created_at', { ascending: false })
    .limit(8)
    .returns<ActivityRow[]>()

  const activityIcons: Record<string, string> = {
    email: '📧',
    call: '📞',
    linkedin: '💼',
    meeting: '📅',
    note: '📝',
    enrichment: '✨',
  }

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-[#1A1A2E] mb-1">Recent Activity</h3>
      <p className="text-sm text-[#9CA3AF] mb-4">Latest engagement across your team</p>
      {activities && activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <span className="text-lg mt-0.5">
                {activityIcons[activity.activity_type] || '📋'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#374151]">
                  <span className="font-medium">
                    {activity.contacts
                      ? `${activity.contacts.first_name} ${activity.contacts.last_name || ''}`.trim()
                      : 'Unknown'}
                  </span>
                  {activity.subject && (
                    <span className="text-[#6B7280]"> — {activity.subject}</span>
                  )}
                </p>
                <p className="text-xs text-[#9CA3AF]">
                  {activity.companies?.company_name || ''} · {new Date(activity.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center text-sm text-[#9CA3AF]">
          No activities yet. Actions will be logged here as your team works.
        </div>
      )}
    </div>
  )
}

// ─── Quick Actions ──────────────────────────────────────────

function QuickActions() {
  const actions = [
    { label: 'New Contact', href: '/dashboard/contacts/new', icon: UserPlus, color: 'bg-blue-500' },
    { label: 'New Company', href: '/dashboard/companies/new', icon: Building, color: 'bg-emerald-500' },
    { label: 'Run Enrichment', href: '/dashboard/enrichment', icon: Zap, color: 'bg-purple-500' },
    { label: 'New Campaign', href: '/dashboard/campaigns/new', icon: Send, color: 'bg-orange-500' },
  ]

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-[#1A1A2E] mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 rounded-lg border border-[#E5E5E5] p-3 hover:border-[#F5C518] hover:shadow-sm transition-all group"
          >
            <div className={`rounded-lg p-2 ${action.color}`}>
              <action.icon className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-[#374151] group-hover:text-[#0A0A0A]">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Dashboard Page ─────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let firstName = 'there'
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .single<{ full_name: string }>()

    if (profile?.full_name) {
      firstName = profile.full_name.split(' ')[0]
    } else if (user.email) {
      firstName = user.email.split('@')[0]
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Here&apos;s what&apos;s happening with your CRM today
        </p>
      </div>

      {/* Stats Row */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsCards />
      </Suspense>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <CategoryBreakdown />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <PipelineFunnel />
        </Suspense>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<ListSkeleton />}>
          <RecentActivity />
        </Suspense>
        <QuickActions />
      </div>
    </div>
  )
}
