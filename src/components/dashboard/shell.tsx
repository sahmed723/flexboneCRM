'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { cn } from '@/lib/utils'

interface ShellProps {
  children: React.ReactNode
  userEmail: string | null
  userName: string | null
}

export function DashboardShell({ children, userEmail, userName }: ShellProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <div
        className={cn(
          'flex flex-col transition-all duration-300',
          collapsed ? 'md:ml-16' : 'md:ml-[250px]'
        )}
      >
        <Topbar userEmail={userEmail} userName={userName} />
        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  )
}
