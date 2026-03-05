'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { exportToCSV } from '@/lib/export-csv'
import { Download, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function ExportContactsButton() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('contacts')
        .select('first_name, last_name, email, phone, title, stage, flexbone_category, company_id')
        .order('last_name')
        .limit(10000)

      if (error) throw error
      if (!data || data.length === 0) {
        toast.error('No contacts to export')
        return
      }

      exportToCSV(data as Record<string, unknown>[], 'flexbone-contacts', [
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'title', label: 'Title' },
        { key: 'stage', label: 'Stage' },
        { key: 'flexbone_category', label: 'Category' },
      ])
      toast.success(`Exported ${data.length.toLocaleString()} contacts`)
    } catch {
      toast.error('Failed to export contacts')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-md border border-[#E5E5E5] px-3 py-1.5 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      Export CSV
    </button>
  )
}

export function ExportCompaniesButton() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('companies')
        .select('company_name, city, state, phone, website, flexbone_category, contact_count')
        .order('company_name')
        .limit(10000)

      if (error) throw error
      if (!data || data.length === 0) {
        toast.error('No companies to export')
        return
      }

      exportToCSV(data as Record<string, unknown>[], 'flexbone-companies', [
        { key: 'company_name', label: 'Company Name' },
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State' },
        { key: 'phone', label: 'Phone' },
        { key: 'website', label: 'Website' },
        { key: 'flexbone_category', label: 'Category' },
        { key: 'contact_count', label: 'Contact Count' },
      ])
      toast.success(`Exported ${data.length.toLocaleString()} companies`)
    } catch {
      toast.error('Failed to export companies')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-md border border-[#E5E5E5] px-3 py-1.5 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      Export CSV
    </button>
  )
}
