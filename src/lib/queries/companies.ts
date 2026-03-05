import { SupabaseClient } from '@supabase/supabase-js'

export interface CompanyFilters {
  search?: string
  categories?: string[]
  state?: string
  sizeMin?: number
  sizeMax?: number
  enriched?: 'yes' | 'no' | 'all'
  hasAsc?: 'yes' | 'no' | 'all'
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  page?: number
  perPage?: number
}

export interface CompanyListRow {
  id: string
  company_name: string
  clean_company_name: string | null
  flexbone_category: string | null
  city: string | null
  state: string | null
  company_size: number | null
  website: string | null
  contact_count: number
  ehr: string | null
  has_enrichment: boolean
}

export async function fetchCompanies(supabase: SupabaseClient, filters: CompanyFilters) {
  const page = filters.page || 1
  const perPage = filters.perPage || 50
  const offset = (page - 1) * perPage

  let query = supabase
    .from('companies')
    .select('id, company_name, clean_company_name, flexbone_category, city, state, company_size, website, contact_count, ehr', { count: 'exact' })

  // Search using pg_trgm
  if (filters.search) {
    query = query.ilike('company_name', `%${filters.search}%`)
  }

  // Category filter
  if (filters.categories && filters.categories.length > 0) {
    query = query.in('flexbone_category', filters.categories)
  }

  // State filter
  if (filters.state) {
    query = query.eq('state', filters.state)
  }

  // Size range
  if (filters.sizeMin !== undefined) {
    query = query.gte('company_size', filters.sizeMin)
  }
  if (filters.sizeMax !== undefined) {
    query = query.lte('company_size', filters.sizeMax)
  }

  // Has ASC filter
  if (filters.hasAsc === 'yes') {
    query = query.eq('has_asc', true)
  } else if (filters.hasAsc === 'no') {
    query = query.eq('has_asc', false)
  }

  // Sorting
  const sortBy = filters.sortBy || 'company_name'
  const sortDir = filters.sortDir === 'desc'
  query = query.order(sortBy, { ascending: !sortDir })

  // Pagination
  query = query.range(offset, offset + perPage - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('fetchCompanies error:', error.message)
    return { data: [], count: 0, error }
  }

  // If enriched filter, we need to check enrichment separately
  // (done post-query since it's a join check)
  let rows = (data || []) as CompanyListRow[]

  if (filters.enriched === 'yes' || filters.enriched === 'no') {
    const ids = rows.map(r => r.id)
    if (ids.length > 0) {
      const { data: enrichedIds } = await supabase
        .from('company_enrichments')
        .select('company_id')
        .in('company_id', ids)

      const enrichedSet = new Set((enrichedIds || []).map(e => (e as { company_id: string }).company_id))
      rows = rows.map(r => ({ ...r, has_enrichment: enrichedSet.has(r.id) }))

      if (filters.enriched === 'yes') {
        rows = rows.filter(r => r.has_enrichment)
      } else {
        rows = rows.filter(r => !r.has_enrichment)
      }
    }
  } else {
    // Mark enrichment status for display
    const ids = rows.map(r => r.id)
    if (ids.length > 0) {
      const { data: enrichedIds } = await supabase
        .from('company_enrichments')
        .select('company_id')
        .in('company_id', ids)

      const enrichedSet = new Set((enrichedIds || []).map(e => (e as { company_id: string }).company_id))
      rows = rows.map(r => ({ ...r, has_enrichment: enrichedSet.has(r.id) }))
    }
  }

  return { data: rows, count: count || 0, error: null }
}

export async function fetchCompanyById(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single()

  return { data, error }
}

export async function fetchCompanyContacts(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, title, email, phone, stage, priority_tier, linkedin, owner')
    .eq('company_id', companyId)
    .order('last_name', { ascending: true })

  return { data: data || [], error }
}

export async function fetchCompanyEnrichment(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from('company_enrichments')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return { data, error }
}

export async function fetchCompanyProcedures(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from('procedure_intelligence')
    .select('*')
    .eq('company_id', companyId)
    .order('cpt_code', { ascending: true })

  return { data: data || [], error }
}

export async function fetchCompanyActivities(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from('activities')
    .select('id, activity_type, subject, body, outcome, channel, created_at, user_id')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(50)

  return { data: data || [], error }
}

export async function fetchDistinctStates(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('companies')
    .select('state')
    .not('state', 'is', null)
    .order('state')

  const states = new Set<string>()
  if (data) {
    for (const row of data as { state: string }[]) {
      if (row.state) states.add(row.state)
    }
  }
  return Array.from(states).sort()
}
