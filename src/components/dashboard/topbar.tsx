'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GlobalSearch } from '@/components/global-search'
import { ThemeToggle } from '@/components/theme-toggle'
import { Search, LogOut, ChevronDown, Settings, Keyboard } from 'lucide-react'

interface TopbarProps {
  userEmail: string | null
  userName: string | null
}

export function Topbar({ userEmail, userName }: TopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail?.[0]?.toUpperCase() || '?'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E5E5E5] bg-white dark:bg-[#0A0A0A] dark:border-[#2A2A2E] px-6">
      {/* Search trigger */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-[#E5E5E5] dark:border-[#2A2A2E] bg-[#FAFAFA] dark:bg-[#1A1A1E] px-3 py-2 text-sm text-[#9CA3AF] hover:border-[#D1D5DB] dark:hover:border-[#3A3A3E] transition-colors w-full max-w-sm"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search contacts, companies...</span>
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-[#E5E5E5] dark:border-[#2A2A2E] bg-white dark:bg-[#0A0A0A] px-1.5 py-0.5 text-[10px] font-medium text-[#9CA3AF]">
            <span className="text-xs">&#x2318;</span>K
          </kbd>
        </button>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* User menu with dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#F5F5F5] dark:hover:bg-[#1A1A1E] transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1A2E] text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-[#0A0A0A] dark:text-[#FAFAFA]">{userName || userEmail}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-12 w-56 rounded-lg border border-[#E5E5E5] dark:border-[#2A2A2E] bg-white dark:bg-[#1A1A1E] py-1 shadow-lg z-50">
              <div className="border-b border-[#E5E5E5] dark:border-[#2A2A2E] px-4 py-3">
                <p className="text-sm font-medium text-[#0A0A0A] dark:text-[#FAFAFA]">{userName || 'User'}</p>
                <p className="text-xs text-[#9CA3AF]">{userEmail}</p>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); router.push('/dashboard/settings') }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[#374151] dark:text-[#D1D5DB] hover:bg-[#F9FAFB] dark:hover:bg-[#2A2A2E] transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <div className="border-t border-[#E5E5E5] dark:border-[#2A2A2E] px-4 py-2">
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1.5">Shortcuts</p>
                <div className="space-y-1 text-xs text-[#6B7280]">
                  <div className="flex justify-between"><span>Search</span><kbd className="font-mono text-[10px]">&#x2318;K</kbd></div>
                </div>
              </div>
              <div className="border-t border-[#E5E5E5] dark:border-[#2A2A2E]">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global search command palette */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}
