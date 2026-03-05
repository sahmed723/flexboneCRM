import { SupabaseClient } from '@supabase/supabase-js'

export interface CampaignListRow {
  id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  status: string
  contact_count: number
  created_at: string
}

export async function fetchCampaigns(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('campaign_batches')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('fetchCampaigns error:', error.message)
    return { data: [], error }
  }

  return { data: (data || []) as CampaignListRow[], error: null }
}

export async function fetchCampaignById(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('campaign_batches')
    .select('*')
    .eq('id', id)
    .single()

  return { data: data as CampaignListRow | null, error }
}

export interface CampaignContactRow {
  id: string
  first_name: string
  last_name: string | null
  title: string | null
  email: string | null
  stage: string
  flexbone_category: string | null
  company_name: string | null
}

export async function fetchCampaignContacts(
  supabase: SupabaseClient,
  campaignName: string,
  opts?: { page?: number; perPage?: number }
) {
  const page = opts?.page || 1
  const perPage = opts?.perPage || 50
  const offset = (page - 1) * perPage

  const { data, count, error } = await supabase
    .from('contacts')
    .select(
      'id, first_name, last_name, title, email, stage, flexbone_category, companies!contacts_company_id_fkey(company_name)',
      { count: 'exact' }
    )
    .eq('campaign_batch', campaignName)
    .order('last_name')
    .range(offset, offset + perPage - 1)

  if (error) {
    return { data: [], count: 0, error }
  }

  const rows: CampaignContactRow[] = (data || []).map((row: Record<string, unknown>) => {
    const company = row.companies as { company_name: string } | null
    return {
      id: row.id as string,
      first_name: row.first_name as string,
      last_name: row.last_name as string | null,
      title: row.title as string | null,
      email: row.email as string | null,
      stage: row.stage as string,
      flexbone_category: row.flexbone_category as string | null,
      company_name: company?.company_name || null,
    }
  })

  return { data: rows, count: count || 0, error: null }
}

export async function fetchCampaignStageCounts(supabase: SupabaseClient, campaignName: string) {
  const { data, error } = await supabase
    .from('contacts')
    .select('stage')
    .eq('campaign_batch', campaignName)

  if (error) return {}

  const counts: Record<string, number> = {}
  for (const row of (data || []) as { stage: string }[]) {
    counts[row.stage] = (counts[row.stage] || 0) + 1
  }
  return counts
}

export async function createCampaign(
  supabase: SupabaseClient,
  campaign: {
    name: string
    description?: string | null
    start_date?: string | null
    status?: string
  }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('campaign_batches') as any)
    .insert({
      ...campaign,
      status: campaign.status || 'active',
      contact_count: 0,
    })
    .select()
    .single()

  return { data, error }
}
