'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { CategoryBadge } from '@/components/ui/category-badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowUpDown, ArrowUp, ArrowDown,
  Check, ExternalLink, MoreHorizontal,
  ChevronLeft, ChevronRight,
  UserPlus, Tag, Download, Sparkles,
} from 'lucide-react'
import { exportToCSV } from '@/lib/export-csv'
import { toast } from 'sonner'
import type { CompanyListRow } from '@/lib/queries/companies'

interface CompanyTableProps {
  data: CompanyListRow[]
  totalCount: number
  page: number
  perPage: number
}

export function CompanyTable({ data, totalCount, page, perPage }: CompanyTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  const sortBy = searchParams.get('sortBy') || 'company_name'
  const sortDir = searchParams.get('sortDir') || 'asc'

  const sorting: SortingState = [{ id: sortBy, desc: sortDir === 'desc' }]

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }, [router, pathname, searchParams, startTransition])

  const handleSort = (columnId: string) => {
    if (sortBy === columnId) {
      updateParams({ sortDir: sortDir === 'asc' ? 'desc' : 'asc' })
    } else {
      updateParams({ sortBy: columnId, sortDir: 'asc' })
    }
  }

  const totalPages = Math.ceil(totalCount / perPage)

  const SortIcon = ({ columnId }: { columnId: string }) => {
    if (sortBy !== columnId) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-[#D1D5DB]" />
    return sortDir === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5 text-[#F5C518]" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5 text-[#F5C518]" />
  }

  const columns: ColumnDef<CompanyListRow>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="h-4 w-4"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="h-4 w-4"
        />
      ),
      size: 40,
      enableSorting: false,
    },
    {
      accessorKey: 'company_name',
      header: () => (
        <button onClick={() => handleSort('company_name')} className="flex items-center font-medium hover:text-[#0A0A0A]">
          Company <SortIcon columnId="company_name" />
        </button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/dashboard/companies/${row.original.id}`}
          className="font-medium text-[#0A0A0A] hover:text-[#F5C518] transition-colors"
        >
          {row.original.company_name}
        </Link>
      ),
    },
    {
      accessorKey: 'flexbone_category',
      header: () => (
        <button onClick={() => handleSort('flexbone_category')} className="flex items-center font-medium hover:text-[#0A0A0A]">
          Category <SortIcon columnId="flexbone_category" />
        </button>
      ),
      cell: ({ row }) => <CategoryBadge category={row.original.flexbone_category} />,
    },
    {
      id: 'location',
      header: () => (
        <button onClick={() => handleSort('state')} className="flex items-center font-medium hover:text-[#0A0A0A]">
          Location <SortIcon columnId="state" />
        </button>
      ),
      cell: ({ row }) => {
        const city = row.original.city
        const state = row.original.state
        if (!city && !state) return <span className="text-[#9CA3AF]">—</span>
        return <span className="text-[#374151]">{[city, state].filter(Boolean).join(', ')}</span>
      },
    },
    {
      accessorKey: 'company_size',
      header: () => (
        <button onClick={() => handleSort('company_size')} className="flex items-center font-medium hover:text-[#0A0A0A]">
          Size <SortIcon columnId="company_size" />
        </button>
      ),
      cell: ({ row }) => {
        const size = row.original.company_size
        return size ? <span className="tabular-nums">{size.toLocaleString()}</span> : <span className="text-[#9CA3AF]">—</span>
      },
    },
    {
      accessorKey: 'website',
      header: 'Website',
      cell: ({ row }) => {
        const url = row.original.website
        if (!url) return <span className="text-[#9CA3AF]">—</span>
        const display = url.replace(/^https?:\/\//, '').replace(/\/$/, '')
        return (
          <a
            href={url.startsWith('http') ? url : `https://${url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
          >
            <span className="truncate max-w-[140px]">{display}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        )
      },
    },
    {
      accessorKey: 'contact_count',
      header: () => (
        <button onClick={() => handleSort('contact_count')} className="flex items-center font-medium hover:text-[#0A0A0A]">
          Contacts <SortIcon columnId="contact_count" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.contact_count}</span>
      ),
    },
    {
      id: 'enriched',
      header: 'Enriched',
      cell: ({ row }) =>
        row.original.has_enrichment ? (
          <Check className="h-4 w-4 text-emerald-500" />
        ) : (
          <span className="text-[#D1D5DB]">—</span>
        ),
    },
    {
      accessorKey: 'ehr',
      header: 'EHR',
      cell: ({ row }) => {
        const ehr = row.original.ehr
        return ehr ? <span className="text-sm">{ehr}</span> : <span className="text-[#9CA3AF]">—</span>
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/companies/${row.original.id}`}>View details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Edit company</DropdownMenuItem>
            <DropdownMenuItem>Queue for enrichment</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 40,
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { rowSelection, sorting },
    manualSorting: true,
    manualPagination: true,
    pageCount: totalPages,
    getRowId: (row) => row.id,
  })

  const selectedCount = Object.keys(rowSelection).length

  return (
    <div className="space-y-3">
      {/* Bulk actions bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-[#F5C518]/10 border border-[#F5C518]/30 px-4 py-2.5">
          <span className="text-sm font-medium text-[#0A0A0A]">
            {selectedCount} selected
          </span>
          <div className="h-4 w-px bg-[#E5E5E5]" />
          <Button variant="ghost" size="sm" className="text-sm h-7 gap-1.5">
            <UserPlus className="h-3.5 w-3.5" /> Assign Owner
          </Button>
          <Button variant="ghost" size="sm" className="text-sm h-7 gap-1.5">
            <Tag className="h-3.5 w-3.5" /> Change Category
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-sm h-7 gap-1.5"
            onClick={() => {
              const selectedRows = data.filter((r) => rowSelection[r.id])
              exportToCSV(
                selectedRows.map((r) => ({
                  Company: r.company_name,
                  Category: r.flexbone_category || '',
                  City: r.city || '',
                  State: r.state || '',
                  Size: r.company_size?.toString() || '',
                  Website: r.website || '',
                  Contacts: r.contact_count.toString(),
                  EHR: r.ehr || '',
                  Enriched: r.has_enrichment ? 'Yes' : 'No',
                })),
                'companies-export',
              )
              toast.success(`Exported ${selectedRows.length} companies`)
            }}
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button variant="ghost" size="sm" className="text-sm h-7 gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Queue Enrichment
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-[#FAFAFA] hover:bg-[#FAFAFA]">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs text-[#6B7280] font-medium h-10">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                    <TableCell key={cell.id} className="py-3 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-[#9CA3AF]">
                  No companies found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-[#6B7280]">
          Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, totalCount)} of{' '}
          <span className="font-medium text-[#374151]">{totalCount.toLocaleString()}</span> companies
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isPending}
            onClick={() => updateParams({ page: String(page - 1) })}
            className="h-8 gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <div className="flex items-center gap-1">
            {generatePageNumbers(page, totalPages).map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-sm text-[#9CA3AF]">...</span>
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
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isPending}
            onClick={() => updateParams({ page: String(page + 1) })}
            className="h-8 gap-1"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function generatePageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = []
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total)
  } else if (current >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total)
  }
  return pages
}
