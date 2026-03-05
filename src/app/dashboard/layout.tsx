import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Try to get user profile for display name
  let userName: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .single<{ full_name: string }>()

    userName = profile?.full_name || user.user_metadata?.full_name as string || null
  }

  return (
    <DashboardShell
      userEmail={user?.email || null}
      userName={userName}
    >
      {children}
    </DashboardShell>
  )
}
