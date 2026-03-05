import { createClient } from '@/lib/supabase/server'
import { Sparkles, CheckCircle2, XCircle, AlertTriangle, Database } from 'lucide-react'
import Link from 'next/link'

export const runtime = 'edge'

interface Check {
  label: string
  expected: string
  actual: string
  status: 'pass' | 'fail' | 'warn'
}

export default async function DataHealthPage() {
  const supabase = await createClient()

  const checks: Check[] = []

  // Total contacts
  const { count: contactCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })

  const totalContacts = contactCount || 0
  checks.push({
    label: 'Total contacts',
    expected: '~50,495',
    actual: totalContacts.toLocaleString(),
    status: totalContacts >= 50000 && totalContacts <= 51000 ? 'pass' : totalContacts > 0 ? 'warn' : 'fail',
  })

  // Total companies
  const { count: companyCount } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })

  const totalCompanies = companyCount || 0
  checks.push({
    label: 'Total companies',
    expected: '~6,333',
    actual: totalCompanies.toLocaleString(),
    status: totalCompanies >= 6000 && totalCompanies <= 6500 ? 'pass' : totalCompanies > 0 ? 'warn' : 'fail',
  })

  // Total enrichments
  const { count: enrichmentCount } = await supabase
    .from('company_enrichments')
    .select('*', { count: 'exact', head: true })

  const totalEnrichments = enrichmentCount || 0
  checks.push({
    label: 'Company enrichments',
    expected: '999',
    actual: totalEnrichments.toLocaleString(),
    status: totalEnrichments >= 999 ? 'pass' : totalEnrichments > 0 ? 'warn' : 'fail',
  })

  // Orphaned contacts — check if any contacts reference a non-existent company
  // Since FK constraints should prevent this, we just verify contacts have valid company_id
  const { count: contactsWithCompanyCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .not('company_id', 'is', null)

  const { count: nullCompanyCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .is('company_id', null)

  checks.push({
    label: 'Contacts with company link',
    expected: '>95%',
    actual: `${(contactsWithCompanyCount || 0).toLocaleString()} linked, ${(nullCompanyCount || 0).toLocaleString()} unlinked`,
    status: (nullCompanyCount || 0) < totalContacts * 0.05 ? 'pass' : 'warn',
  })

  // Contact stage distribution
  const stageResults: { stage: string; count: number }[] = []
  const stages = ['new', 'contacted', 'qualified', 'demo_scheduled', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost', 'churned']

  for (const stage of stages) {
    const { count: stageCount } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('stage', stage)
    stageResults.push({ stage, count: stageCount || 0 })
  }

  // Category distribution
  const categoryResults: { category: string; count: number }[] = []
  const categories = ['ASC', 'Optometry', 'SNF', 'DSO', 'BPO', 'Health System', 'Insurer', 'Newsletter', 'ASC Association']

  for (const cat of categories) {
    const { count: catCount } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('flexbone_category', cat)
    categoryResults.push({ category: cat, count: catCount || 0 })
  }

  const expectedCategories: Record<string, number> = {
    ASC: 7325, Optometry: 3121, SNF: 2087, DSO: 0, BPO: 0,
    'Health System': 0, Insurer: 0, Newsletter: 0, 'ASC Association': 0,
  }

  for (const cr of categoryResults) {
    const expected = expectedCategories[cr.category]
    if (expected && expected > 0) {
      const pct = Math.abs(cr.count - expected) / expected
      checks.push({
        label: `Category: ${cr.category}`,
        expected: expected.toLocaleString(),
        actual: cr.count.toLocaleString(),
        status: pct < 0.05 ? 'pass' : pct < 0.2 ? 'warn' : cr.count > 0 ? 'warn' : 'fail',
      })
    }
  }

  // Enrichment coverage
  const enrichPct = totalCompanies > 0 ? ((totalEnrichments / totalCompanies) * 100).toFixed(1) : '0'
  checks.push({
    label: 'Enrichment coverage',
    expected: '>15%',
    actual: `${enrichPct}%`,
    status: Number(enrichPct) >= 15 ? 'pass' : Number(enrichPct) > 0 ? 'warn' : 'fail',
  })

  const passCount = checks.filter((c) => c.status === 'pass').length
  const warnCount = checks.filter((c) => c.status === 'warn').length
  const failCount = checks.filter((c) => c.status === 'fail').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0A0A0A] mb-4 transition-colors"
        >
          &larr; Back to Settings
        </Link>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#F5C518]/10 p-2">
            <Database className="h-5 w-5 text-[#F5C518]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A2E]">Data Health</h1>
            <p className="text-sm text-[#6B7280]">Verify data integrity across the CRM</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">Passed</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-green-700">{passCount}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Warnings</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-amber-700">{warnCount}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-800">Failed</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-red-700">{failCount}</p>
        </div>
      </div>

      {/* Checks table */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#F9FAFB]">
              <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Check</th>
              <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Expected</th>
              <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Actual</th>
              <th className="px-4 py-3 text-left font-medium text-[#6B7280]">Status</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((check, i) => (
              <tr key={i} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA]">
                <td className="px-4 py-3 font-medium text-[#374151]">{check.label}</td>
                <td className="px-4 py-3 text-[#6B7280] tabular-nums">{check.expected}</td>
                <td className="px-4 py-3 text-[#374151] tabular-nums font-medium">{check.actual}</td>
                <td className="px-4 py-3">
                  {check.status === 'pass' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      <CheckCircle2 className="h-3 w-3" /> Pass
                    </span>
                  )}
                  {check.status === 'warn' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                      <AlertTriangle className="h-3 w-3" /> Warning
                    </span>
                  )}
                  {check.status === 'fail' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                      <XCircle className="h-3 w-3" /> Fail
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stage distribution */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-5 py-3.5">
          <Sparkles className="h-4 w-4 text-[#F5C518]" />
          <h3 className="text-sm font-semibold text-[#1A1A2E]">Contact Stage Distribution</h3>
        </div>
        <div className="p-5">
          <div className="space-y-2">
            {stageResults.map(({ stage, count }) => {
              const pct = totalContacts > 0 ? (count / totalContacts) * 100 : 0
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="w-32 text-sm text-[#6B7280] capitalize">{stage.replace(/_/g, ' ')}</span>
                  <div className="flex-1 h-5 rounded-full bg-[#F0F0F0] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#F5C518]"
                      style={{ width: `${Math.max(pct, 0.5)}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-sm tabular-nums font-medium text-[#374151]">
                    {count.toLocaleString()}
                  </span>
                  <span className="w-12 text-right text-xs text-[#9CA3AF]">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Category distribution */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-5 py-3.5">
          <Database className="h-4 w-4 text-[#F5C518]" />
          <h3 className="text-sm font-semibold text-[#1A1A2E]">Category Distribution</h3>
        </div>
        <div className="p-5">
          <div className="space-y-2">
            {categoryResults
              .sort((a, b) => b.count - a.count)
              .map(({ category, count }) => {
                const pct = totalContacts > 0 ? (count / totalContacts) * 100 : 0
                return (
                  <div key={category} className="flex items-center gap-3">
                    <span className="w-32 text-sm text-[#6B7280]">{category}</span>
                    <div className="flex-1 h-5 rounded-full bg-[#F0F0F0] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-400"
                        style={{ width: `${Math.max(pct, 0.5)}%` }}
                      />
                    </div>
                    <span className="w-20 text-right text-sm tabular-nums font-medium text-[#374151]">
                      {count.toLocaleString()}
                    </span>
                    <span className="w-12 text-right text-xs text-[#9CA3AF]">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
