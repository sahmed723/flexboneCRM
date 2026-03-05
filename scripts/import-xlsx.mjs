/**
 * Import xlsx data into Supabase CRM tables.
 *
 * Usage: node scripts/import-xlsx.mjs
 *
 * Imports from: flexbone-crm-master (1).xlsx
 *   - crm-companies   → companies table
 *   - crm-contacts    → contacts table (with company_id FK)
 *   - company-enrichment → company_enrichments table
 *   - Accounts         → merge extra fields into companies
 */

import XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const XLSX_PATH = resolve(__dirname, '../../flexbone-crm-master (1).xlsx')
const BATCH_SIZE = 500

// ── Valid enum values ──
const VALID_CATEGORIES = new Set(['ASC', 'SNF', 'BPO', 'Health System', 'Insurer', 'Optometry', 'DSO', 'Newsletter', 'ASC Association'])
const VALID_STAGES = new Set(['new', 'contacted', 'qualified', 'demo_scheduled', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost', 'churned'])
const VALID_SOURCES = new Set(['Apollo', 'Beckers ASC Review', 'ASCA.org', 'GA_Urology', 'GA_Eye_Partners', 'Resurgens', 'Orlando_Health_Execs', 'Manual', 'Import', 'Other'])

function normalizeStage(raw) {
  if (!raw) return 'new'
  const s = raw.toString().trim().toLowerCase().replace(/\s+/g, '_')
  if (VALID_STAGES.has(s)) return s
  // Map common variations
  const map = {
    'new': 'new', 'contacted': 'contacted', 'qualified': 'qualified',
    'demo scheduled': 'demo_scheduled', 'demo_scheduled': 'demo_scheduled',
    'proposal sent': 'proposal_sent', 'proposal_sent': 'proposal_sent',
    'negotiation': 'negotiation', 'closed won': 'closed_won', 'closed_won': 'closed_won',
    'closed lost': 'closed_lost', 'closed_lost': 'closed_lost', 'churned': 'churned',
  }
  return map[raw.toString().trim().toLowerCase()] || 'new'
}

function normalizeCategory(raw) {
  if (!raw) return null
  const s = raw.toString().trim()
  if (VALID_CATEGORIES.has(s)) return s
  // Try case-insensitive match
  for (const c of VALID_CATEGORIES) {
    if (c.toLowerCase() === s.toLowerCase()) return c
  }
  return null
}

function normalizeSource(raw) {
  if (!raw) return 'Import'
  const s = raw.toString().trim()
  if (VALID_SOURCES.has(s)) return s
  // Common mappings
  if (s.toLowerCase().includes('apollo')) return 'Apollo'
  if (s.toLowerCase().includes('becker')) return 'Beckers ASC Review'
  if (s.toLowerCase().includes('asca')) return 'ASCA.org'
  return 'Import'
}

function excelDateToISO(serial) {
  if (!serial || typeof serial !== 'number') return null
  // Excel serial date: days since 1900-01-01 (with bug for 1900-02-29)
  const utc_days = Math.floor(serial - 25569)
  const d = new Date(utc_days * 86400 * 1000)
  return d.toISOString().slice(0, 10)
}

function cleanText(val) {
  if (val === null || val === undefined) return null
  const s = val.toString().trim()
  if (s === '' || s === '#REF!' || s === 'N/A' || s === 'n/a' || s === 'null' || s === 'undefined') return null
  return s
}

function cleanInt(val) {
  if (val === null || val === undefined) return null
  const n = parseInt(val, 10)
  return isNaN(n) ? null : n
}

function cleanBool(val) {
  if (val === null || val === undefined) return false
  if (typeof val === 'boolean') return val
  const s = val.toString().trim().toLowerCase()
  return s === 'yes' || s === 'true' || s === '1'
}

function cleanDecimal(val) {
  if (val === null || val === undefined) return null
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

async function batchUpsert(table, rows, conflictCol, label) {
  let inserted = 0
  let errors = 0
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from(table)
      .upsert(batch, { onConflict: conflictCol, ignoreDuplicates: false })

    if (error) {
      console.error(`  ✗ ${label} batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`)
      errors += batch.length
    } else {
      inserted += batch.length
    }
    process.stdout.write(`\r  ${label}: ${inserted.toLocaleString()} / ${rows.length.toLocaleString()} rows`)
  }
  console.log(`\n  ✓ ${label}: ${inserted.toLocaleString()} inserted, ${errors} errors`)
  return inserted
}

async function main() {
  console.log('Reading xlsx file...')
  const wb = XLSX.readFile(XLSX_PATH)

  // ── Step 1: Import companies from crm-companies ──
  console.log('\n═══ Step 1: Importing companies from crm-companies ═══')
  const companySheet = XLSX.utils.sheet_to_json(wb.Sheets['crm-companies'])
  console.log(`  Found ${companySheet.length.toLocaleString()} rows`)

  const companyMap = new Map() // company_name -> row data (for FK lookup later)
  const companyRows = []

  for (const row of companySheet) {
    const companyName = cleanText(row['Company'])
    if (!companyName) continue

    const rec = {
      company_name: companyName,
      clean_company_name: cleanText(row['Clean-Company-Name']),
      website: cleanText(row['Website']),
      city: cleanText(row['City']),
      state: cleanText(row['State']),
      company_size: cleanInt(row['Company Size']),
      flexbone_category: normalizeCategory(row['Flexbone Category']),
      source: normalizeSource(row['Source']),
      company_type: cleanText(row['Company_Type']),
      ehr: cleanText(row['EHR']),
      contact_count: cleanInt(row['# of contacts']) || 0,
    }

    companyRows.push(rec)
    companyMap.set(companyName.toUpperCase(), rec)
  }

  // De-duplicate by company_name (keep first occurrence)
  const seen = new Set()
  const uniqueCompanyRows = companyRows.filter(r => {
    const key = r.company_name.toUpperCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`  Unique companies: ${uniqueCompanyRows.length.toLocaleString()}`)

  // Insert companies
  let compInserted = 0
  let compErrors = 0
  for (let i = 0; i < uniqueCompanyRows.length; i += BATCH_SIZE) {
    const batch = uniqueCompanyRows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('companies')
      .upsert(batch, { onConflict: 'company_name', ignoreDuplicates: true })

    if (error) {
      console.error(`  ✗ Company batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`)
      compErrors += batch.length
    } else {
      compInserted += batch.length
    }
    process.stdout.write(`\r  Companies: ${compInserted.toLocaleString()} / ${uniqueCompanyRows.length.toLocaleString()}`)
  }
  console.log(`\n  ✓ Companies: ${compInserted.toLocaleString()} upserted, ${compErrors} batch errors`)

  // ── Step 2: Build company_name → id lookup ──
  console.log('\n═══ Step 2: Building company ID lookup ═══')
  const companyIdMap = new Map() // UPPER(company_name) -> uuid
  let offset = 0
  const PAGE = 1000
  while (true) {
    const { data, error } = await supabase
      .from('companies')
      .select('id, company_name')
      .range(offset, offset + PAGE - 1)

    if (error) {
      console.error('  Error fetching companies:', error.message)
      break
    }
    if (!data || data.length === 0) break
    for (const c of data) {
      companyIdMap.set(c.company_name.toUpperCase(), c.id)
    }
    offset += data.length
    process.stdout.write(`\r  Loaded ${companyIdMap.size.toLocaleString()} company IDs`)
  }
  console.log(`\n  ✓ Company lookup ready: ${companyIdMap.size.toLocaleString()} entries`)

  // ── Step 3: Import contacts from crm-contacts ──
  console.log('\n═══ Step 3: Importing contacts from crm-contacts ═══')
  const contactSheet = XLSX.utils.sheet_to_json(wb.Sheets['crm-contacts'])
  console.log(`  Found ${contactSheet.length.toLocaleString()} rows`)

  const contactRows = []
  let unmatchedCompanies = 0

  for (const row of contactSheet) {
    const companyName = cleanText(row['Company'])
    const companyId = companyName ? companyIdMap.get(companyName.toUpperCase()) : null
    if (companyName && !companyId) unmatchedCompanies++

    const firstName = cleanText(row['First Name'])
    if (!firstName) continue // Skip rows without a first name

    const dateImported = typeof row['Date Imported'] === 'number'
      ? excelDateToISO(row['Date Imported'])
      : cleanText(row['Date Imported'])

    const campaignStartDate = typeof row['Campaign Start Date'] === 'number'
      ? excelDateToISO(row['Campaign Start Date'])
      : cleanText(row['Campaign Start Date'])

    const lastContactedDate = typeof row['Last Contacted Date'] === 'number'
      ? excelDateToISO(row['Last Contacted Date'])
      : cleanText(row['Last Contacted Date'])

    contactRows.push({
      company_id: companyId || null,
      first_name: firstName,
      last_name: cleanText(row['Last Name']),
      title: cleanText(row['Title']),
      colloquial_title: cleanText(row['Colloquial-Title']),
      email: cleanText(row['Email']),
      secondary_email: cleanText(row['Secondary Email']),
      linkedin: cleanText(row['LinkedIn']),
      phone: cleanText(row['Phone']),
      owner: cleanText(row['Owner']),
      stage: normalizeStage(row['Stage']),
      flexbone_category: normalizeCategory(row['Flexbone Category']),
      source: normalizeSource(row['Source']),
      campaign_batch: cleanText(row['Campaign Batch']),
      campaign_start_date: campaignStartDate,
      last_channel: cleanText(row['Last Channel']),
      last_engaged_by: cleanText(row['Last Engaged By']),
      last_contacted_date: lastContactedDate,
      engagement_notes: cleanText(row['Engagement Notes']),
      date_imported: dateImported,
      original_company_name: companyName,
    })
  }

  console.log(`  Valid contacts: ${contactRows.length.toLocaleString()}`)
  console.log(`  Unmatched companies: ${unmatchedCompanies.toLocaleString()}`)

  // Insert contacts in batches
  let ctInserted = 0
  let ctErrors = 0
  for (let i = 0; i < contactRows.length; i += BATCH_SIZE) {
    const batch = contactRows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('contacts')
      .insert(batch)

    if (error) {
      console.error(`\n  ✗ Contact batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`)
      ctErrors += batch.length
    } else {
      ctInserted += batch.length
    }
    process.stdout.write(`\r  Contacts: ${ctInserted.toLocaleString()} / ${contactRows.length.toLocaleString()}`)
  }
  console.log(`\n  ✓ Contacts: ${ctInserted.toLocaleString()} inserted, ${ctErrors} batch errors`)

  // ── Step 4: Import company enrichments ──
  console.log('\n═══ Step 4: Importing company enrichments ═══')
  const enrichSheet = XLSX.utils.sheet_to_json(wb.Sheets['company-enrichment'])
  console.log(`  Found ${enrichSheet.length.toLocaleString()} rows`)

  const enrichRows = []
  let enrichUnmatched = 0

  for (const row of enrichSheet) {
    const companyName = cleanText(row['Company'])
    const companyId = companyName ? companyIdMap.get(companyName.toUpperCase()) : null
    if (!companyId) { enrichUnmatched++; continue }

    const enrichedDate = typeof row['Enriched Date'] === 'number'
      ? new Date((row['Enriched Date'] - 25569) * 86400 * 1000).toISOString()
      : null

    enrichRows.push({
      company_id: companyId,
      facility_type: cleanText(row['Facility Type']),
      parent_org: cleanText(row['Parent Org']),
      locations: cleanInt(row['Locations']),
      providers: cleanInt(row['Providers']),
      operating_rooms: cleanInt(row['ORs']),
      annual_cases: cleanInt(row['Annual Cases']),
      estimated_revenue: cleanDecimal(row['Est Revenue']),
      revenue_math: cleanText(row['Revenue Math']),
      specialties: cleanText(row['Specialties']),
      facility_hook: cleanText(row['Facility Hook']),
      cpt_1_code: cleanText(row['CPT-1 Code']),
      cpt_1_description: cleanText(row['CPT-1 Description']),
      cpt_1_cold_email_desc: cleanText(row['CPT-1 Cold Email Desc']),
      cpt_1_volume: cleanInt(row['CPT-1 Volume']),
      cpt_1_reimbursement: cleanDecimal(row['CPT-1 Reimbursement']),
      cpt_2_code: cleanText(row['CPT-2 Code']),
      cpt_2_description: cleanText(row['CPT-2 Description']),
      cpt_2_cold_email_desc: cleanText(row['CPT-2 Cold Email Desc']),
      cpt_2_volume: cleanInt(row['CPT-2 Volume']),
      cpt_2_reimbursement: cleanDecimal(row['CPT-2 Reimbursement']),
      cpt_3_code: cleanText(row['CPT-3 Code']),
      cpt_3_description: cleanText(row['CPT-3 Description']),
      cpt_3_cold_email_desc: cleanText(row['CPT-3 Cold Email Desc']),
      cpt_3_volume: cleanInt(row['CPT-3 Volume']),
      cpt_3_reimbursement: cleanDecimal(row['CPT-3 Reimbursement']),
      cpt_hook: cleanText(row['CPT Hook']),
      ehr_system: cleanText(row['EHR System']),
      ehr_confidence: cleanText(row['EHR Confidence']),
      ehr_evidence: cleanText(row['EHR Evidence']),
      patient_portal: cleanBool(row['Patient Portal']),
      patient_portal_url: cleanText(row['Patient Portal URL']),
      online_scheduling: cleanBool(row['Online Scheduling']),
      chat_feature: cleanBool(row['Chat Feature']),
      other_tech: cleanText(row['Other Tech']),
      tech_hook: cleanText(row['Tech Hook']),
      insurances_accepted: cleanText(row['Insurances Accepted']),
      insurances_count: cleanInt(row['Insurances Count']) || 0,
      accepts_medicare: cleanBool(row['Medicare']),
      accepts_medicaid: cleanBool(row['Medicaid']),
      payer_gaps: cleanText(row['Payer Gaps']),
      payer_hook: cleanText(row['Payer Hook']),
      forms_online: cleanBool(row['Forms Online']),
      form_format: cleanText(row['Form Format']),
      forms_hook: cleanText(row['Forms Hook']),
      competitor_1: cleanText(row['Competitor-1']),
      competitor_2: cleanText(row['Competitor-2']),
      competitor_3: cleanText(row['Competitor-3']),
      competitor_hook: cleanText(row['Competitor Hook']),
      currently_hiring: cleanBool(row['Currently Hiring']),
      open_roles: cleanText(row['Open Roles']),
      staffing_hook: cleanText(row['Staffing Hook']),
      google_rating: cleanDecimal(row['Google Rating']),
      google_reviews: cleanInt(row['Google Reviews']),
      review_complaints: cleanText(row['Review Complaints']),
      review_hook: cleanText(row['Review Hook']),
      contact_1_name: cleanText(row['Contact-1 Name']),
      contact_1_title: cleanText(row['Contact-1 Title']),
      contact_1_email: cleanText(row['Contact-1 Email']),
      contact_2_name: cleanText(row['Contact-2 Name']),
      contact_2_title: cleanText(row['Contact-2 Title']),
      contact_2_email: cleanText(row['Contact-2 Email']),
      contact_3_name: cleanText(row['Contact-3 Name']),
      contact_3_title: cleanText(row['Contact-3 Title']),
      contact_3_email: cleanText(row['Contact-3 Email']),
      general_email: cleanText(row['General Email']),
      general_phone: cleanText(row['General Phone']),
      best_contact_name: cleanText(row['Best Contact Name']),
      best_contact_title: cleanText(row['Best Contact Title']),
      best_contact_reason: cleanText(row['Best Contact Reason']),
      news_hooks: cleanText(row['News Hooks']),
      outreach_angle: cleanText(row['Outreach Angle']),
      best_subject_line: cleanText(row['Best Subject Line']),
      best_opening_sentence: cleanText(row['Best Opening Sentence']),
      full_json: row['Full JSON'] ? (() => { try { return JSON.parse(row['Full JSON']) } catch { return null } })() : null,
      enriched_date: enrichedDate,
    })
  }

  console.log(`  Valid enrichments: ${enrichRows.length.toLocaleString()}`)
  console.log(`  Unmatched companies: ${enrichUnmatched}`)

  // Insert enrichments
  let enInserted = 0
  let enErrors = 0
  for (let i = 0; i < enrichRows.length; i += BATCH_SIZE) {
    const batch = enrichRows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('company_enrichments')
      .upsert(batch, { onConflict: 'company_id', ignoreDuplicates: false })

    if (error) {
      console.error(`\n  ✗ Enrichment batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`)
      enErrors += batch.length
    } else {
      enInserted += batch.length
    }
    process.stdout.write(`\r  Enrichments: ${enInserted.toLocaleString()} / ${enrichRows.length.toLocaleString()}`)
  }
  console.log(`\n  ✓ Enrichments: ${enInserted.toLocaleString()} upserted, ${enErrors} batch errors`)

  // ── Step 5: Merge Accounts sheet into companies ──
  console.log('\n═══ Step 5: Merging Accounts sheet into companies ═══')
  const accountsSheet = XLSX.utils.sheet_to_json(wb.Sheets['Accounts'])
  console.log(`  Found ${accountsSheet.length.toLocaleString()} rows`)

  let acctUpdated = 0
  let acctSkipped = 0

  for (const row of accountsSheet) {
    const accountName = cleanText(row['Account Name'])
    if (!accountName) continue
    const companyId = companyIdMap.get(accountName.toUpperCase())
    if (!companyId) { acctSkipped++; continue }

    const updates = {}
    if (row['Specialty']) updates.specialty = cleanText(row['Specialty'])
    if (row['Subspecialties']) updates.subspecialties = cleanText(row['Subspecialties'])
    if (row['EHR Vendor']) updates.ehr_vendor = cleanText(row['EHR Vendor'])
    if (row['Patient Portal']) updates.patient_portal = cleanText(row['Patient Portal'])
    if (row['Has ASC']) updates.has_asc = cleanBool(row['Has ASC'])
    if (row['ASC OR Count']) updates.asc_or_count = cleanInt(row['ASC OR Count'])
    if (row['Surgeries Per Year']) updates.surgeries_per_year = cleanText(row['Surgeries Per Year'])
    if (row['Locations Count']) updates.locations_count = cleanInt(row['Locations Count'])
    if (row['Founded Year']) updates.founded_year = cleanInt(row['Founded Year'])
    if (row['Practice NPI']) updates.practice_npi = cleanText(row['Practice NPI'])
    if (row['ASC NPI']) updates.asc_npi = cleanText(row['ASC NPI'])
    if (row['Insurance Plans Accepted']) updates.insurance_plans_accepted = cleanText(row['Insurance Plans Accepted'])
    if (row['High Volume CPT Codes']) updates.high_volume_cpt_codes = cleanText(row['High Volume CPT Codes'])
    if (row['High Volume Diagnostic CPT Codes']) updates.high_volume_diagnostic_cpt_codes = cleanText(row['High Volume Diagnostic CPT Codes'])
    if (row['Notes']) updates.notes = cleanText(row['Notes'])
    if (row['Website']) updates.website = cleanText(row['Website'])

    if (Object.keys(updates).length === 0) { acctSkipped++; continue }

    const { error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId)

    if (error) {
      console.error(`  ✗ Account "${accountName}": ${error.message}`)
    } else {
      acctUpdated++
    }
  }
  console.log(`  ✓ Accounts merged: ${acctUpdated} updated, ${acctSkipped} skipped (no match)`)

  // ── Summary ──
  console.log('\n═══════════════════════════════')
  console.log('  Import complete!')
  console.log('═══════════════════════════════')
}

main().catch(console.error)
