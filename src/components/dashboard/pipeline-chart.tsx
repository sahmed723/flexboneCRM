'use client'

import { STAGE_CONFIG } from '@/components/ui/stage-badge'

interface PipelineChartProps {
  data: { stage: string; count: number }[]
}

const STAGE_COLORS: Record<string, string> = {
  new: '#64748B',
  contacted: '#3B82F6',
  qualified: '#6366F1',
  demo_scheduled: '#8B5CF6',
  proposal_sent: '#F59E0B',
  negotiation: '#F97316',
  closed_won: '#10B981',
  closed_lost: '#EF4444',
  churned: '#9CA3AF',
}

export function PipelineChart({ data }: PipelineChartProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const config = STAGE_CONFIG[item.stage]
        const percentage = (item.count / maxCount) * 100

        return (
          <div key={item.stage} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-[#374151]">
                {config?.label || item.stage}
              </span>
              <span className="tabular-nums text-[#6B7280]">
                {item.count.toLocaleString()}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[#F3F4F6]">
              <div
                className="h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(percentage, 1)}%`,
                  backgroundColor: STAGE_COLORS[item.stage] || '#6B7280',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
