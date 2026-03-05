import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { fetchCampaigns } from '@/lib/queries/campaigns'
import { Megaphone, Plus, Users, Calendar, ArrowRight } from 'lucide-react'
import { CreateCampaignButton } from '@/components/campaigns/create-campaign-button'

export const runtime = 'edge'

function CampaignsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm space-y-3">
          <div className="h-5 w-40 animate-pulse rounded bg-[#E5E5E5]" />
          <div className="h-3 w-24 animate-pulse rounded bg-[#F0F0F0]" />
          <div className="h-3 w-32 animate-pulse rounded bg-[#F5F5F5]" />
        </div>
      ))}
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  completed: 'bg-blue-50 text-blue-700',
  paused: 'bg-amber-50 text-amber-700',
  draft: 'bg-gray-50 text-gray-600',
}

async function CampaignsList() {
  const supabase = await createClient()
  const { data: campaigns } = await fetchCampaigns(supabase)

  if (campaigns.length === 0) {
    return (
      <div className="rounded-lg border border-[#E5E5E5] bg-white p-12 text-center shadow-sm">
        <Megaphone className="mx-auto h-10 w-10 text-[#D1D5DB]" />
        <h3 className="mt-3 text-sm font-semibold text-[#374151]">No campaigns yet</h3>
        <p className="mt-1 text-sm text-[#9CA3AF]">Create your first campaign to start organizing outreach</p>
      </div>
    )
  }

  const totalContacts = campaigns.reduce((sum, c) => sum + c.contact_count, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm text-[#6B7280]">
        <span><span className="font-medium text-[#374151]">{campaigns.length}</span> campaigns</span>
        <span className="text-[#E5E5E5]">|</span>
        <span><span className="font-medium text-[#374151]">{totalContacts.toLocaleString()}</span> total contacts</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <Link
            key={campaign.id}
            href={`/dashboard/campaigns/${campaign.id}`}
            className="group rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm hover:border-[#D1D5DB] hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-semibold text-[#374151] group-hover:text-[#1A1A2E]">
                {campaign.name}
              </h3>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[campaign.status] || STATUS_COLORS.draft}`}>
                {campaign.status}
              </span>
            </div>

            {campaign.description && (
              <p className="mt-2 text-xs text-[#6B7280] line-clamp-2">{campaign.description}</p>
            )}

            <div className="mt-4 flex items-center gap-4 text-xs text-[#9CA3AF]">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {campaign.contact_count.toLocaleString()} contacts
              </span>
              {campaign.start_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(campaign.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center text-xs font-medium text-[#F5C518] opacity-0 group-hover:opacity-100 transition-opacity">
              View details <ArrowRight className="h-3 w-3 ml-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default async function CampaignsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#F5C518]/10 p-2">
            <Megaphone className="h-5 w-5 text-[#F5C518]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">Campaigns</h1>
            <p className="text-sm text-[#6B7280]">Manage outreach campaigns and track performance</p>
          </div>
        </div>
        <CreateCampaignButton />
      </div>

      <Suspense fallback={<CampaignsSkeleton />}>
        <CampaignsList />
      </Suspense>
    </div>
  )
}
