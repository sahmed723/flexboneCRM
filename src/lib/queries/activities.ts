import { SupabaseClient } from '@supabase/supabase-js'

export interface ActivityFilters {
  activityTypes?: string[]
  userId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  perPage?: number
}

export interface ActivityListRow {
  id: string
  activity_type: string
  channel: string | null
  subject: string | null
  body: string | null
  outcome: string | null
  created_at: string
  user_id: string | null
  contact_id: string | null
  company_id: string | null
  contact_first_name: string | null
  contact_last_name: string | null
  company_name: string | null
}

export async function fetchActivities(supabase: SupabaseClient, filters: ActivityFilters) {
  const page = filters.page || 1
  const perPage = filters.perPage || 30
  const offset = (page - 1) * perPage

  let query = supabase
    .from('activities')
    .select(
      'id, activity_type, channel, subject, body, outcome, created_at, user_id, contact_id, company_id, contacts!activities_contact_id_fkey(first_name, last_name), companies!activities_company_id_fkey(company_name)',
      { count: 'exact' }
    )

  if (filters.activityTypes && filters.activityTypes.length > 0) {
    query = query.in('activity_type', filters.activityTypes)
  }

  if (filters.userId) {
    query = query.eq('user_id', filters.userId)
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('created_at', `${filters.dateTo}T23:59:59`)
  }

  query = query.order('created_at', { ascending: false })
  query = query.range(offset, offset + perPage - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('fetchActivities error:', error.message)
    return { data: [], count: 0, error }
  }

  const rows: ActivityListRow[] = (data || []).map((row: Record<string, unknown>) => {
    const contact = row.contacts as { first_name: string; last_name: string | null } | null
    const company = row.companies as { company_name: string } | null
    return {
      id: row.id as string,
      activity_type: row.activity_type as string,
      channel: row.channel as string | null,
      subject: row.subject as string | null,
      body: row.body as string | null,
      outcome: row.outcome as string | null,
      created_at: row.created_at as string,
      user_id: row.user_id as string | null,
      contact_id: row.contact_id as string | null,
      company_id: row.company_id as string | null,
      contact_first_name: contact?.first_name || null,
      contact_last_name: contact?.last_name || null,
      company_name: company?.company_name || null,
    }
  })

  return { data: rows, count: count || 0, error: null }
}

export async function fetchActivityStats(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('activities')
    .select('activity_type')

  if (error) return { stats: {}, total: 0 }

  const stats: Record<string, number> = {}
  let total = 0
  for (const row of (data || []) as { activity_type: string }[]) {
    stats[row.activity_type] = (stats[row.activity_type] || 0) + 1
    total++
  }

  return { stats, total }
}

export async function createActivity(
  supabase: SupabaseClient,
  activity: {
    contact_id?: string | null
    company_id?: string | null
    activity_type: string
    channel?: string | null
    subject?: string | null
    body?: string | null
    outcome?: string | null
  }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('activities') as any).insert({
    ...activity,
    created_at: new Date().toISOString(),
  }).select().single()

  return { data, error }
}

export async function searchContactsForSelect(supabase: SupabaseClient, term: string) {
  const { data, error } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email, companies!contacts_company_id_fkey(company_name)')
    .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`)
    .order('last_name')
    .limit(20)

  if (error) return []

  return (data || []).map((row: Record<string, unknown>) => {
    const company = row.companies as { company_name: string } | null
    return {
      id: row.id as string,
      first_name: row.first_name as string,
      last_name: row.last_name as string | null,
      email: row.email as string | null,
      company_name: company?.company_name || null,
    }
  })
}
