'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator,
} from '@/components/ui/command'
import { Users, Building2, Clock, Search } from 'lucide-react'

interface SearchResult {
  id: string
  type: 'contact' | 'company'
  title: string
  subtitle: string | null
}

const RECENT_KEY = 'flexbone-recent-searches'
const MAX_RECENT = 5

function getRecentSearches(): SearchResult[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch {
    return []
  }
}

function addRecentSearch(result: SearchResult) {
  const recent = getRecentSearches().filter((r) => r.id !== result.id)
  recent.unshift(result)
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_KEY)
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) return <>{text}</>
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-[#F5C518]/30 text-inherit rounded-sm px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter()
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [contacts, setContacts] = useState<SearchResult[]>([])
  const [companies, setCompanies] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches())
      setQuery('')
      setContacts([])
      setCompanies([])
    }
  }, [open])

  const search = useCallback(async (term: string) => {
    if (term.length < 2) {
      setContacts([])
      setCompanies([])
      return
    }

    setLoading(true)
    const t = `%${term}%`

    const [contactRes, companyRes] = await Promise.all([
      supabase
        .from('contacts')
        .select('id, first_name, last_name, email, title')
        .or(`first_name.ilike.${t},last_name.ilike.${t},email.ilike.${t}`)
        .order('last_name')
        .limit(8),
      supabase
        .from('companies')
        .select('id, company_name, city, state')
        .ilike('company_name', t)
        .order('company_name')
        .limit(8),
    ])

    setContacts(
      (contactRes.data || []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        type: 'contact' as const,
        title: `${c.first_name} ${c.last_name || ''}`.trim(),
        subtitle: (c.title as string) || (c.email as string) || null,
      }))
    )

    setCompanies(
      (companyRes.data || []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        type: 'company' as const,
        title: c.company_name as string,
        subtitle: [c.city, c.state].filter(Boolean).join(', ') || null,
      }))
    )

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) {
      setContacts([])
      setCompanies([])
      return
    }
    debounceRef.current = setTimeout(() => search(query), 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, search])

  const handleSelect = (result: SearchResult) => {
    addRecentSearch(result)
    onOpenChange(false)
    if (result.type === 'contact') {
      router.push(`/dashboard/contacts/${result.id}`)
    } else {
      router.push(`/dashboard/companies/${result.id}`)
    }
  }

  const hasResults = contacts.length > 0 || companies.length > 0
  const showRecent = query.length < 2 && recentSearches.length > 0

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search across contacts and companies"
    >
      <CommandInput
        placeholder="Search contacts, companies..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading && (
          <div className="py-6 text-center text-sm text-[#9CA3AF]">Searching...</div>
        )}

        {!loading && query.length >= 2 && !hasResults && (
          <CommandEmpty>No results found for &ldquo;{query}&rdquo;</CommandEmpty>
        )}

        {showRecent && (
          <CommandGroup heading="Recent Searches">
            {recentSearches.map((result) => (
              <CommandItem
                key={`recent-${result.id}`}
                onSelect={() => handleSelect(result)}
                className="cursor-pointer"
              >
                <Clock className="h-4 w-4 text-[#9CA3AF]" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-[#374151]">{result.title}</span>
                  {result.subtitle && (
                    <span className="text-xs text-[#9CA3AF] ml-2">{result.subtitle}</span>
                  )}
                </div>
                <span className="text-[10px] text-[#D1D5DB] uppercase">
                  {result.type}
                </span>
              </CommandItem>
            ))}
            <CommandItem
              onSelect={() => {
                clearRecentSearches()
                setRecentSearches([])
              }}
              className="cursor-pointer justify-center"
            >
              <span className="text-xs text-[#9CA3AF]">Clear recent searches</span>
            </CommandItem>
          </CommandGroup>
        )}

        {!loading && query.length < 2 && !showRecent && (
          <div className="py-6 text-center">
            <Search className="mx-auto h-8 w-8 text-[#D1D5DB]" />
            <p className="mt-2 text-sm text-[#9CA3AF]">Start typing to search</p>
          </div>
        )}

        {contacts.length > 0 && (
          <>
            <CommandGroup heading="Contacts">
              {contacts.map((result) => (
                <CommandItem
                  key={`contact-${result.id}`}
                  onSelect={() => handleSelect(result)}
                  className="cursor-pointer"
                >
                  <Users className="h-4 w-4 text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-[#374151]">
                      <HighlightMatch text={result.title} query={query} />
                    </span>
                    {result.subtitle && (
                      <span className="text-xs text-[#9CA3AF] ml-2 truncate">
                        <HighlightMatch text={result.subtitle} query={query} />
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {companies.length > 0 && <CommandSeparator />}
          </>
        )}

        {companies.length > 0 && (
          <CommandGroup heading="Companies">
            {companies.map((result) => (
              <CommandItem
                key={`company-${result.id}`}
                onSelect={() => handleSelect(result)}
                className="cursor-pointer"
              >
                <Building2 className="h-4 w-4 text-green-500" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-[#374151]">
                    <HighlightMatch text={result.title} query={query} />
                  </span>
                  {result.subtitle && (
                    <span className="text-xs text-[#9CA3AF] ml-2 truncate">{result.subtitle}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
