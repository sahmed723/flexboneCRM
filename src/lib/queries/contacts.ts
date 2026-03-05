import { SupabaseClient } from '@supabase/supabase-js'

export interface ContactFilters {
  search?: string
  stages?: string[]
  categories?: string[]
  sources?: string[]
  priorityTier?: string
  owner?: string
  campaignBatch?: string
  hasEmail?: 'yes' | 'no' | 'all'
  hasLinkedin?: 'yes' | 'no' | 'all'
  dateImportedFrom?: string
  dateImportedTo?: string
  lastContactedFrom?: string
  lastContactedTo?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  page?: number
  perPage?: number
}

export interface ContactListRow {
  id: string
  first_name: string
  last_name: string | null
  title: string | null
  email: string | null
  phone: string | null
  stage: string
  flexbone_category: string | null
  source: string
  priority_tier: string
  owner: string | null
  last_contacted_date: string | null
  campaign_batch: string | null
  linkedin: string | null
  company_id: string | null
  company_name: string | null
}

export interface ContactDetail {
  id: string
  first_name: string
  last_name: string | null
  title: string | null
  colloquial_title: string | null
  email: string | null
  secondary_email: string | null
  phone: string | null
  linkedin: string | null
  stage: string
  priority_tier: string
  flexbone_category: string | null
  source: string
  owner: string | null
  campaign_batch: string | null
  campaign_start_date: string | null
  last_channel: string | null
  last_engaged_by: string | null
  last_contacted_date: string | null
  engagement_notes: string | null
  date_imported: string | null
  original_company_name: string | null
  original_sheet: string | null
  created_at: string
  updated_at: string
  company_id: string | null
  companies: { id: string; company_name: string; flexbone_category: string | null; city: string | null; state: string | null; website: string | null } | null
}

export async function fetchContacts(supabase: SupabaseClient, filters: ContactFilters) {
  const page = filters.page || 1
  const perPage = filters.perPage || 50
  const offset = (page - 1) * perPage

  let query = supabase
    .from('contacts')
    .select(
      'id, first_name, last_name, title, email, phone, stage, flexbone_category, source, priority_tier, owner, last_contacted_date, campaign_batch, linkedin, company_id, companies!contacts_company_id_fkey(company_name)',
      { count: 'exact' }
    )

  // Search using ilike (leverages pg_trgm index)
  if (filters.search) {
    const term = `%${filters.search}%`
    query = query.or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},title.ilike.${term}`)
  }

  // Stage filter
  if (filters.stages && filters.stages.length > 0) {
    query = query.in('stage', filters.stages)
  }

  // Category filter
  if (filters.categories && filters.categories.length > 0) {
    query = query.in('flexbone_category', filters.categories)
  }

  // Source filter
  if (filters.sources && filters.sources.length > 0) {
    query = query.in('source', filters.sources)
  }

  // Priority tier
  if (filters.priorityTier && filters.priorityTier !== 'all') {
    query = query.eq('priority_tier', filters.priorityTier)
  }

  // Owner
  if (filters.owner) {
    query = query.eq('owner', filters.owner)
  }

  // Campaign batch
  if (filters.campaignBatch) {
    query = query.eq('campaign_batch', filters.campaignBatch)
  }

  // Has email
  if (filters.hasEmail === 'yes') {
    query = query.not('email', 'is', null)
  } else if (filters.hasEmail === 'no') {
    query = query.is('email', null)
  }

  // Has LinkedIn
  if (filters.hasLinkedin === 'yes') {
    query = query.not('linkedin', 'is', null)
  } else if (filters.hasLinkedin === 'no') {
    query = query.is('linkedin', null)
  }

  // Date imported range
  if (filters.dateImportedFrom) {
    query = query.gte('date_imported', filters.dateImportedFrom)
  }
  if (filters.dateImportedTo) {
    query = query.lte('date_imported', filters.dateImportedTo)
  }

  // Last contacted range
  if (filters.lastContactedFrom) {
    query = query.gte('last_contacted_date', filters.lastContactedFrom)
  }
  if (filters.lastContactedTo) {
    query = query.lte('last_contacted_date', filters.lastContactedTo)
  }

  // Sorting
  const sortBy = filters.sortBy || 'last_name'
  const ascending = filters.sortDir !== 'desc'
  query = query.order(sortBy, { ascending, nullsFirst: false })

  // Pagination
  query = query.range(offset, offset + perPage - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('fetchContacts error:', error.message)
    return { data: [], count: 0, error }
  }

  // Flatten the company join
  const rows: ContactListRow[] = (data || []).map((row: Record<string, unknown>) => {
    const companies = row.companies as { company_name: string } | null
    return {
      ...(row as unknown as ContactListRow),
      company_name: companies?.company_name || null,
    }
  })

  return { data: rows, count: count || 0, error: null }
}

export async function fetchContactById(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('contacts')
    .select('*, companies!contacts_company_id_fkey(id, company_name, flexbone_category, city, state, website)')
    .eq('id', id)
    .single()

  return { data: data as ContactDetail | null, error }
}

export async function fetchContactActivities(supabase: SupabaseClient, contactId: string) {
  const { data, error } = await supabase
    .from('activities')
    .select('id, activity_type, subject, body, outcome, channel, created_at, user_id')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(50)

  return { data: data || [], error }
}

export interface PipelineColumn {
  stage: string
  label: string
  contacts: PipelineCard[]
  count: number
}

export interface PipelineCard {
  id: string
  first_name: string
  last_name: string | null
  title: string | null
  flexbone_category: string | null
  company_name: string | null
  owner: string | null
}

export async function fetchPipelineData(
  supabase: SupabaseClient,
  opts?: { category?: string; owner?: string }
) {
  let query = supabase
    .from('contacts')
    .select('id, first_name, last_name, title, flexbone_category, stage, owner, companies!contacts_company_id_fkey(company_name)')
    .not('stage', 'in', '(closed_lost,churned)')
    .order('updated_at', { ascending: false })
    .limit(500)

  if (opts?.category) {
    query = query.eq('flexbone_category', opts.category)
  }
  if (opts?.owner) {
    query = query.eq('owner', opts.owner)
  }

  const { data, error } = await query

  if (error) {
    return { columns: [], error }
  }

  const stageOrder: { stage: string; label: string }[] = [
    { stage: 'new', label: 'New' },
    { stage: 'contacted', label: 'Contacted' },
    { stage: 'qualified', label: 'Qualified' },
    { stage: 'demo_scheduled', label: 'Demo Scheduled' },
    { stage: 'proposal_sent', label: 'Proposal Sent' },
    { stage: 'negotiation', label: 'Negotiation' },
    { stage: 'closed_won', label: 'Closed Won' },
  ]

  const grouped = new Map<string, PipelineCard[]>()
  for (const s of stageOrder) {
    grouped.set(s.stage, [])
  }

  for (const row of (data || []) as Record<string, unknown>[]) {
    const stage = row.stage as string
    const companies = row.companies as { company_name: string } | null
    const card: PipelineCard = {
      id: row.id as string,
      first_name: row.first_name as string,
      last_name: row.last_name as string | null,
      title: row.title as string | null,
      flexbone_category: row.flexbone_category as string | null,
      company_name: companies?.company_name || null,
      owner: row.owner as string | null,
    }
    const list = grouped.get(stage)
    if (list) list.push(card)
  }

  // Get total counts per stage (including beyond the 500 limit)
  const { data: countData } = await supabase
    .from('contacts')
    .select('stage')
    .not('stage', 'in', '(closed_lost,churned)')

  const stageCounts = new Map<string, number>()
  for (const row of (countData || []) as { stage: string }[]) {
    stageCounts.set(row.stage, (stageCounts.get(row.stage) || 0) + 1)
  }

  const columns: PipelineColumn[] = stageOrder.map(s => ({
    stage: s.stage,
    label: s.label,
    contacts: grouped.get(s.stage) || [],
    count: stageCounts.get(s.stage) || 0,
  }))

  return { columns, error: null }
}

export async function fetchDistinctOwners(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('contacts')
    .select('owner')
    .not('owner', 'is', null)

  const owners = new Set<string>()
  if (data) {
    for (const row of data as { owner: string }[]) {
      if (row.owner) owners.add(row.owner)
    }
  }
  return Array.from(owners).sort()
}

export async function fetchDistinctCampaignBatches(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('contacts')
    .select('campaign_batch')
    .not('campaign_batch', 'is', null)

  const batches = new Set<string>()
  if (data) {
    for (const row of data as { campaign_batch: string }[]) {
      if (row.campaign_batch) batches.add(row.campaign_batch)
    }
  }
  return Array.from(batches).sort()
}

export async function updateContactStage(supabase: SupabaseClient, contactId: string, stage: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('contacts') as any).update({ stage }).eq('id', contactId)
  return { error }
}
