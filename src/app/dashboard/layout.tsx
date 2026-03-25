import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let userEmail: string | null = null
  let userName: string | null = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    userEmail = user?.email || null

    if (user) {
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', user.id)
          .single<{ full_name: string }>()

        userName = profile?.full_name || user.user_metadata?.full_name as string || null
      } catch {
        userName = user.user_metadata?.full_name as string || null
      }
    }
  } catch (err) {
    console.error('Dashboard layout error:', err)
  }

  return (
    <DashboardShell
      userEmail={userEmail}
      userName={userName}
    >
      {children}
    </DashboardShell>
  )
}
