import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import * as path from 'path'
import * as fs from 'fs'

// ─── Configuration ───────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const BATCH_SIZE = 500

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY. Set env variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── Enum Mappings ───────────────────────────────────────────

const STAGE_MAP: Record<string, string> = {
  'new': 'new',
  'contacted': 'contacted',
  'qualified': 'qualified',
  'demo scheduled': 'demo_scheduled',
  'demo_scheduled': 'demo_scheduled',
  'proposal sent': 'proposal_sent',
  'proposal_sent': 'proposal_sent',
  'negotiation': 'negotiation',
  'closed won': 'closed_won',
  'closed_won': 'closed_won',
  'closed lost': 'closed_lost',
  'closed_lost': 'closed_lost',
  'churned': 'churned',
}

const CATEGORY_MAP: Record<string, string> = {
  'asc': 'ASC',
  'snf': 'SNF',
  'bpo': 'BPO',
  'health system': 'Health System',
  'insurer': 'Insurer',
  'optometry': 'Optometry',
  'dso': 'DSO',
  'newsletter': 'Newsletter',
  'asc association': 'ASC Association',
}

const SOURCE_MAP: Record<string, string> = {
  'apollo': 'Apollo',
  "becker's asc review": 'Beckers ASC Review',
  'beckers asc review': 'Beckers ASC Review',
  "becker's": 'Beckers ASC Review',
  'asca.org': 'ASCA.org',
  'asca': 'ASCA.org',
  'ga_urology': 'GA_Urology',
  'ga urology': 'GA_Urology',
  'ga_eye_partners': 'GA_Eye_Partners',
  'ga eye partners': 'GA_Eye_Partners',
  'resurgens': 'Resurgens',
  'orlando_health_execs': 'Orlando_Health_Execs',
  'orlando health execs': 'Orlando_Health_Execs',
  'manual': 'Manual',
  'import': 'Import',
  'other': 'Other',
}

const PRIORITY_MAP: Record<string, string> = {
  'tier 1': 'tier_1',
  'tier_1': 'tier_1',
  '1': 'tier_1',
  'tier 2': 'tier_2',
  'tier_2': 'tier_2',
  '2': 'tier_2',
  'tier 3': 'tier_3',
  'tier_3': 'tier_3',
  '3': 'tier_3',
  'unassigned': 'unassigned',
}

// ─── Helper Functions ────────────────────────────────────────

function str(val: unknown): string | null {
  if (val === undefined || val === null || val === '') return null
  return String(val).trim()
}

function num(val: unknown): number | null {
  if (val === undefined || val === null || val === '') return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

function bool(val: unknown): boolean {
  if (val === undefined || val === null) return false
  const s = String(val).toLowerCase().trim()
  return s === 'true' || s === 'yes' || s === '1' || s === 'y'
}

function mapEnum(val: unknown, mapping: Record<string, string>): string | null {
  if (val === undefined || val === null || val === '') return null
  const key = String(val).toLowerCase().trim()
  return mapping[key] || null
}

function parseDate(val: unknown): string | null {
  if (val === undefined || val === null || val === '') return null
  // Excel serial date number
  if (typeof val === 'number') {
    const date = XLSX.SSF.parse_date_code(val)
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
    }
  }
  const s = String(val).trim()
  const d = new Date(s)
  if (isNaN(d.getTime())) return null
  return d.toISOString().split('T')[0]
}

async function batchInsert(table: string, rows: Record<string, unknown>[], upsertColumn?: string) {
  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    let query
    if (upsertColumn) {
      query = supabase.from(table).upsert(batch, { onConflict: upsertColumn })
    } else {
      query = supabase.from(table).insert(batch)
    }
    const { error } = await query
    if (error) {
      console.error(`  Error inserting batch ${i / BATCH_SIZE + 1} into ${table}:`, error.message)
      // Try inserting one by one to identify bad rows
      for (const row of batch) {
        const { error: rowError } = upsertColumn
          ? await supabase.from(table).upsert(row, { onConflict: upsertColumn })
          : await supabase.from(table).insert(row)
        if (rowError) {
          console.error(`    Row error:`, rowError.message, JSON.stringify(row).slice(0, 200))
        } else {
          inserted++
        }
      }
    } else {
      inserted += batch.length
    }
    process.stdout.write(`  ${table}: ${inserted}/${rows.length} rows\r`)
  }
  console.log(`  ${table}: ${inserted}/${rows.length} rows inserted`)
  return inserted
}

// ─── Main Migration ──────────────────────────────────────────

async function migrate() {
  // Find the Excel file
  const possiblePaths = [
    path.resolve(process.argv[2] || ''),
    path.resolve('data/flexbone-crm.xlsx'),
    path.resolve('flexbone-crm.xlsx'),
    path.resolve('../flexbone-crm.xlsx'),
    path.resolve('data/crm.xlsx'),
  ]

  let excelPath = ''
  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      excelPath = p
      break
    }
  }

  if (!excelPath) {
    console.error('Excel file not found. Pass the path as an argument:')
    console.error('  npm run migrate -- /path/to/file.xlsx')
    process.exit(1)
  }

  console.log(`Reading Excel file: ${excelPath}`)
  const workbook = XLSX.readFile(excelPath)
  console.log(`Sheets found: ${workbook.SheetNames.join(', ')}`)

  // ─── Step 1: Companies from crm-companies ────────────────

  console.log('\n=== Step 1: Import Companies ===')
  const companiesSheet = workbook.Sheets['crm-companies']
  if (!companiesSheet) {
    console.error('Sheet "crm-companies" not found')
    process.exit(1)
  }

  const companiesRaw = XLSX.utils.sheet_to_json(companiesSheet) as Record<string, unknown>[]
  console.log(`  Raw company rows: ${companiesRaw.length}`)

  // Deduplicate by company name
  const companyMap = new Map<string, Record<string, unknown>>()

  for (const row of companiesRaw) {
    const companyName = str(row['Company']) || str(row['company_name']) || str(row['Company Name'])
    if (!companyName) continue

    const key = companyName.toLowerCase().trim()
    if (companyMap.has(key)) continue

    companyMap.set(key, {
      company_name: companyName,
      clean_company_name: str(row['Clean-Company-Name']) || str(row['Colloquial']) || str(row['clean_company_name']),
      website: str(row['Website']) || str(row['website']),
      city: str(row['City']) || str(row['city']),
      state: str(row['State']) || str(row['state']),
      company_size: num(row['Company Size']) || num(row['# Employees']),
      flexbone_category: mapEnum(row['Flexbone Category'] || row['flexbone_category'], CATEGORY_MAP),
      source: mapEnum(row['Source'] || row['source'], SOURCE_MAP) || 'Import',
      company_type: str(row['Company_Type']) || str(row['Company Type']),
      ehr: str(row['EHR']) || str(row['ehr']),
      contact_count: num(row['# of contacts']) || num(row['contact_count']) || 0,
    })
  }

  console.log(`  Unique companies: ${companyMap.size}`)

  // Also pull in ai-crm-companies
  const aiCompaniesSheet = workbook.Sheets['ai-crm-companies']
  if (aiCompaniesSheet) {
    const aiCompaniesRaw = XLSX.utils.sheet_to_json(aiCompaniesSheet) as Record<string, unknown>[]
    console.log(`  ai-crm-companies rows: ${aiCompaniesRaw.length}`)
    let added = 0
    for (const row of aiCompaniesRaw) {
      const companyName = str(row['Company']) || str(row['company_name']) || str(row['Company Name'])
      if (!companyName) continue
      const key = companyName.toLowerCase().trim()
      if (companyMap.has(key)) continue
      companyMap.set(key, {
        company_name: companyName,
        clean_company_name: str(row['Clean-Company-Name']) || str(row['Colloquial']),
        website: str(row['Website']),
        city: str(row['City']),
        state: str(row['State']),
        company_size: num(row['Company Size']) || num(row['# Employees']),
        flexbone_category: mapEnum(row['Flexbone Category'], CATEGORY_MAP),
        source: mapEnum(row['Source'], SOURCE_MAP) || 'Import',
        company_type: str(row['Company_Type']) || str(row['Company Type']),
        ehr: str(row['EHR']),
        contact_count: num(row['# of contacts']) || 0,
      })
      added++
    }
    console.log(`  Added ${added} companies from ai-crm-companies`)
  }

  // Insert companies
  const companyRows = Array.from(companyMap.values())
  await batchInsert('companies', companyRows)

  // Build company name -> id lookup
  console.log('\n  Building company lookup...')
  const companyLookup = new Map<string, string>()
  let offset = 0
  const PAGE_SIZE = 1000
  while (true) {
    const { data, error } = await supabase
      .from('companies')
      .select('id, company_name')
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) {
      console.error('  Error fetching companies:', error.message)
      break
    }
    if (!data || data.length === 0) break

    for (const c of data) {
      companyLookup.set(c.company_name.toLowerCase().trim(), c.id)
    }
    offset += data.length
    if (data.length < PAGE_SIZE) break
  }
  console.log(`  Company lookup built: ${companyLookup.size} entries`)

  // ─── Step 2: Enrich with Accounts sheet ──────────────────

  console.log('\n=== Step 2: Enrich Companies from Accounts ===')
  const accountsSheet = workbook.Sheets['Accounts']
  if (accountsSheet) {
    const accountsRaw = XLSX.utils.sheet_to_json(accountsSheet) as Record<string, unknown>[]
    console.log(`  Accounts rows: ${accountsRaw.length}`)
    let enriched = 0

    for (const row of accountsRaw) {
      const companyName = str(row['Company']) || str(row['Account Name']) || str(row['company_name'])
      if (!companyName) continue
      const companyId = companyLookup.get(companyName.toLowerCase().trim())
      if (!companyId) continue

      const updates: Record<string, unknown> = {}
      if (str(row['Specialty'])) updates.specialty = str(row['Specialty'])
      if (str(row['Subspecialties'])) updates.subspecialties = str(row['Subspecialties'])
      if (str(row['EHR Vendor']) || str(row['EHR'])) updates.ehr_vendor = str(row['EHR Vendor']) || str(row['EHR'])
      if (str(row['Patient Portal'])) updates.patient_portal = str(row['Patient Portal'])
      if (row['Has ASC'] !== undefined) updates.has_asc = bool(row['Has ASC'])
      if (num(row['ASC/OR Count']) !== null) updates.asc_or_count = num(row['ASC/OR Count'])
      if (str(row['Surgeries Per Year'])) updates.surgeries_per_year = str(row['Surgeries Per Year'])
      if (num(row['Locations']) !== null) updates.locations_count = num(row['Locations'])
      if (num(row['Founded Year']) || num(row['Founded'])) updates.founded_year = num(row['Founded Year']) || num(row['Founded'])
      if (str(row['Practice NPI'])) updates.practice_npi = str(row['Practice NPI'])
      if (str(row['ASC NPI'])) updates.asc_npi = str(row['ASC NPI'])
      if (str(row['Insurance Plans Accepted'])) updates.insurance_plans_accepted = str(row['Insurance Plans Accepted'])
      if (str(row['High Volume CPT Codes'])) updates.high_volume_cpt_codes = str(row['High Volume CPT Codes'])
      if (str(row['High Volume Diagnostic CPT Codes'])) updates.high_volume_diagnostic_cpt_codes = str(row['High Volume Diagnostic CPT Codes'])

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('companies').update(updates).eq('id', companyId)
        if (!error) enriched++
      }
    }
    console.log(`  Enriched ${enriched} companies from Accounts`)
  } else {
    console.log('  Accounts sheet not found, skipping')
  }

  // ─── Step 3: Enrich with ASC-without-contact-list (Apollo) ─

  console.log('\n=== Step 3: Enrich Companies from Apollo Data ===')
  const apolloSheet = workbook.Sheets['ASC-without-contact-list']
  if (apolloSheet) {
    const apolloRaw = XLSX.utils.sheet_to_json(apolloSheet) as Record<string, unknown>[]
    console.log(`  Apollo rows: ${apolloRaw.length}`)
    let enriched = 0

    for (const row of apolloRaw) {
      const companyName = str(row['Company']) || str(row['Organization Name']) || str(row['company_name'])
      if (!companyName) continue
      const companyId = companyLookup.get(companyName.toLowerCase().trim())
      if (!companyId) {
        // Create the company if it doesn't exist
        const newCompany: Record<string, unknown> = {
          company_name: companyName,
          city: str(row['City']),
          state: str(row['State']),
          company_size: num(row['# Employees']),
          source: 'Apollo',
          industry: str(row['Industry']),
          company_linkedin_url: str(row['Company Linkedin Url']),
          website: str(row['Website']),
          company_phone: str(row['Company Phone']),
          annual_revenue: num(row['Annual Revenue']),
          short_description: str(row['Short Description']),
          apollo_account_id: str(row['Apollo Account Id']),
        }
        const { data, error } = await supabase.from('companies').insert(newCompany).select('id').single()
        if (!error && data) {
          companyLookup.set(companyName.toLowerCase().trim(), data.id)
          enriched++
        }
        continue
      }

      const updates: Record<string, unknown> = {}
      if (str(row['Industry'])) updates.industry = str(row['Industry'])
      if (str(row['Company Linkedin Url'])) updates.company_linkedin_url = str(row['Company Linkedin Url'])
      if (str(row['Facebook Url'])) updates.facebook_url = str(row['Facebook Url'])
      if (str(row['Twitter Url'])) updates.twitter_url = str(row['Twitter Url'])
      if (str(row['Company Street'])) updates.company_street = str(row['Company Street'])
      if (str(row['Company Postal Code'])) updates.company_postal_code = str(row['Company Postal Code'])
      if (str(row['Company Phone'])) updates.company_phone = str(row['Company Phone'])
      if (str(row['Technologies'])) updates.technologies = str(row['Technologies'])
      if (num(row['Total Funding']) !== null) updates.total_funding = num(row['Total Funding'])
      if (str(row['Latest Funding'])) updates.latest_funding = str(row['Latest Funding'])
      if (num(row['Latest Funding Amount']) !== null) updates.latest_funding_amount = num(row['Latest Funding Amount'])
      if (num(row['Annual Revenue']) !== null) updates.annual_revenue = num(row['Annual Revenue'])
      if (str(row['SIC Codes'])) updates.sic_codes = str(row['SIC Codes'])
      if (str(row['NAICS Codes'])) updates.naics_codes = str(row['NAICS Codes'])
      if (str(row['Short Description'])) updates.short_description = str(row['Short Description'])
      if (str(row['Logo Url'])) updates.logo_url = str(row['Logo Url'])
      if (str(row['Subsidiary Of'])) updates.subsidiary_of = str(row['Subsidiary Of'])
      if (str(row['Apollo Account Id'])) updates.apollo_account_id = str(row['Apollo Account Id'])
      if (str(row['Keywords'])) updates.keywords = str(row['Keywords'])

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('companies').update(updates).eq('id', companyId)
        if (!error) enriched++
      }
    }
    console.log(`  Enriched/added ${enriched} companies from Apollo data`)
  } else {
    console.log('  ASC-without-contact-list sheet not found, skipping')
  }

  // ─── Step 4: Import Contacts from crm-contacts ───────────

  console.log('\n=== Step 4: Import Contacts from crm-contacts ===')
  const contactsSheet = workbook.Sheets['crm-contacts']
  if (!contactsSheet) {
    console.error('Sheet "crm-contacts" not found')
    process.exit(1)
  }

  const contactsRaw = XLSX.utils.sheet_to_json(contactsSheet) as Record<string, unknown>[]
  console.log(`  Raw contact rows: ${contactsRaw.length}`)

  const contactRows: Record<string, unknown>[] = []
  for (const row of contactsRaw) {
    const firstName = str(row['First Name']) || str(row['first_name'])
    if (!firstName) continue

    const companyName = str(row['Company']) || str(row['company'])
    const companyId = companyName ? companyLookup.get(companyName.toLowerCase().trim()) || null : null

    contactRows.push({
      company_id: companyId,
      first_name: firstName,
      last_name: str(row['Last Name']) || str(row['last_name']),
      title: str(row['Title']) || str(row['title']),
      colloquial_title: str(row['Colloquial-Title']) || str(row['colloquial_title']),
      email: str(row['Email']) || str(row['email']),
      secondary_email: str(row['Secondary Email']) || str(row['secondary_email']),
      linkedin: str(row['LinkedIn']) || str(row['linkedin']),
      phone: str(row['Phone']) || str(row['phone']),
      owner: str(row['Owner']) || str(row['owner']),
      stage: mapEnum(row['Stage'] || row['stage'], STAGE_MAP) || 'new',
      priority_tier: mapEnum(row['Priority Tier'] || row['priority_tier'], PRIORITY_MAP) || 'unassigned',
      flexbone_category: mapEnum(row['Flexbone Category'] || row['flexbone_category'], CATEGORY_MAP),
      source: mapEnum(row['Source'] || row['source'], SOURCE_MAP) || 'Import',
      campaign_batch: str(row['Campaign Batch']) || str(row['campaign_batch']),
      campaign_start_date: parseDate(row['Campaign Start Date'] || row['campaign_start_date']),
      last_channel: str(row['Last Channel']) || str(row['last_channel']),
      last_engaged_by: str(row['Last Engaged By']) || str(row['last_engaged_by']),
      last_contacted_date: parseDate(row['Last Contacted Date'] || row['last_contacted_date']),
      engagement_notes: str(row['Engagement Notes']) || str(row['engagement_notes']),
      date_imported: parseDate(row['Date Imported'] || row['date_imported']),
      original_company_name: companyName,
      original_sheet: 'crm-contacts',
    })
  }

  await batchInsert('contacts', contactRows)

  // ─── Step 5: Import Contacts from Campaign Sheets ────────

  const campaignSheets = [
    'feb-bpo', 'jan-billing', 'jan-rcm',
    'jan-asc-ceos', 'jan-asc-campaign', 'jan-asc-assoc',
  ]

  console.log('\n=== Step 5: Import Campaign Sheet Contacts ===')
  for (const sheetName of campaignSheets) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
      console.log(`  Sheet "${sheetName}" not found, skipping`)
      continue
    }

    const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[]
    console.log(`  Processing ${sheetName}: ${rows.length} rows`)

    const campaignContacts: Record<string, unknown>[] = []
    for (const row of rows) {
      const firstName = str(row['First Name']) || str(row['first_name']) || str(row['First name'])
      if (!firstName) continue

      const companyName = str(row['Company']) || str(row['company']) || str(row['Company Name'])
      const companyId = companyName ? companyLookup.get(companyName.toLowerCase().trim()) || null : null

      campaignContacts.push({
        company_id: companyId,
        first_name: firstName,
        last_name: str(row['Last Name']) || str(row['last_name']) || str(row['Last name']),
        title: str(row['Title']) || str(row['title']),
        email: str(row['Email']) || str(row['email']),
        linkedin: str(row['LinkedIn']) || str(row['linkedin']) || str(row['Person Linkedin Url']),
        phone: str(row['Phone']) || str(row['phone']),
        stage: mapEnum(row['Stage'], STAGE_MAP) || 'new',
        flexbone_category: mapEnum(row['Flexbone Category'], CATEGORY_MAP),
        source: mapEnum(row['Source'], SOURCE_MAP) || 'Import',
        campaign_batch: sheetName,
        original_company_name: companyName,
        original_sheet: sheetName,
      })
    }

    if (campaignContacts.length > 0) {
      await batchInsert('contacts', campaignContacts)
    }
  }

  // ─── Step 6: Import Company Enrichments ──────────────────

  console.log('\n=== Step 6: Import Company Enrichments ===')
  const enrichmentSheet = workbook.Sheets['company-enrichment']
  if (enrichmentSheet) {
    const enrichmentRaw = XLSX.utils.sheet_to_json(enrichmentSheet) as Record<string, unknown>[]
    console.log(`  Enrichment rows: ${enrichmentRaw.length}`)

    const enrichmentRows: Record<string, unknown>[] = []
    for (const row of enrichmentRaw) {
      const companyName = str(row['Company']) || str(row['company_name']) || str(row['Company Name'])
      if (!companyName) continue
      const companyId = companyLookup.get(companyName.toLowerCase().trim()) || null

      enrichmentRows.push({
        company_id: companyId,
        facility_type: str(row['Facility Type']) || str(row['facility_type']),
        parent_org: str(row['Parent Org']) || str(row['parent_org']),
        locations: num(row['Locations']) || num(row['locations']),
        providers: num(row['Providers']) || num(row['providers']),
        operating_rooms: num(row['Operating Rooms']) || num(row['operating_rooms']),
        annual_cases: num(row['Annual Cases']) || num(row['annual_cases']),
        estimated_revenue: num(row['Estimated Revenue']) || num(row['estimated_revenue']),
        revenue_math: str(row['Revenue Math']) || str(row['revenue_math']),
        specialties: str(row['Specialties']) || str(row['specialties']),
        facility_hook: str(row['Facility Hook']) || str(row['facility_hook']),
        cpt_1_code: str(row['CPT 1 Code']) || str(row['cpt_1_code']),
        cpt_1_description: str(row['CPT 1 Description']) || str(row['cpt_1_description']),
        cpt_1_cold_email_desc: str(row['CPT 1 Cold Email Desc']) || str(row['cpt_1_cold_email_desc']),
        cpt_1_volume: num(row['CPT 1 Volume']) || num(row['cpt_1_volume']),
        cpt_1_reimbursement: num(row['CPT 1 Reimbursement']) || num(row['cpt_1_reimbursement']),
        cpt_2_code: str(row['CPT 2 Code']) || str(row['cpt_2_code']),
        cpt_2_description: str(row['CPT 2 Description']) || str(row['cpt_2_description']),
        cpt_2_cold_email_desc: str(row['CPT 2 Cold Email Desc']) || str(row['cpt_2_cold_email_desc']),
        cpt_2_volume: num(row['CPT 2 Volume']) || num(row['cpt_2_volume']),
        cpt_2_reimbursement: num(row['CPT 2 Reimbursement']) || num(row['cpt_2_reimbursement']),
        cpt_3_code: str(row['CPT 3 Code']) || str(row['cpt_3_code']),
        cpt_3_description: str(row['CPT 3 Description']) || str(row['cpt_3_description']),
        cpt_3_cold_email_desc: str(row['CPT 3 Cold Email Desc']) || str(row['cpt_3_cold_email_desc']),
        cpt_3_volume: num(row['CPT 3 Volume']) || num(row['cpt_3_volume']),
        cpt_3_reimbursement: num(row['CPT 3 Reimbursement']) || num(row['cpt_3_reimbursement']),
        cpt_hook: str(row['CPT Hook']) || str(row['cpt_hook']),
        ehr_system: str(row['EHR System']) || str(row['ehr_system']),
        ehr_confidence: str(row['EHR Confidence']) || str(row['ehr_confidence']),
        ehr_evidence: str(row['EHR Evidence']) || str(row['ehr_evidence']),
        patient_portal: bool(row['Patient Portal'] || row['patient_portal']),
        patient_portal_url: str(row['Patient Portal URL']) || str(row['patient_portal_url']),
        online_scheduling: bool(row['Online Scheduling'] || row['online_scheduling']),
        chat_feature: bool(row['Chat Feature'] || row['chat_feature']),
        other_tech: str(row['Other Tech']) || str(row['other_tech']),
        tech_hook: str(row['Tech Hook']) || str(row['tech_hook']),
        insurances_accepted: str(row['Insurances Accepted']) || str(row['insurances_accepted']),
        insurances_count: num(row['Insurances Count']) || num(row['insurances_count']) || 0,
        accepts_medicare: bool(row['Accepts Medicare'] || row['accepts_medicare']),
        accepts_medicaid: bool(row['Accepts Medicaid'] || row['accepts_medicaid']),
        payer_gaps: str(row['Payer Gaps']) || str(row['payer_gaps']),
        payer_hook: str(row['Payer Hook']) || str(row['payer_hook']),
        forms_online: bool(row['Forms Online'] || row['forms_online']),
        form_format: str(row['Form Format']) || str(row['form_format']),
        forms_hook: str(row['Forms Hook']) || str(row['forms_hook']),
        competitor_1: str(row['Competitor 1']) || str(row['competitor_1']),
        competitor_2: str(row['Competitor 2']) || str(row['competitor_2']),
        competitor_3: str(row['Competitor 3']) || str(row['competitor_3']),
        competitor_hook: str(row['Competitor Hook']) || str(row['competitor_hook']),
        currently_hiring: bool(row['Currently Hiring'] || row['currently_hiring']),
        open_roles: str(row['Open Roles']) || str(row['open_roles']),
        staffing_hook: str(row['Staffing Hook']) || str(row['staffing_hook']),
        google_rating: num(row['Google Rating']) || num(row['google_rating']),
        google_reviews: num(row['Google Reviews']) || num(row['google_reviews']),
        review_complaints: str(row['Review Complaints']) || str(row['review_complaints']),
        review_hook: str(row['Review Hook']) || str(row['review_hook']),
        contact_1_name: str(row['Contact 1 Name']) || str(row['contact_1_name']),
        contact_1_title: str(row['Contact 1 Title']) || str(row['contact_1_title']),
        contact_1_email: str(row['Contact 1 Email']) || str(row['contact_1_email']),
        contact_2_name: str(row['Contact 2 Name']) || str(row['contact_2_name']),
        contact_2_title: str(row['Contact 2 Title']) || str(row['contact_2_title']),
        contact_2_email: str(row['Contact 2 Email']) || str(row['contact_2_email']),
        contact_3_name: str(row['Contact 3 Name']) || str(row['contact_3_name']),
        contact_3_title: str(row['Contact 3 Title']) || str(row['contact_3_title']),
        contact_3_email: str(row['Contact 3 Email']) || str(row['contact_3_email']),
        general_email: str(row['General Email']) || str(row['general_email']),
        general_phone: str(row['General Phone']) || str(row['general_phone']),
        best_contact_name: str(row['Best Contact Name']) || str(row['best_contact_name']),
        best_contact_title: str(row['Best Contact Title']) || str(row['best_contact_title']),
        best_contact_reason: str(row['Best Contact Reason']) || str(row['best_contact_reason']),
        news_hooks: str(row['News Hooks']) || str(row['news_hooks']),
        outreach_angle: str(row['Outreach Angle']) || str(row['outreach_angle']),
        best_subject_line: str(row['Best Subject Line']) || str(row['best_subject_line']),
        best_opening_sentence: str(row['Best Opening Sentence']) || str(row['best_opening_sentence']),
      })
    }

    await batchInsert('company_enrichments', enrichmentRows)
  } else {
    console.log('  company-enrichment sheet not found, skipping')
  }

  // ─── Step 7: Import Procedure Intelligence ───────────────

  console.log('\n=== Step 7: Import Procedure Intelligence ===')
  const procSheet = workbook.Sheets['procedure_intelligence']
  if (procSheet) {
    const procRaw = XLSX.utils.sheet_to_json(procSheet) as Record<string, unknown>[]
    console.log(`  Procedure intelligence rows: ${procRaw.length}`)

    const procRows: Record<string, unknown>[] = []
    for (const row of procRaw) {
      const cptCode = str(row['CPT Code']) || str(row['cpt_code']) || str(row['CPT'])
      if (!cptCode) continue

      const companyName = str(row['Company']) || str(row['company_name'])
      const companyId = companyName ? companyLookup.get(companyName.toLowerCase().trim()) || null : null

      procRows.push({
        company_id: companyId,
        cpt_code: cptCode,
        description: str(row['Description']) || str(row['description']),
        category: str(row['Category']) || str(row['category']),
        volume_level: str(row['Volume Level']) || str(row['volume_level']) || str(row['Volume']),
        notes: str(row['Notes']) || str(row['notes']),
      })
    }

    await batchInsert('procedure_intelligence', procRows)
  } else {
    console.log('  procedure_intelligence sheet not found, skipping')
  }

  // ─── Step 8: Create Campaign Batches ─────────────────────

  console.log('\n=== Step 8: Create Campaign Batches ===')
  // Collect unique campaign batch names from contacts
  const { data: batchNames } = await supabase
    .from('contacts')
    .select('campaign_batch')
    .not('campaign_batch', 'is', null)

  const uniqueBatches = new Set<string>()
  if (batchNames) {
    for (const row of batchNames) {
      if (row.campaign_batch) uniqueBatches.add(row.campaign_batch)
    }
  }
  // Also add campaign sheet names
  for (const name of campaignSheets) {
    uniqueBatches.add(name)
  }

  console.log(`  Unique campaign batches: ${uniqueBatches.size}`)
  const batchRows = Array.from(uniqueBatches).map(name => ({ name }))
  if (batchRows.length > 0) {
    await batchInsert('campaign_batches', batchRows, 'name')
  }

  // ─── Summary ─────────────────────────────────────────────

  console.log('\n=== Migration Summary ===')
  const tables = ['companies', 'contacts', 'company_enrichments', 'procedure_intelligence', 'campaign_batches']
  for (const table of tables) {
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
    console.log(`  ${table}: ${count} rows`)
  }

  console.log('\nMigration complete!')
}

// Run
migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
