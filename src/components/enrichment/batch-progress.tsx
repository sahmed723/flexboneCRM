'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Zap, Loader2, Check, AlertCircle, Building2 } from 'lucide-react'

interface BatchJob {
  id: string
  status: string
  completed_at: string | null
  output_data: { completed?: number; failed?: number; results?: unknown[] } | null
  created_at: string
}

interface CompanyPreview {
  id: string
  company_name: string
  flexbone_category: string | null
  state: string | null
}

const CATEGORIES = ['ASC', 'SNF', 'BPO', 'Health System', 'Insurer', 'Optometry', 'DSO', 'Newsletter', 'ASC Association']

export function BatchProgress() {
  const router = useRouter()
  const supabase = createClient()

  // Filters
  const [category, setCategory] = useState('all')
  const [previewCompanies, setPreviewCompanies] = useState<CompanyPreview[]>([])
  const [loadingPreview, setLoadingPreview] = useState(false)

  // Batch state
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<{ completed: number; failed: number; total: number } | null>(null)

  // Realtime subscription for job updates
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState<string | null>(null)

  const loadPreview = useCallback(async () => {
    setLoadingPreview(true)

    // Get all companies
    let query = supabase.from('companies').select('id, company_name, flexbone_category, state')

    if (category !== 'all') {
      query = query.eq('flexbone_category', category)
    }

    const { data: companies } = await query.order('company_name').limit(1000)

    // Get enriched company IDs
    const { data: enriched } = await supabase.from('company_enrichments').select('company_id')

    const enrichedSet = new Set((enriched || []).map((e: Record<string, unknown>) => e.company_id as string))

    const unenriched = (companies || [])
      .filter((c: Record<string, unknown>) => !enrichedSet.has(c.id as string))
      .map((c: Record<string, unknown>) => ({
        id: c.id as string,
        company_name: c.company_name as string,
        flexbone_category: c.flexbone_category as string | null,
        state: c.state as string | null,
      }))
      .slice(0, 50)

    setPreviewCompanies(unenriched)
    setLoadingPreview(false)
  }, [supabase, category])

  useEffect(() => {
    loadPreview()
  }, [loadPreview])

  // Supabase Realtime subscription
  useEffect(() => {
    if (!activeJobId) return

    const channel = supabase
      .channel(`enrichment-job-${activeJobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_enrichment_jobs',
          filter: `id=eq.${activeJobId}`,
        },
        (payload) => {
          const newRow = payload.new as BatchJob
          setRealtimeStatus(newRow.status)
          if (newRow.status === 'completed' || newRow.status === 'failed') {
            const output = newRow.output_data
            if (output) {
              setProgress({
                completed: output.completed || 0,
                failed: output.failed || 0,
                total: (output.completed || 0) + (output.failed || 0),
              })
            }
            setRunning(false)
            router.refresh()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeJobId, supabase, router])

  const handleStartBatch = async () => {
    if (previewCompanies.length === 0) return

    setRunning(true)
    setProgress(null)
    setRealtimeStatus('processing')

    try {
      const ids = previewCompanies.map((c) => c.id)

      const res = await fetch('/api/enrich/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyIds: ids, type: 'company' }),
      })

      const data = await res.json()

      if (data.batchJobId) {
        setActiveJobId(data.batchJobId)
      }

      setProgress({
        completed: data.completed || 0,
        failed: data.failed || 0,
        total: data.total || ids.length,
      })

      setRunning(false)
      setRealtimeStatus('completed')
      loadPreview()
      router.refresh()
    } catch (error) {
      console.error('Batch error:', error)
      setRunning(false)
      setRealtimeStatus('failed')
    }
  }

  const progressPct = progress && progress.total > 0
    ? ((progress.completed + progress.failed) / progress.total) * 100
    : 0

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-5 py-3.5">
        <Zap className="h-4 w-4 text-[#F5C518]" />
        <h3 className="text-sm font-semibold text-[#1A1A2E]">Batch Enrichment</h3>
      </div>

      <div className="p-5 space-y-4">
        {/* Filters */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-[#6B7280] mb-1 block">Filter by Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadPreview}
            disabled={loadingPreview}
            className="text-xs h-9"
          >
            Refresh Preview
          </Button>
        </div>

        {/* Preview */}
        {loadingPreview ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-[#9CA3AF] mr-2" />
            <span className="text-sm text-[#9CA3AF]">Loading companies...</span>
          </div>
        ) : previewCompanies.length > 0 ? (
          <div>
            <p className="text-xs text-[#6B7280] mb-2">
              <span className="font-medium text-[#374151]">{previewCompanies.length}</span> unenriched companies ready to process
            </p>
            <div className="max-h-48 overflow-y-auto rounded-md border border-[#E5E5E5]">
              {previewCompanies.map((c) => (
                <div key={c.id} className="flex items-center justify-between border-b border-[#F5F5F5] px-3 py-2 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="h-3.5 w-3.5 text-[#9CA3AF] shrink-0" />
                    <span className="text-sm text-[#374151] truncate">{c.company_name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.flexbone_category && (
                      <span className="text-[10px] text-[#9CA3AF]">{c.flexbone_category}</span>
                    )}
                    {c.state && (
                      <span className="text-[10px] text-[#D1D5DB]">{c.state}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            <Check className="mx-auto h-8 w-8 text-green-500 mb-2" />
            <p className="text-sm text-[#374151] font-medium">All companies enriched!</p>
            <p className="text-xs text-[#9CA3AF]">
              {category !== 'all' ? `All ${category} companies have been enriched` : 'Every company in the database has been enriched'}
            </p>
          </div>
        )}

        {/* Progress */}
        {progress && (
          <div className="rounded-md border border-[#E5E5E5] p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6B7280]">
                {realtimeStatus === 'processing' ? 'Processing...' : 'Complete'}
              </span>
              <span className="font-medium text-[#374151]">
                {progress.completed + progress.failed} / {progress.total}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-[#F0F0F0] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#F5C518] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-green-600">
                <Check className="h-3 w-3" /> {progress.completed} completed
              </span>
              {progress.failed > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="h-3 w-3" /> {progress.failed} failed
                </span>
              )}
            </div>
          </div>
        )}

        {/* Start button */}
        {previewCompanies.length > 0 && (
          <Button
            onClick={handleStartBatch}
            disabled={running}
            className="w-full bg-[#F5C518] text-[#0A0A0A] hover:bg-[#F5C518]/90 font-medium"
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Enriching {previewCompanies.length} companies...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-1.5" />
                Start Batch Enrichment ({previewCompanies.length} companies)
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
