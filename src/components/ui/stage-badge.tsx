import { cn } from '@/lib/utils'
import type { ContactStage } from '@/lib/supabase/types'

const STAGE_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  new:             { bg: 'bg-slate-100',   text: 'text-slate-700',   label: 'New' },
  contacted:       { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'Contacted' },
  qualified:       { bg: 'bg-indigo-100',  text: 'text-indigo-700',  label: 'Qualified' },
  demo_scheduled:  { bg: 'bg-violet-100',  text: 'text-violet-700',  label: 'Demo Scheduled' },
  proposal_sent:   { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Proposal Sent' },
  negotiation:     { bg: 'bg-orange-100',  text: 'text-orange-700',  label: 'Negotiation' },
  closed_won:      { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Closed Won' },
  closed_lost:     { bg: 'bg-red-100',     text: 'text-red-700',     label: 'Closed Lost' },
  churned:         { bg: 'bg-gray-100',    text: 'text-gray-500',    label: 'Churned' },
}

interface StageBadgeProps {
  stage: ContactStage | string | null
  className?: string
}

export function StageBadge({ stage, className }: StageBadgeProps) {
  if (!stage) return null

  const config = STAGE_CONFIG[stage] || { bg: 'bg-gray-100', text: 'text-gray-600', label: stage }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        config.bg,
        config.text,
        className
      )}
    >
      {config.label}
    </span>
  )
}

export { STAGE_CONFIG }
