'use client'

import Link from 'next/link'
import {
  Mail, Phone, Linkedin, Calendar, FileText, Sparkles,
} from 'lucide-react'
import type { ActivityListRow } from '@/lib/queries/activities'

const ACTIVITY_ICONS: Record<string, { icon: typeof Mail; color: string; bg: string }> = {
  email: { icon: Mail, color: 'text-blue-500', bg: 'bg-blue-50' },
  call: { icon: Phone, color: 'text-green-500', bg: 'bg-green-50' },
  linkedin: { icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-50' },
  meeting: { icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-50' },
  note: { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-50' },
  enrichment: { icon: Sparkles, color: 'text-[#F5C518]', bg: 'bg-[#F5C518]/10' },
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface ActivityTimelineProps {
  activities: ActivityListRow[]
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-lg border border-[#E5E5E5] bg-white p-12 text-center shadow-sm">
        <FileText className="mx-auto h-10 w-10 text-[#D1D5DB]" />
        <h3 className="mt-3 text-sm font-semibold text-[#374151]">No activities found</h3>
        <p className="mt-1 text-sm text-[#9CA3AF]">Activities will appear here as you log engagement</p>
      </div>
    )
  }

  return (
    <div className="relative space-y-3">
      {/* Timeline line */}
      <div className="absolute left-[23px] top-6 bottom-6 w-px bg-[#E5E5E5]" />

      {activities.map((act) => {
        const config = ACTIVITY_ICONS[act.activity_type] || ACTIVITY_ICONS.note
        const Icon = config.icon
        const contactName = act.contact_first_name
          ? `${act.contact_first_name} ${act.contact_last_name || ''}`.trim()
          : null

        return (
          <div key={act.id} className="relative flex gap-4 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm hover:border-[#D1D5DB] transition-colors">
            {/* Icon */}
            <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bg}`}>
              <Icon className={`h-4.5 w-4.5 ${config.color}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-sm font-semibold text-[#374151] capitalize">{act.activity_type}</span>
                  {act.channel && (
                    <span className="text-xs text-[#9CA3AF] ml-2">via {act.channel}</span>
                  )}
                </div>
                <span className="text-xs text-[#9CA3AF] shrink-0">{formatDate(act.created_at)}</span>
              </div>

              {act.subject && (
                <p className="mt-0.5 text-sm text-[#374151]">{act.subject}</p>
              )}

              {act.body && (
                <p className="mt-1 text-sm text-[#6B7280] line-clamp-2">{act.body}</p>
              )}

              <div className="mt-2 flex items-center gap-3 flex-wrap">
                {contactName && (
                  <Link
                    href={`/dashboard/contacts/${act.contact_id}`}
                    className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-medium text-[#374151] hover:bg-[#E5E7EB] transition-colors"
                  >
                    {contactName}
                  </Link>
                )}
                {act.company_name && (
                  <Link
                    href={`/dashboard/companies/${act.company_id}`}
                    className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-medium text-[#374151] hover:bg-[#E5E7EB] transition-colors"
                  >
                    {act.company_name}
                  </Link>
                )}
                {act.outcome && (
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    act.outcome === 'positive' ? 'bg-green-50 text-green-700' :
                    act.outcome === 'negative' ? 'bg-red-50 text-red-700' :
                    act.outcome === 'follow_up' ? 'bg-amber-50 text-amber-700' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {act.outcome.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
