import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchCampaignById, fetchCampaignContacts, fetchCampaignStageCounts } from '@/lib/queries/campaigns'
import { StageBadge } from '@/components/ui/stage-badge'
import { CategoryBadge } from '@/components/ui/category-badge'
import { ArrowLeft, Users, Calendar, BarChart3 } from 'lucide-react'

export const runtime = 'edge'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const STAGE_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  demo_scheduled: 'Demo Scheduled',
  proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
  churned: 'Churned',
}

function ContactsSkeleton() {
  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex gap-5 border-b border-[#F5F5F5] px-4 py-3">
          {[100, 80, 120, 150, 70].map((w, j) => (
            <div key={j} className="h-4 animate-pulse rounded bg-[#F0F0F0]" style={{ width: w }} />
          ))}
        </div>
      ))}
    </div>
  )
}

async function CampaignContactsTable({ campaignName, page }: { campaignName: string; page: number }) {
  const supabase = await createClient()
  const { data, count } = await fetchCampaignContacts(supabase, campaignName, { page, perPage: 50 })
  const totalPages = Math.ceil((count || 0) / 50)

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#F9FAFB]">
              <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Name</th>
              <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Title</th>
              <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Company</th>
              <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Email</th>
              <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Stage</th>
              <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Category</th>
            </tr>
          </thead>
          <tbody>
            {data.map((contact) => (
              <tr key={contact.id} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA] transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/contacts/${contact.id}`}
                    className="font-medium text-[#374151] hover:text-[#F5C518] transition-colors"
                  >
                    {contact.first_name} {contact.last_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[#6B7280]">{contact.title || '—'}</td>
                <td className="px-4 py-3 text-[#6B7280]">{contact.company_name || '—'}</td>
                <td className="px-4 py-3 text-[#6B7280]">{contact.email || '—'}</td>
                <td className="px-4 py-3"><StageBadge stage={contact.stage} /></td>
                <td className="px-4 py-3">
                  {contact.flexbone_category ? <CategoryBadge category={contact.flexbone_category} /> : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#6B7280]">
            Showing {((page - 1) * 50) + 1}–{Math.min(page * 50, count || 0)} of {count?.toLocaleString()}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`?page=${page - 1}`} className="rounded-md border border-[#E5E5E5] px-3 py-1.5 text-sm text-[#374151] hover:bg-[#F9FAFB]">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={`?page=${page + 1}`} className="rounded-md border border-[#E5E5E5] px-3 py-1.5 text-sm text-[#374151] hover:bg-[#F9FAFB]">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default async function CampaignDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const sp = await searchParams
  const page = typeof sp.page === 'string' ? Number(sp.page) : 1

  const supabase = await createClient()
  const { data: campaign, error } = await fetchCampaignById(supabase, id)

  if (error || !campaign) return notFound()

  const stageCounts = await fetchCampaignStageCounts(supabase, campaign.name)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/campaigns"
          className="inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#374151] mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to campaigns
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">{campaign.name}</h1>
            {campaign.description && (
              <p className="mt-1 text-sm text-[#6B7280]">{campaign.description}</p>
            )}
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${
            campaign.status === 'active' ? 'bg-green-50 text-green-700' :
            campaign.status === 'completed' ? 'bg-blue-50 text-blue-700' :
            'bg-gray-50 text-gray-600'
          }`}>
            {campaign.status}
          </span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <Users className="h-4 w-4" />
            Contacts
          </div>
          <p className="mt-1 text-2xl font-bold text-[#1A1A2E]">{campaign.contact_count.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <Calendar className="h-4 w-4" />
            Start Date
          </div>
          <p className="mt-1 text-2xl font-bold text-[#1A1A2E]">
            {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <BarChart3 className="h-4 w-4" />
            Created
          </div>
          <p className="mt-1 text-2xl font-bold text-[#1A1A2E]">
            {new Date(campaign.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stage breakdown */}
      {Object.keys(stageCounts).length > 0 && (
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[#374151] mb-3">Stage Breakdown</h2>
          <div className="flex items-center gap-6 flex-wrap text-sm">
            {Object.entries(stageCounts).sort((a, b) => b[1] - a[1]).map(([stage, count]) => (
              <div key={stage} className="flex items-center gap-2">
                <StageBadge stage={stage} />
                <span className="font-medium text-[#374151]">{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contacts table */}
      <div>
        <h2 className="text-sm font-semibold text-[#374151] mb-3">Campaign Contacts</h2>
        <Suspense fallback={<ContactsSkeleton />}>
          <CampaignContactsTable campaignName={campaign.name} page={page} />
        </Suspense>
      </div>
    </div>
  )
}
