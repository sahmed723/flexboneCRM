import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Download, FileSpreadsheet } from 'lucide-react'
import Link from 'next/link'

export const runtime = 'edge'

interface ExportRow {
  id: string
  exported_at: string
  contact_count: number
  filename: string
  filter_snapshot: Record<string, string> | null
}

export default async function ExportHistoryPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('campaign_exports')
    .select('id, exported_at, contact_count, filename, filter_snapshot')
    .order('exported_at', { ascending: false })
    .limit(50)

  const exports = (data || []) as ExportRow[]

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/settings" className="text-[#6B7280] hover:text-[#1A1A2E]">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="rounded-lg bg-[#F5C518]/10 p-2">
          <FileSpreadsheet className="h-5 w-5 text-[#F5C518]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1A1A2E]">Export History</h1>
          <p className="text-sm text-[#6B7280]">Track all CSV exports from the CRM</p>
        </div>
      </div>

      {exports.length === 0 ? (
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-12 text-center">
          <Download className="h-10 w-10 text-[#D1D5DB] mx-auto mb-3" />
          <p className="text-[#6B7280]">No exports yet. Export contacts from the Contacts page to see them here.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-[#E5E5E5] bg-white overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280] uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280] uppercase">Filename</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280] uppercase">Contacts</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#6B7280] uppercase">Filters Used</th>
              </tr>
            </thead>
            <tbody>
              {exports.map((exp) => (
                <tr key={exp.id} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA]">
                  <td className="px-4 py-3 text-sm text-[#374151] tabular-nums">
                    {new Date(exp.exported_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-[#374151]">{exp.filename}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[#1A1A2E]">{exp.contact_count.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {exp.filter_snapshot && Object.keys(exp.filter_snapshot).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(exp.filter_snapshot)
                          .filter(([k]) => !['page', 'perPage', 'sortBy', 'sortDir'].includes(k))
                          .map(([key, value]) => (
                            <span key={key} className="inline-flex items-center rounded-md bg-[#F0F0F0] px-2 py-0.5 text-xs text-[#374151]">
                              {key}: {String(value).slice(0, 30)}
                            </span>
                          ))}
                      </div>
                    ) : (
                      <span className="text-xs text-[#9CA3AF]">No filters</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
