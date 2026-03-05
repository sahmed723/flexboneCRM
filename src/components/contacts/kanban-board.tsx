'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CategoryBadge } from '@/components/ui/category-badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import type { PipelineColumn, PipelineCard } from '@/lib/queries/contacts'

const STAGE_COLORS: Record<string, string> = {
  new: '#64748B',
  contacted: '#3B82F6',
  qualified: '#6366F1',
  demo_scheduled: '#8B5CF6',
  proposal_sent: '#F59E0B',
  negotiation: '#F97316',
  closed_won: '#10B981',
}

interface KanbanBoardProps {
  columns: PipelineColumn[]
}

export function KanbanBoard({ columns }: KanbanBoardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [draggedCard, setDraggedCard] = useState<{ card: PipelineCard; fromStage: string } | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)

  const handleDragStart = (card: PipelineCard, fromStage: string) => {
    setDraggedCard({ card, fromStage })
  }

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault()
    setDragOverStage(stage)
  }

  const handleDragLeave = () => {
    setDragOverStage(null)
  }

  const handleDrop = async (e: React.DragEvent, toStage: string) => {
    e.preventDefault()
    setDragOverStage(null)

    if (!draggedCard || draggedCard.fromStage === toStage) {
      setDraggedCard(null)
      return
    }

    // Optimistic update would go here
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('contacts') as any).update({ stage: toStage }).eq('id', draggedCard.card.id)
    setDraggedCard(null)
    router.refresh()
  }

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4" style={{ minWidth: columns.length * 290 }}>
        {columns.map((col) => (
          <div
            key={col.stage}
            className={`w-[270px] shrink-0 rounded-lg border bg-[#F9FAFB] transition-colors ${
              dragOverStage === col.stage
                ? 'border-[#F5C518] bg-[#F5C518]/5'
                : 'border-[#E5E5E5]'
            }`}
            onDragOver={(e) => handleDragOver(e, col.stage)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.stage)}
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-[#E5E5E5]">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: STAGE_COLORS[col.stage] || '#6B7280' }}
                />
                <span className="text-sm font-semibold text-[#1A1A2E]">{col.label}</span>
              </div>
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#E5E5E5] px-1.5 text-[10px] font-semibold text-[#6B7280] tabular-nums">
                {col.count.toLocaleString()}
              </span>
            </div>

            {/* Cards */}
            <div className="p-2 space-y-2 min-h-[120px] max-h-[calc(100vh-320px)] overflow-y-auto">
              {col.contacts.map((card) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={() => handleDragStart(card, col.stage)}
                  className={`rounded-md border border-[#E5E5E5] bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-[#D1D5DB] hover:shadow transition-all ${
                    draggedCard?.card.id === card.id ? 'opacity-40' : ''
                  }`}
                >
                  <Link href={`/dashboard/contacts/${card.id}`} className="block">
                    <p className="text-sm font-medium text-[#0A0A0A] hover:text-[#F5C518] transition-colors">
                      {card.first_name} {card.last_name || ''}
                    </p>
                    {card.company_name && (
                      <p className="text-xs text-[#6B7280] mt-0.5 truncate">{card.company_name}</p>
                    )}
                    {card.title && (
                      <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">{card.title}</p>
                    )}
                  </Link>
                  <div className="flex items-center justify-between mt-2">
                    <CategoryBadge category={card.flexbone_category} />
                    {card.owner && (
                      <span className="text-[10px] text-[#9CA3AF]">{card.owner.split(' ')[0]}</span>
                    )}
                  </div>
                </div>
              ))}
              {col.contacts.length === 0 && (
                <div className="flex items-center justify-center h-20 text-xs text-[#9CA3AF]">
                  No contacts
                </div>
              )}
              {col.count > col.contacts.length && (
                <p className="text-center text-[10px] text-[#9CA3AF] py-1">
                  +{(col.count - col.contacts.length).toLocaleString()} more
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
