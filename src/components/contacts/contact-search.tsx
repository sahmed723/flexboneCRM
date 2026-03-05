'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'

export function ContactSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const currentSearch = searchParams.get('search') || ''
  const [value, setValue] = useState(currentSearch)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const pushSearch = useCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (term) params.set('search', term)
    else params.delete('search')
    params.set('page', '1')
    startTransition(() => { router.push(`${pathname}?${params.toString()}`) })
  }, [router, pathname, searchParams, startTransition])

  // Debounced auto-search on typing
  useEffect(() => {
    if (value === currentSearch) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => pushSearch(value), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [value, currentSearch, pushSearch])

  // Sync external changes
  useEffect(() => { setValue(currentSearch) }, [currentSearch])

  const handleClear = () => { setValue(''); pushSearch('') }

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search name, email, company, title..."
        className="pl-9 pr-8 h-9 bg-white border-[#E5E5E5] text-sm"
      />
      {value && (
        <button type="button" onClick={handleClear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151]">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
