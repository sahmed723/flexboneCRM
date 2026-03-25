'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { CategoryBadge } from '@/components/ui/category-badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight,
  MoreHorizontal, UserPlus, ArrowRightLeft, Send, Download, Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { exportToCSV } from '@/lib/export-csv'
import { toast } from 'sonner'
import type { ContactListRow } from '@/lib/queries/contacts'

const INSTANTLY_COLUMNS = [
  { key: 'first_name', label: 'first_name' },
  { key: 'last_name', label: 'last_name' },
  { key: 'email', label: 'email' },
  { key: 'phone', label: 'phone' },
  { key: 'company_name', label: 'company_name' },
  { key: 'title', label: 'title' },
  { key: 'website', label: 'website' },
  { key: 'city', label: 'city' },
  { key: 'state', label: 'state' },
  { key: 'company_size', label: 'employee_count' },
  { key: 'flexbone_category', label: 'flexbone_category' },
  { key: 'ehr', label: 'ehr_system' },
  { key: 'linkedin', label: 'linkedin_url' },
]

const STAGES = [
  { value: 'new', label: 'New', color: 'bg-slate-100 text-slate-700' },
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-700' },
  { value: 'qualified', label: 'Qualified', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'demo_scheduled', label: 'Demo', color: 'bg-violet-100 text-violet-700' },
  { value: 'proposal_sent', label: 'Proposal', color: 'bg-amber-100 text-amber-700' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-orange-100 text-orange-700' },
  { value: 'closed_won', label: 'Won', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'closed_lost', label: 'Lost', color: 'bg-red-100 text-red-700' },
  { value: 'churned', label: 'Churned', color: 'bg-gray-100 text-gray-500' },
]

interface ContactTableProps {
  data: ContactListRow[]
  totalCount: number
  page: number
  perPage: number
  filterParams?: string
}

function toInstantlyRow(r: ContactListRow) {
  return {
    first_name: r.first_name || '',
    last_name: r.last_name || '',
    email: r.email || '',
    phone: r.phone || '',
    company_name: r.company_name || '',
    title: r.title || '',
    website: '',
    city: '',
    state: '',
    company_size: r.company_size?.toString() || '',
    flexbone_category: r.flexbone_category || '',
    ehr: '',
    linkedin: r.linkedin || '',
  }
}

function InlineStageSelect({ contactId, currentStage }: { contactId: string; currentStage: string }) {
  const router = useRouter()
  const supabase = createClient()
  const current = STAGES.find(s => s.value === currentStage) || STAGES[0]

  const handleChange = async (value: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('contacts') as any).update({ stage: value }).eq('id', contactId)
    const label = STAGES.find(s => s.value === value)?.label || value
    toast.success(`Stage changed to ${label}`)
    router.refresh()
  }

  return (
    <Select value={currentStage} onValueChange={handleChange}>
      <SelectTrigger className={`h-6 w-auto gap-1 border-0 px-2 py-0 text-xs font-medium rounded-md ${current.color}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STAGES.map(s => (
          <SelectItem key={s.value} value={s.value} className="text-xs">
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function ContactTable({ data, totalCount, page, perPage, filterParams }: ContactTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  const sortBy = searchParams.get('sortBy') || 'last_name'
  const sortDir = searchParams.get('sortDir') || 'asc'
  const totalPages = Math.ceil(totalCount / perPage)

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key)
      else params.set(key, value)
    }
    startTransition(() => { router.push(`${pathname}?${params.toString()}`) })
  }, [router, pathname, searchParams, startTransition])

  const handleSort = (col: string) => {
    if (sortBy === col) updateParams({ sortDir: sortDir === 'asc' ? 'desc' : 'asc' })
    else updateParams({ sortBy: col, sortDir: 'asc' })
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <ArrowUpDown className="ml-1 h-3 w-3 text-[#D1D5DB]" />
    return sortDir === 'asc'
      ? <ArrowUp className="ml-1 h-3 w-3 text-[#F5C518]" />
      : <ArrowDown className="ml-1 h-3 w-3 text-[#F5C518]" />
  }

  const columns: ColumnDef<ContactListRow>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          className="h-4 w-4"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          className="h-4 w-4"
        />
      ),
      size: 36,
    },
    {
      id: 'name',
      header: () => (
        <button onClick={() => handleSort('last_name')} className="flex items-center font-medium hover:text-[#0A0A0A]">
          Name <SortIcon col="last_name" />
        </button>
      ),
      cell: ({ row }) => (
        <Link href={`/dashboard/contacts/${row.original.id}`} className="font-medium text-[#0A0A0A] hover:text-[#F5C518] transition-colors">
          {row.original.first_name} {row.original.last_name || ''}
        </Link>
      ),
    },
    {
      id: 'company',
      header: 'Company',
      cell: ({ row }) =>
        row.original.company_id ? (
          <Link href={`/dashboard/companies/${row.original.company_id}`} className="text-sm text-blue-600 hover:underline truncate block max-w-[160px]">
            {row.original.company_name || '—'}
          </Link>
        ) : (
          <span className="text-sm text-[#9CA3AF]">—</span>
        ),
    },
    {
      accessorKey: 'title',
      header: () => (
        <button onClick={() => handleSort('title')} className="flex items-center font-medium hover:text-[#0A0A0A]">
          Title <SortIcon col="title" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-[#374151] truncate block max-w-[180px]" title={row.original.title || ''}>
          {row.original.title || <span className="text-[#9CA3AF]">—</span>}
        </span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) =>
        row.original.email ? (
          <a href={`mailto:${row.original.email}`} className="text-sm text-blue-600 hover:underline truncate block max-w-[180px]">
            {row.original.email}
          </a>
        ) : (
          <span className="text-sm text-[#9CA3AF]">—</span>
        ),
    },
    {
      accessorKey: 'stage',
      header: () => (
        <button onClick={() => handleSort('stage')} className="flex items-center font-medium hover:text-[#0A0A0A]">
          Stage <SortIcon col="stage" />
        </button>
      ),
      cell: ({ row }) => <InlineStageSelect contactId={row.original.id} currentStage={row.original.stage} />,
    },
    {
      accessorKey: 'flexbone_category',
      header: 'Category',
      cell: ({ row }) => <CategoryBadge category={row.original.flexbone_category} />,
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => <span className="text-xs text-[#6B7280]">{row.original.source}</span>,
    },
    {
      accessorKey: 'last_contacted_date',
      header: () => (
        <button onClick={() => handleSort('last_contacted_date')} className="flex items-center font-medium hover:text-[#0A0A0A]">
          Last Contact <SortIcon col="last_contacted_date" />
        </button>
      ),
      cell: ({ row }) => {
        const d = row.original.last_contacted_date
        return d ? (
          <span className="text-xs text-[#6B7280] tabular-nums">{new Date(d).toLocaleDateString()}</span>
        ) : (
          <span className="text-xs text-[#D1D5DB]">Never</span>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/contacts/${row.original.id}`}>View detail</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Edit contact</DropdownMenuItem>
            <DropdownMenuItem>Log activity</DropdownMenuItem>
            <DropdownMenuItem>AI research</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 36,
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
    manualSorting: true,
    manualPagination: true,
    pageCount: totalPages,
    getRowId: (row) => row.id,
  })

  const selectedCount = Object.keys(rowSelection).length
  const [exporting, setExporting] = useState(false)
  const [selectAllFiltered, setSelectAllFiltered] = useState(false)

  // Export selected rows with Instantly-compatible headers
  const exportSelected = () => {
    const selectedRows = data.filter((r) => rowSelection[r.id])
    if (selectedRows.length === 0) return
    const exportData = selectedRows.map(toInstantlyRow)
    exportToCSV(exportData, 'flexbone_export', INSTANTLY_COLUMNS)
    toast.success(`Exported ${selectedRows.length} contacts`)
  }

  // Export ALL filtered contacts (not just current page)
  const exportAllFiltered = async () => {
    setExporting(true)
    try {
      const supabase = createClient()

      // Build the same query as the server but fetch all results
      let query = supabase
        .from('contacts')
        .select('id, first_name, last_name, title, email, phone, stage, flexbone_category, source, linkedin, company_id, companies!contacts_company_id_fkey(company_name, company_size, website, city, state, ehr)')
        .order('last_name')
        .limit(50000)

      // Re-apply current URL filters
      const params = new URLSearchParams(filterParams || '')

      if (params.get('search')) {
        const term = `%${params.get('search')}%`
        query = query.or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},title.ilike.${term}`)
      }
      if (params.get('titleSearch')) {
        query = query.ilike('title', `%${params.get('titleSearch')}%`)
      }
      if (params.get('stages')) {
        query = query.in('stage', params.get('stages')!.split(','))
      }
      if (params.get('categories')) {
        query = query.in('flexbone_category', params.get('categories')!.split(','))
      }
      if (params.get('sources')) {
        query = query.in('source', params.get('sources')!.split(','))
      }
      if (params.get('priorityTier') && params.get('priorityTier') !== 'all') {
        query = query.eq('priority_tier', params.get('priorityTier')!)
      }
      if (params.get('owner')) {
        query = query.eq('owner', params.get('owner')!)
      }
      if (params.get('hasEmail') === 'yes') {
        query = query.not('email', 'is', null)
      } else if (params.get('hasEmail') === 'no') {
        query = query.is('email', null)
      }
      if (params.get('contactedStatus') === 'not_contacted') {
        query = query.eq('stage', 'new').is('last_contacted_date', null)
      } else if (params.get('contactedStatus') === 'contacted') {
        query = query.not('last_contacted_date', 'is', null)
      }

      const { data: allData, error } = await query
      if (error) throw error
      if (!allData || allData.length === 0) {
        toast.error('No contacts match current filters')
        return
      }

      const exportData = (allData as Record<string, unknown>[]).map((row) => {
        const co = row.companies as { company_name: string; company_size: number | null; website: string | null; city: string | null; state: string | null; ehr: string | null } | null
        return {
          first_name: String(row.first_name || ''),
          last_name: String(row.last_name || ''),
          email: String(row.email || ''),
          phone: String(row.phone || ''),
          company_name: co?.company_name || '',
          title: String(row.title || ''),
          website: co?.website || '',
          city: co?.city || '',
          state: co?.state || '',
          company_size: co?.company_size?.toString() || '',
          flexbone_category: String(row.flexbone_category || ''),
          ehr: co?.ehr || '',
          linkedin: String(row.linkedin || ''),
        }
      })

      const filename = `flexbone_export`
      exportToCSV(exportData, filename, INSTANTLY_COLUMNS)

      // Log export to campaign_exports table
      const contactIds = (allData as { id: string }[]).map(r => r.id)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('campaign_exports') as any).insert({
          filter_snapshot: Object.fromEntries(params.entries()),
          contact_count: contactIds.length,
          filename: `${filename}-${new Date().toISOString().slice(0, 10)}.csv`,
          contact_ids: contactIds,
        })

        // Mark exported contacts with last_contacted_date if they haven't been contacted
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('contacts') as any)
          .update({ stage: 'contacted', last_contacted_date: new Date().toISOString() })
          .in('id', contactIds)
          .eq('stage', 'new')
      } catch {
        // Non-critical — export still succeeded
      }

      toast.success(`Exported ${exportData.length.toLocaleString()} contacts`)
    } catch (err) {
      toast.error('Export failed')
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Export bar — always visible */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <span className="text-sm font-medium text-[#374151]">{selectedCount} selected</span>
          )}
          {selectedCount > 0 && selectedCount === data.length && !selectAllFiltered && totalCount > perPage && (
            <button
              onClick={() => setSelectAllFiltered(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              Select all {totalCount.toLocaleString()} matching contacts
            </button>
          )}
          {selectAllFiltered && (
            <>
              <span className="text-sm font-medium text-blue-600">All {totalCount.toLocaleString()} contacts selected</span>
              <button onClick={() => { setSelectAllFiltered(false); setRowSelection({}) }} className="text-sm text-[#6B7280] hover:underline">Clear</button>
            </>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-sm"
          disabled={exporting}
          onClick={selectAllFiltered || selectedCount === 0 ? exportAllFiltered : exportSelected}
        >
          {exporting ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          {selectAllFiltered
            ? `Export All ${totalCount.toLocaleString()}`
            : selectedCount > 0
              ? `Export ${selectedCount} Selected`
              : `Export All Filtered (${totalCount.toLocaleString()})`
          }
        </Button>
      </div>

      {/* Bulk actions */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-[#F5C518]/10 border border-[#F5C518]/30 px-4 py-2.5">
          <span className="text-sm font-medium text-[#0A0A0A]">{selectedCount} selected</span>
          <div className="h-4 w-px bg-[#E5E5E5]" />
          <Button variant="ghost" size="sm" className="text-sm h-7 gap-1.5"><ArrowRightLeft className="h-3.5 w-3.5" /> Change Stage</Button>
          <Button variant="ghost" size="sm" className="text-sm h-7 gap-1.5"><UserPlus className="h-3.5 w-3.5" /> Assign Owner</Button>
          <Button variant="ghost" size="sm" className="text-sm h-7 gap-1.5"><Send className="h-3.5 w-3.5" /> Add to Campaign</Button>
          <Button variant="ghost" size="sm" className="text-sm h-7 gap-1.5"><Sparkles className="h-3.5 w-3.5" /> AI Research</Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-[#FAFAFA] hover:bg-[#FAFAFA]">
                {hg.headers.map((h) => (
                  <TableHead key={h.id} className="text-xs text-[#6B7280] font-medium h-10">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-[#FAFAFA] data-[state=selected]:bg-[#F5C518]/5"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-[#9CA3AF]">
                  No contacts found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-[#6B7280]">
          Showing {Math.min(((page - 1) * perPage) + 1, totalCount)}–{Math.min(page * perPage, totalCount)} of{' '}
          <span className="font-medium text-[#374151]">{totalCount.toLocaleString()}</span> contacts
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1 || isPending} onClick={() => updateParams({ page: String(page - 1) })} className="h-8 gap-1">
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <div className="flex items-center gap-1">
            {pageNumbers(page, totalPages).map((p, i) =>
              p === '...' ? (
                <span key={`e${i}`} className="px-1.5 text-sm text-[#9CA3AF]">...</span>
              ) : (
                <Button
                  key={p}
                  variant={page === p ? 'default' : 'outline'}
                  size="sm"
                  className={`h-8 w-8 p-0 ${page === p ? 'bg-[#1A1A2E] text-white' : ''}`}
                  onClick={() => updateParams({ page: String(p) })}
                  disabled={isPending}
                >
                  {p}
                </Button>
              )
            )}
          </div>
          <Button variant="outline" size="sm" disabled={page >= totalPages || isPending} onClick={() => updateParams({ page: String(page + 1) })} className="h-8 gap-1">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function pageNumbers(cur: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (cur <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (cur >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', cur - 1, cur, cur + 1, '...', total]
}
