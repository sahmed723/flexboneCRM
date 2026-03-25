'use client'

import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Upload, FileText, ArrowRight, Check, AlertTriangle, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// CRM fields that can be mapped
const CRM_FIELDS = [
  { key: 'first_name', label: 'First Name', required: true },
  { key: 'last_name', label: 'Last Name', required: false },
  { key: 'email', label: 'Email', required: true },
  { key: 'title', label: 'Title', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'linkedin', label: 'LinkedIn URL', required: false },
  { key: 'company_name', label: 'Company Name', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'state', label: 'State', required: false },
  { key: 'flexbone_category', label: 'Category', required: false },
  { key: 'source', label: 'Source', required: false },
  { key: 'stage', label: 'Stage', required: false },
] as const

type CrmFieldKey = typeof CRM_FIELDS[number]['key']

// Fuzzy matching for auto-mapping Apollo/generic CSV headers to CRM fields
const HEADER_ALIASES: Record<string, CrmFieldKey> = {
  'first name': 'first_name',
  'first_name': 'first_name',
  'firstname': 'first_name',
  'last name': 'last_name',
  'last_name': 'last_name',
  'lastname': 'last_name',
  'email': 'email',
  'email address': 'email',
  'work email': 'email',
  'title': 'title',
  'job title': 'title',
  'job_title': 'title',
  'position': 'title',
  'phone': 'phone',
  'phone number': 'phone',
  'work phone': 'phone',
  'direct phone': 'phone',
  'mobile phone': 'phone',
  'linkedin': 'linkedin',
  'linkedin url': 'linkedin',
  'linkedin_url': 'linkedin',
  'person linkedin url': 'linkedin',
  'company': 'company_name',
  'company name': 'company_name',
  'company_name': 'company_name',
  'organization': 'company_name',
  'city': 'city',
  'state': 'state',
  'state/region': 'state',
  'category': 'flexbone_category',
  'flexbone_category': 'flexbone_category',
  'source': 'source',
  'lead source': 'source',
  'stage': 'stage',
}

interface ParsedCSV {
  headers: string[]
  rows: string[][]
}

interface ImportResult {
  total: number
  inserted: number
  updated: number
  skipped: number
  errors: string[]
}

function parseCSV(text: string): ParsedCSV {
  const lines: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (current.length > 0 || lines.length > 0) {
        lines.push(current)
        current = ''
      }
      if (char === '\r' && text[i + 1] === '\n') i++
    } else {
      current += char
    }
  }
  if (current.length > 0) lines.push(current)

  if (lines.length === 0) return { headers: [], rows: [] }

  const splitRow = (line: string): string[] => {
    const cells: string[] = []
    let cell = ''
    let q = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (q && line[i + 1] === '"') { cell += '"'; i++ }
        else q = !q
      } else if (c === ',' && !q) {
        cells.push(cell.trim())
        cell = ''
      } else {
        cell += c
      }
    }
    cells.push(cell.trim())
    return cells
  }

  const headers = splitRow(lines[0])
  const rows = lines.slice(1).map(splitRow).filter(r => r.some(c => c.length > 0))

  return { headers, rows }
}

function autoMapHeaders(headers: string[]): Record<number, CrmFieldKey | ''> {
  const mapping: Record<number, CrmFieldKey | ''> = {}
  const usedFields = new Set<CrmFieldKey>()

  headers.forEach((header, idx) => {
    const normalized = header.toLowerCase().trim()
    const match = HEADER_ALIASES[normalized]
    if (match && !usedFields.has(match)) {
      mapping[idx] = match
      usedFields.add(match)
    } else {
      mapping[idx] = ''
    }
  })

  return mapping
}

export default function ImportPage() {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'done'>('upload')
  const [csv, setCsv] = useState<ParsedCSV | null>(null)
  const [fileName, setFileName] = useState('')
  const [mapping, setMapping] = useState<Record<number, CrmFieldKey | ''>>({})
  const [dupAction, setDupAction] = useState<'skip' | 'update'>('skip')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a .csv file')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.headers.length === 0) {
        toast.error('Could not parse CSV')
        return
      }
      setCsv(parsed)
      setMapping(autoMapHeaders(parsed.headers))
      setStep('mapping')
    }
    reader.readAsText(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleColumnMap = (colIdx: number, field: CrmFieldKey | '') => {
    setMapping(prev => ({ ...prev, [colIdx]: field }))
  }

  const mappedCount = Object.values(mapping).filter(Boolean).length
  const hasEmail = Object.values(mapping).includes('email')
  const hasFirstName = Object.values(mapping).includes('first_name')

  const handleImport = async () => {
    if (!csv) return
    setStep('importing')
    setProgress(0)

    const supabase = createClient()
    const importResult: ImportResult = { total: csv.rows.length, inserted: 0, updated: 0, skipped: 0, errors: [] }

    // Build rows from mapping
    const emailIdx = Object.entries(mapping).find(([, v]) => v === 'email')?.[0]
    if (emailIdx === undefined) {
      toast.error('Email mapping is required')
      setStep('mapping')
      return
    }

    const BATCH_SIZE = 500
    const batches: Record<string, unknown>[][] = []

    for (let i = 0; i < csv.rows.length; i += BATCH_SIZE) {
      const batchRows = csv.rows.slice(i, i + BATCH_SIZE)
      const records: Record<string, unknown>[] = []

      for (const row of batchRows) {
        const record: Record<string, unknown> = {}
        let hasValidEmail = false

        for (const [colIdxStr, field] of Object.entries(mapping)) {
          if (!field) continue
          const colIdx = parseInt(colIdxStr)
          const value = row[colIdx]?.trim() || ''
          if (field === 'email') {
            if (!value || !value.includes('@')) continue
            hasValidEmail = true
          }
          if (value) record[field] = value
        }

        // Handle company_name: look up or skip (will be resolved later)
        if (record.company_name) {
          record.original_company_name = record.company_name
          delete record.company_name
        }

        if (!hasValidEmail) {
          importResult.skipped++
          continue
        }

        // Set defaults
        if (!record.source) record.source = 'Import'
        if (!record.stage) record.stage = 'new'

        records.push(record)
      }

      if (records.length > 0) batches.push(records)
    }

    // Process batches
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]

      try {
        if (dupAction === 'update') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, error } = await (supabase.from('contacts') as any)
            .upsert(batch, { onConflict: 'email', ignoreDuplicates: false })
            .select('id')

          if (error) {
            importResult.errors.push(`Batch ${i + 1}: ${error.message}`)
          } else {
            importResult.inserted += (data?.length || 0)
          }
        } else {
          // Skip duplicates
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, error } = await (supabase.from('contacts') as any)
            .upsert(batch, { onConflict: 'email', ignoreDuplicates: true })
            .select('id')

          if (error) {
            importResult.errors.push(`Batch ${i + 1}: ${error.message}`)
          } else {
            importResult.inserted += (data?.length || 0)
            importResult.skipped += batch.length - (data?.length || 0)
          }
        }
      } catch (err) {
        importResult.errors.push(`Batch ${i + 1}: ${(err as Error).message}`)
      }

      setProgress(Math.round(((i + 1) / batches.length) * 100))
    }

    // Log the import activity
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('activities') as any).insert({
        activity_type: 'import',
        subject: `CSV Import: ${fileName}`,
        body: `Imported ${importResult.inserted} contacts (${importResult.skipped} skipped, ${importResult.errors.length} errors) from ${fileName}`,
        metadata: {
          filename: fileName,
          total: importResult.total,
          inserted: importResult.inserted,
          updated: importResult.updated,
          skipped: importResult.skipped,
          errors: importResult.errors.length,
        },
      })
    } catch {
      // Non-critical
    }

    setResult(importResult)
    setStep('done')
  }

  const reset = () => {
    setStep('upload')
    setCsv(null)
    setFileName('')
    setMapping({})
    setResult(null)
    setProgress(0)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[#F5C518]/10 p-2">
          <Upload className="h-5 w-5 text-[#F5C518]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1A1A2E]">Import Contacts</h1>
          <p className="text-sm text-[#6B7280]">Upload a CSV file to import contacts into the CRM</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {['Upload', 'Map Columns', 'Preview & Import', 'Done'].map((label, i) => {
          const stepNames = ['upload', 'mapping', 'preview', 'done'] as const
          const isActive = stepNames.indexOf(step === 'importing' ? 'preview' : step) >= i
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <ArrowRight className="h-3 w-3 text-[#D1D5DB]" />}
              <span className={isActive ? 'font-medium text-[#1A1A2E]' : 'text-[#9CA3AF]'}>{label}</span>
            </div>
          )
        })}
      </div>

      {/* Upload step */}
      {step === 'upload' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-[#F5C518] bg-[#F5C518]/5' : 'border-[#E5E5E5] hover:border-[#F5C518]/50 bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
          <FileText className="h-12 w-12 text-[#D1D5DB] mx-auto mb-4" />
          <p className="text-lg font-medium text-[#374151]">Drop your CSV file here</p>
          <p className="text-sm text-[#6B7280] mt-1">or click to browse. Works with Apollo, Instantly, and generic CSV exports.</p>
        </div>
      )}

      {/* Mapping step */}
      {step === 'mapping' && csv && (
        <div className="space-y-4">
          <div className="rounded-lg border border-[#E5E5E5] bg-white p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-[#1A1A2E]">Column Mapping</h3>
                <p className="text-sm text-[#6B7280]">{csv.headers.length} columns detected, {mappedCount} mapped. {csv.rows.length.toLocaleString()} rows.</p>
              </div>
              <div className="flex items-center gap-2">
                {!hasEmail && <span className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Email required</span>}
                {!hasFirstName && <span className="text-xs text-amber-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> First Name recommended</span>}
              </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {csv.headers.map((header, idx) => (
                <div key={idx} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-[#FAFAFA]">
                  <span className="text-sm font-mono text-[#374151] w-48 truncate" title={header}>{header}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#D1D5DB] shrink-0" />
                  <Select value={mapping[idx] || '_skip'} onValueChange={(v) => handleColumnMap(idx, v === '_skip' ? '' : v as CrmFieldKey)}>
                    <SelectTrigger className="w-48 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_skip">-- Skip --</SelectItem>
                      {CRM_FIELDS.map((f) => (
                        <SelectItem key={f.key} value={f.key}>{f.label}{f.required ? ' *' : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mapping[idx] && (
                    <Check className="h-4 w-4 text-emerald-500" />
                  )}
                  <span className="text-xs text-[#9CA3AF] truncate flex-1">
                    {csv.rows[0]?.[idx] || ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={reset}>Back</Button>
            <Button
              onClick={() => setStep('preview')}
              disabled={!hasEmail}
              className="bg-[#1A1A2E] text-white hover:bg-[#2A2A3E]"
            >
              Next: Preview
            </Button>
          </div>
        </div>
      )}

      {/* Preview step */}
      {(step === 'preview' || step === 'importing') && csv && (
        <div className="space-y-4">
          <div className="rounded-lg border border-[#E5E5E5] bg-white p-4">
            <h3 className="font-medium text-[#1A1A2E] mb-3">Preview (first 5 rows)</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.entries(mapping).filter(([, v]) => v).map(([idx, field]) => (
                      <TableHead key={idx} className="text-xs">
                        {CRM_FIELDS.find(f => f.key === field)?.label || field}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csv.rows.slice(0, 5).map((row, ri) => (
                    <TableRow key={ri}>
                      {Object.entries(mapping).filter(([, v]) => v).map(([idx]) => (
                        <TableCell key={idx} className="text-sm py-2">
                          {row[parseInt(idx)] || <span className="text-[#D1D5DB]">-</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="rounded-lg border border-[#E5E5E5] bg-white p-4">
            <h3 className="font-medium text-[#1A1A2E] mb-3">Duplicate Handling</h3>
            <p className="text-sm text-[#6B7280] mb-3">When an email already exists in the CRM:</p>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={dupAction === 'skip'} onChange={() => setDupAction('skip')} className="accent-[#F5C518]" />
                <span className="text-sm">Skip duplicates</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={dupAction === 'update'} onChange={() => setDupAction('update')} className="accent-[#F5C518]" />
                <span className="text-sm">Update existing records</span>
              </label>
            </div>
          </div>

          {step === 'importing' && (
            <div className="rounded-lg border border-[#E5E5E5] bg-white p-4">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#F5C518]" />
                <span className="text-sm font-medium">Importing... {progress}%</span>
              </div>
              <div className="h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                <div className="h-full bg-[#F5C518] transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setStep('mapping')} disabled={step === 'importing'}>Back</Button>
            <Button
              onClick={handleImport}
              disabled={step === 'importing'}
              className="bg-[#1A1A2E] text-white hover:bg-[#2A2A3E]"
            >
              {step === 'importing' ? 'Importing...' : `Import ${csv.rows.length.toLocaleString()} Contacts`}
            </Button>
          </div>
        </div>
      )}

      {/* Done step */}
      {step === 'done' && result && (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
            <Check className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-[#1A1A2E]">Import Complete</h3>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div>
                <p className="text-2xl font-bold text-emerald-600">{result.inserted}</p>
                <p className="text-[#6B7280]">Imported</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-500">{result.skipped}</p>
                <p className="text-[#6B7280]">Skipped</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{result.errors.length}</p>
                <p className="text-[#6B7280]">Errors</p>
              </div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h4 className="text-sm font-medium text-red-800 mb-2">Errors</h4>
              <ul className="text-xs text-red-700 space-y-1">
                {result.errors.slice(0, 10).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {result.errors.length > 10 && <li>...and {result.errors.length - 10} more</li>}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={reset}>Import Another</Button>
            <Button
              onClick={() => window.location.href = '/dashboard/contacts'}
              className="bg-[#1A1A2E] text-white hover:bg-[#2A2A3E]"
            >
              View Contacts
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
