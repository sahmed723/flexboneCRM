'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Users,
  GitBranch,
  Sparkles,
  Megaphone,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Companies', href: '/dashboard/companies', icon: Building2 },
  { label: 'Contacts', href: '/dashboard/contacts', icon: Users },
  { label: 'Pipeline', href: '/dashboard/pipeline', icon: GitBranch },
  { label: 'Enrichment', href: '/dashboard/enrichment', icon: Sparkles },
  { label: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
  { label: 'Activities', href: '/dashboard/activities', icon: Activity },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex fixed left-0 top-0 z-40 h-screen flex-col border-r border-[#1A1A1A] bg-[#0A0A0A] transition-all duration-300',
          collapsed ? 'w-16' : 'w-[250px]'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex h-16 items-center border-b border-[#1A1A1A]',
          collapsed ? 'justify-center px-2' : 'px-5'
        )}>
          {collapsed ? (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <text
                x="50%"
                y="50%"
                dominantBaseline="central"
                textAnchor="middle"
                fill="#F5C518"
                fontFamily="Inter, system-ui, sans-serif"
                fontSize="18"
                fontWeight="700"
              >
                F
              </text>
            </svg>
          ) : (
            <svg width="140" height="32" viewBox="0 0 140 32" fill="none">
              <text
                x="0"
                y="50%"
                dominantBaseline="central"
                fill="#F5C518"
                fontFamily="Inter, system-ui, sans-serif"
                fontSize="22"
                fontWeight="700"
                letterSpacing="-0.02em"
              >
                flexbone
              </text>
            </svg>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[#F5C518]/10 text-[#F5C518]'
                        : 'text-[#A1A1AA] hover:bg-[#1A1A1A] hover:text-white'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-[#F5C518]')} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-[#1A1A1A] p-2">
          <button
            onClick={onToggle}
            className="flex w-full items-center justify-center rounded-md p-2 text-[#A1A1AA] hover:bg-[#1A1A1A] hover:text-white transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#1A1A1A] bg-[#0A0A0A]">
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-1',
                  isActive ? 'text-[#F5C518]' : 'text-[#A1A1AA]'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
