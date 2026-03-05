export type ContactStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'demo_scheduled'
  | 'proposal_sent'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'
  | 'churned'

export type FlexboneCategory =
  | 'ASC'
  | 'SNF'
  | 'BPO'
  | 'Health System'
  | 'Insurer'
  | 'Optometry'
  | 'DSO'
  | 'Newsletter'
  | 'ASC Association'

export type PriorityTier = 'tier_1' | 'tier_2' | 'tier_3' | 'unassigned'

export type ContactSource =
  | 'Apollo'
  | 'Beckers ASC Review'
  | 'ASCA.org'
  | 'GA_Urology'
  | 'GA_Eye_Partners'
  | 'Resurgens'
  | 'Orlando_Health_Execs'
  | 'Manual'
  | 'Import'
  | 'Other'

export type UserRole = 'admin' | 'sales_rep' | 'viewer'

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company
        Insert: CompanyInsert
        Update: Partial<CompanyInsert>
      }
      contacts: {
        Row: Contact
        Insert: ContactInsert
        Update: Partial<ContactInsert>
      }
      company_enrichments: {
        Row: CompanyEnrichment
        Insert: CompanyEnrichmentInsert
        Update: Partial<CompanyEnrichmentInsert>
      }
      procedure_intelligence: {
        Row: ProcedureIntelligence
        Insert: ProcedureIntelligenceInsert
        Update: Partial<ProcedureIntelligenceInsert>
      }
      campaign_batches: {
        Row: CampaignBatch
        Insert: CampaignBatchInsert
        Update: Partial<CampaignBatchInsert>
      }
      activities: {
        Row: Activity
        Insert: ActivityInsert
        Update: Partial<ActivityInsert>
      }
      ai_enrichment_jobs: {
        Row: AIEnrichmentJob
        Insert: AIEnrichmentJobInsert
        Update: Partial<AIEnrichmentJobInsert>
      }
      user_profiles: {
        Row: UserProfile
        Insert: UserProfileInsert
        Update: Partial<UserProfileInsert>
      }
    }
    Enums: {
      contact_stage: ContactStage
      flexbone_category: FlexboneCategory
      priority_tier: PriorityTier
      contact_source: ContactSource
    }
  }
}

// ─── Companies ───────────────────────────────────────────────

export interface Company {
  id: string
  company_name: string
  clean_company_name: string | null
  website: string | null
  city: string | null
  state: string | null
  company_size: number | null
  flexbone_category: FlexboneCategory | null
  source: ContactSource
  company_type: string | null
  ehr: string | null
  contact_count: number
  specialty: string | null
  subspecialties: string | null
  ehr_vendor: string | null
  patient_portal: string | null
  has_asc: boolean
  asc_or_count: number | null
  surgeries_per_year: string | null
  locations_count: number | null
  founded_year: number | null
  practice_npi: string | null
  asc_npi: string | null
  insurance_plans_accepted: string | null
  high_volume_cpt_codes: string | null
  high_volume_diagnostic_cpt_codes: string | null
  industry: string | null
  company_linkedin_url: string | null
  facebook_url: string | null
  twitter_url: string | null
  company_street: string | null
  company_postal_code: string | null
  company_phone: string | null
  technologies: string | null
  total_funding: number | null
  latest_funding: string | null
  latest_funding_amount: number | null
  annual_revenue: number | null
  sic_codes: string | null
  naics_codes: string | null
  short_description: string | null
  logo_url: string | null
  subsidiary_of: string | null
  apollo_account_id: string | null
  keywords: string | null
  account_owner: string | null
  account_stage: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CompanyInsert {
  id?: string
  company_name: string
  clean_company_name?: string | null
  website?: string | null
  city?: string | null
  state?: string | null
  company_size?: number | null
  flexbone_category?: FlexboneCategory | null
  source?: ContactSource
  company_type?: string | null
  ehr?: string | null
  contact_count?: number
  specialty?: string | null
  subspecialties?: string | null
  ehr_vendor?: string | null
  patient_portal?: string | null
  has_asc?: boolean
  asc_or_count?: number | null
  surgeries_per_year?: string | null
  locations_count?: number | null
  founded_year?: number | null
  practice_npi?: string | null
  asc_npi?: string | null
  insurance_plans_accepted?: string | null
  high_volume_cpt_codes?: string | null
  high_volume_diagnostic_cpt_codes?: string | null
  industry?: string | null
  company_linkedin_url?: string | null
  facebook_url?: string | null
  twitter_url?: string | null
  company_street?: string | null
  company_postal_code?: string | null
  company_phone?: string | null
  technologies?: string | null
  total_funding?: number | null
  latest_funding?: string | null
  latest_funding_amount?: number | null
  annual_revenue?: number | null
  sic_codes?: string | null
  naics_codes?: string | null
  short_description?: string | null
  logo_url?: string | null
  subsidiary_of?: string | null
  apollo_account_id?: string | null
  keywords?: string | null
  account_owner?: string | null
  account_stage?: string
  notes?: string | null
}

// ─── Contacts ────────────────────────────────────────────────

export interface Contact {
  id: string
  company_id: string | null
  first_name: string
  last_name: string | null
  title: string | null
  colloquial_title: string | null
  email: string | null
  secondary_email: string | null
  linkedin: string | null
  phone: string | null
  owner: string | null
  stage: ContactStage
  priority_tier: PriorityTier
  flexbone_category: FlexboneCategory | null
  source: ContactSource
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
}

export interface ContactInsert {
  id?: string
  company_id?: string | null
  first_name: string
  last_name?: string | null
  title?: string | null
  colloquial_title?: string | null
  email?: string | null
  secondary_email?: string | null
  linkedin?: string | null
  phone?: string | null
  owner?: string | null
  stage?: ContactStage
  priority_tier?: PriorityTier
  flexbone_category?: FlexboneCategory | null
  source?: ContactSource
  campaign_batch?: string | null
  campaign_start_date?: string | null
  last_channel?: string | null
  last_engaged_by?: string | null
  last_contacted_date?: string | null
  engagement_notes?: string | null
  date_imported?: string | null
  original_company_name?: string | null
  original_sheet?: string | null
}

// ─── Company Enrichments ─────────────────────────────────────

export interface CompanyEnrichment {
  id: string
  company_id: string | null
  facility_type: string | null
  parent_org: string | null
  locations: number | null
  providers: number | null
  operating_rooms: number | null
  annual_cases: number | null
  estimated_revenue: number | null
  revenue_math: string | null
  specialties: string | null
  facility_hook: string | null
  cpt_1_code: string | null
  cpt_1_description: string | null
  cpt_1_cold_email_desc: string | null
  cpt_1_volume: number | null
  cpt_1_reimbursement: number | null
  cpt_2_code: string | null
  cpt_2_description: string | null
  cpt_2_cold_email_desc: string | null
  cpt_2_volume: number | null
  cpt_2_reimbursement: number | null
  cpt_3_code: string | null
  cpt_3_description: string | null
  cpt_3_cold_email_desc: string | null
  cpt_3_volume: number | null
  cpt_3_reimbursement: number | null
  cpt_hook: string | null
  ehr_system: string | null
  ehr_confidence: string | null
  ehr_evidence: string | null
  patient_portal: boolean
  patient_portal_url: string | null
  online_scheduling: boolean
  chat_feature: boolean
  other_tech: string | null
  tech_hook: string | null
  insurances_accepted: string | null
  insurances_count: number
  accepts_medicare: boolean
  accepts_medicaid: boolean
  payer_gaps: string | null
  payer_hook: string | null
  forms_online: boolean
  form_format: string | null
  forms_hook: string | null
  competitor_1: string | null
  competitor_2: string | null
  competitor_3: string | null
  competitor_hook: string | null
  currently_hiring: boolean
  open_roles: string | null
  staffing_hook: string | null
  google_rating: number | null
  google_reviews: number | null
  review_complaints: string | null
  review_hook: string | null
  contact_1_name: string | null
  contact_1_title: string | null
  contact_1_email: string | null
  contact_2_name: string | null
  contact_2_title: string | null
  contact_2_email: string | null
  contact_3_name: string | null
  contact_3_title: string | null
  contact_3_email: string | null
  general_email: string | null
  general_phone: string | null
  best_contact_name: string | null
  best_contact_title: string | null
  best_contact_reason: string | null
  news_hooks: string | null
  outreach_angle: string | null
  best_subject_line: string | null
  best_opening_sentence: string | null
  full_json: Record<string, unknown> | null
  enriched_date: string | null
  created_at: string
  updated_at: string
}

export interface CompanyEnrichmentInsert {
  id?: string
  company_id?: string | null
  facility_type?: string | null
  parent_org?: string | null
  locations?: number | null
  providers?: number | null
  operating_rooms?: number | null
  annual_cases?: number | null
  estimated_revenue?: number | null
  revenue_math?: string | null
  specialties?: string | null
  facility_hook?: string | null
  cpt_1_code?: string | null
  cpt_1_description?: string | null
  cpt_1_cold_email_desc?: string | null
  cpt_1_volume?: number | null
  cpt_1_reimbursement?: number | null
  cpt_2_code?: string | null
  cpt_2_description?: string | null
  cpt_2_cold_email_desc?: string | null
  cpt_2_volume?: number | null
  cpt_2_reimbursement?: number | null
  cpt_3_code?: string | null
  cpt_3_description?: string | null
  cpt_3_cold_email_desc?: string | null
  cpt_3_volume?: number | null
  cpt_3_reimbursement?: number | null
  cpt_hook?: string | null
  ehr_system?: string | null
  ehr_confidence?: string | null
  ehr_evidence?: string | null
  patient_portal?: boolean
  patient_portal_url?: string | null
  online_scheduling?: boolean
  chat_feature?: boolean
  other_tech?: string | null
  tech_hook?: string | null
  insurances_accepted?: string | null
  insurances_count?: number
  accepts_medicare?: boolean
  accepts_medicaid?: boolean
  payer_gaps?: string | null
  payer_hook?: string | null
  forms_online?: boolean
  form_format?: string | null
  forms_hook?: string | null
  competitor_1?: string | null
  competitor_2?: string | null
  competitor_3?: string | null
  competitor_hook?: string | null
  currently_hiring?: boolean
  open_roles?: string | null
  staffing_hook?: string | null
  google_rating?: number | null
  google_reviews?: number | null
  review_complaints?: string | null
  review_hook?: string | null
  contact_1_name?: string | null
  contact_1_title?: string | null
  contact_1_email?: string | null
  contact_2_name?: string | null
  contact_2_title?: string | null
  contact_2_email?: string | null
  contact_3_name?: string | null
  contact_3_title?: string | null
  contact_3_email?: string | null
  general_email?: string | null
  general_phone?: string | null
  best_contact_name?: string | null
  best_contact_title?: string | null
  best_contact_reason?: string | null
  news_hooks?: string | null
  outreach_angle?: string | null
  best_subject_line?: string | null
  best_opening_sentence?: string | null
  full_json?: Record<string, unknown> | null
  enriched_date?: string | null
}

// ─── Procedure Intelligence ──────────────────────────────────

export interface ProcedureIntelligence {
  id: string
  company_id: string | null
  cpt_code: string
  description: string | null
  category: string | null
  volume_level: string | null
  notes: string | null
  created_at: string
}

export interface ProcedureIntelligenceInsert {
  id?: string
  company_id?: string | null
  cpt_code: string
  description?: string | null
  category?: string | null
  volume_level?: string | null
  notes?: string | null
}

// ─── Campaign Batches ────────────────────────────────────────

export interface CampaignBatch {
  id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  status: string
  contact_count: number
  created_at: string
}

export interface CampaignBatchInsert {
  id?: string
  name: string
  description?: string | null
  start_date?: string | null
  end_date?: string | null
  status?: string
  contact_count?: number
}

// ─── Activities ──────────────────────────────────────────────

export interface Activity {
  id: string
  contact_id: string | null
  company_id: string | null
  user_id: string | null
  activity_type: string
  channel: string | null
  subject: string | null
  body: string | null
  outcome: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface ActivityInsert {
  id?: string
  contact_id?: string | null
  company_id?: string | null
  user_id?: string | null
  activity_type: string
  channel?: string | null
  subject?: string | null
  body?: string | null
  outcome?: string | null
  metadata?: Record<string, unknown> | null
}

// ─── AI Enrichment Jobs ─────────────────────────────────────

export interface AIEnrichmentJob {
  id: string
  company_id: string | null
  contact_id: string | null
  job_type: string
  status: string
  input_data: Record<string, unknown> | null
  output_data: Record<string, unknown> | null
  model_used: string
  tokens_used: number | null
  error_message: string | null
  requested_by: string | null
  created_at: string
  completed_at: string | null
}

export interface AIEnrichmentJobInsert {
  id?: string
  company_id?: string | null
  contact_id?: string | null
  job_type: string
  status?: string
  input_data?: Record<string, unknown> | null
  output_data?: Record<string, unknown> | null
  model_used?: string
  tokens_used?: number | null
  error_message?: string | null
  requested_by?: string | null
  completed_at?: string | null
}

// ─── User Profiles ───────────────────────────────────────────

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export interface UserProfileInsert {
  id: string
  email: string
  full_name: string
  role?: UserRole
  avatar_url?: string | null
}
