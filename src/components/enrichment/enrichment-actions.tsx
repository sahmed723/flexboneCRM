'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Building2, Users, Zap, Loader2, Search, Check, AlertCircle, Sparkles,
} from 'lucide-react'

interface CompanyOption {
  id: string
  company_name: string
  flexbone_category: string | null
}

export function EnrichmentActions() {
  const router = useRouter()

  // Single company enrichment
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false)
  const [companyQuery, setCompanyQuery] = useState('')
  const [companyResults, setCompanyResults] = useState<CompanyOption[]>([])
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(null)
  const [enriching, setEnriching] = useState(false)
  const [enrichResult, setEnrichResult] = useState<{ success: boolean; message: string } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Batch enrichment
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [batchRunning, setBatchRunning] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{ completed: number; failed: number; total: number } | null>(null)

  const supabase = createClient()

  const searchCompanies = useCallback(async (term: string) => {
    if (term.length < 2) { setCompanyResults([]); return }
    const { data } = await supabase
      .from('companies')
      .select('id, company_name, flexbone_category')
      .ilike('company_name', `%${term}%`)
      .order('company_name')
      .limit(10)

    setCompanyResults(
      (data || []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        company_name: c.company_name as string,
        flexbone_category: c.flexbone_category as string | null,
      }))
    )
  }, [supabase])

  useEffect(() => {
    if (companyQuery.length < 2) { setCompanyResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchCompanies(companyQuery), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [companyQuery, searchCompanies])

  const handleEnrichCompany = async () => {
    if (!selectedCompany) return
    setEnriching(true)
    setEnrichResult(null)

    try {
      const res = await fetch('/api/enrich/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: selectedCompany.id }),
      })

      const data = await res.json()

      if (res.ok) {
        setEnrichResult({
          success: true,
          message: `Enriched ${selectedCompany.company_name} with ${Object.keys(data.enrichment || {}).length} data points. ${data.tokens?.total?.toLocaleString()} tokens used.`,
        })
        router.refresh()
      } else {
        setEnrichResult({ success: false, message: data.error || 'Enrichment failed' })
      }
    } catch (error) {
      setEnrichResult({ success: false, message: (error as Error).message })
    }

    setEnriching(false)
  }

  const handleBatchEnrich = async () => {
    setBatchRunning(true)
    setBatchProgress(null)

    try {
      // Get unenriched companies
      const { data: allCompanies } = await supabase
        .from('companies')
        .select('id')

      const { data: enriched } = await supabase
        .from('company_enrichments')
        .select('company_id')

      const enrichedSet = new Set((enriched || []).map((e: Record<string, unknown>) => e.company_id as string))
      const unenriched = (allCompanies || [])
        .filter((c: Record<string, unknown>) => !enrichedSet.has(c.id as string))
        .map((c: Record<string, unknown>) => c.id as string)
        .slice(0, 50)

      if (unenriched.length === 0) {
        setBatchProgress({ completed: 0, failed: 0, total: 0 })
        setBatchRunning(false)
        return
      }

      const res = await fetch('/api/enrich/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyIds: unenriched, type: 'company' }),
      })

      const data = await res.json()
      setBatchProgress({
        completed: data.completed || 0,
        failed: data.failed || 0,
        total: data.total || unenriched.length,
      })
      router.refresh()
    } catch (error) {
      setBatchProgress({ completed: 0, failed: 1, total: 1 })
      console.error('Batch enrichment error:', error)
    }

    setBatchRunning(false)
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Enrich Company */}
        <button
          onClick={() => {
            setCompanyDialogOpen(true)
            setSelectedCompany(null)
            setCompanyQuery('')
            setEnrichResult(null)
          }}
          className="group rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm hover:border-[#F5C518] hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-blue-50 p-2 group-hover:bg-blue-100 transition-colors">
              <Building2 className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="text-sm font-semibold text-[#374151]">Enrich Company</h3>
          </div>
          <p className="text-xs text-[#9CA3AF]">
            Generate comprehensive intelligence for a single company using Claude Opus 4.6
          </p>
        </button>

        {/* Enrich Contact */}
        <button
          onClick={() => {
            // Could open a contact search dialog - for now link to contacts
            router.push('/dashboard/contacts')
          }}
          className="group rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm hover:border-[#F5C518] hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-green-50 p-2 group-hover:bg-green-100 transition-colors">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-sm font-semibold text-[#374151]">Research Contact</h3>
          </div>
          <p className="text-xs text-[#9CA3AF]">
            AI-powered research on a contact&apos;s role, pain points, and outreach strategy
          </p>
        </button>

        {/* Batch Enrich */}
        <button
          onClick={() => {
            setBatchDialogOpen(true)
            setBatchProgress(null)
          }}
          className="group rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm hover:border-[#F5C518] hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-purple-50 p-2 group-hover:bg-purple-100 transition-colors">
              <Zap className="h-5 w-5 text-purple-500" />
            </div>
            <h3 className="text-sm font-semibold text-[#374151]">Batch Enrich</h3>
          </div>
          <p className="text-xs text-[#9CA3AF]">
            Enrich up to 50 unenriched companies at once with 5 concurrent workers
          </p>
        </button>
      </div>

      {/* Single company enrichment dialog */}
      <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1A1A2E]">Enrich Company</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {selectedCompany ? (
              <div className="flex items-center justify-between rounded-md border border-[#E5E5E5] bg-[#F9FAFB] px-3 py-2.5">
                <div>
                  <span className="text-sm font-medium text-[#374151]">{selectedCompany.company_name}</span>
                  {selectedCompany.flexbone_category && (
                    <span className="text-xs text-[#9CA3AF] ml-2">{selectedCompany.flexbone_category}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedCompany(null); setCompanyQuery('') }}
                  className="text-xs text-[#6B7280] hover:text-[#374151]"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                <Input
                  value={companyQuery}
                  onChange={(e) => setCompanyQuery(e.target.value)}
                  placeholder="Search company name..."
                  className="pl-9 h-9 bg-white border-[#E5E5E5] text-sm"
                />
                {companyResults.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border border-[#E5E5E5] bg-white shadow-lg max-h-48 overflow-y-auto">
                    {companyResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCompany(c)
                          setCompanyResults([])
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[#F9FAFB]"
                      >
                        <span className="font-medium text-[#374151]">{c.company_name}</span>
                        {c.flexbone_category && (
                          <span className="text-xs text-[#9CA3AF]">{c.flexbone_category}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {enrichResult && (
              <div className={`flex items-start gap-2 rounded-md p-3 text-sm ${
                enrichResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {enrichResult.success ? (
                  <Check className="h-4 w-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                {enrichResult.message}
              </div>
            )}

            <p className="text-xs text-[#9CA3AF]">
              This will call Claude Opus 4.6 to generate comprehensive sales intelligence including
              facility analysis, CPT codes, technology stack, payer mix, competitors, and personalized
              outreach hooks.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCompanyDialogOpen(false)} className="text-sm">
              Close
            </Button>
            <Button
              onClick={handleEnrichCompany}
              disabled={enriching || !selectedCompany}
              className="bg-[#F5C518] text-[#0A0A0A] hover:bg-[#F5C518]/90 text-sm font-medium"
            >
              {enriching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enriching...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Enrich with AI
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch enrichment dialog */}
      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1A1A2E]">Batch Enrichment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm text-[#6B7280]">
              This will enrich up to 50 unenriched companies using Claude Opus 4.6.
              Processing uses 5 concurrent workers to stay within rate limits.
            </p>

            {batchProgress && (
              <div className="rounded-md border border-[#E5E5E5] p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6B7280]">Progress</span>
                  <span className="font-medium text-[#374151]">
                    {batchProgress.completed + batchProgress.failed} / {batchProgress.total}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#F0F0F0]">
                  <div
                    className="h-2 rounded-full bg-[#F5C518] transition-all"
                    style={{ width: `${batchProgress.total > 0 ? ((batchProgress.completed + batchProgress.failed) / batchProgress.total) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="text-green-600">{batchProgress.completed} completed</span>
                  {batchProgress.failed > 0 && (
                    <span className="text-red-600">{batchProgress.failed} failed</span>
                  )}
                </div>
                {batchProgress.total === 0 && (
                  <p className="text-xs text-[#9CA3AF]">All companies are already enriched.</p>
                )}
              </div>
            )}

            <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-700">
              <strong>Note:</strong> Batch enrichment uses a lightweight prompt for speed.
              For comprehensive 77-column enrichment, use the single company enrichment.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDialogOpen(false)} className="text-sm">
              Close
            </Button>
            <Button
              onClick={handleBatchEnrich}
              disabled={batchRunning}
              className="bg-[#F5C518] text-[#0A0A0A] hover:bg-[#F5C518]/90 text-sm font-medium"
            >
              {batchRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-1.5" />
                  Start Batch
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
