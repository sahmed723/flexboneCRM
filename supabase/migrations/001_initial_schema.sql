-- Flexbone CRM Initial Schema
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for fuzzy text search

-- ENUM TYPES
CREATE TYPE contact_stage AS ENUM (
  'new', 'contacted', 'qualified', 'demo_scheduled',
  'proposal_sent', 'negotiation', 'closed_won', 'closed_lost', 'churned'
);

CREATE TYPE flexbone_category AS ENUM (
  'ASC', 'SNF', 'BPO', 'Health System', 'Insurer',
  'Optometry', 'DSO', 'Newsletter', 'ASC Association'
);

CREATE TYPE priority_tier AS ENUM ('tier_1', 'tier_2', 'tier_3', 'unassigned');
CREATE TYPE contact_source AS ENUM (
  'Apollo', 'Beckers ASC Review', 'ASCA.org', 'GA_Urology',
  'GA_Eye_Partners', 'Resurgens', 'Orlando_Health_Execs', 'Manual', 'Import', 'Other'
);

-- COMPANIES TABLE (maps to crm-companies + ai-crm-companies sheets)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  clean_company_name TEXT,  -- from Clean-Company-Name / Colloquial
  website TEXT,
  city TEXT,
  state TEXT,
  company_size INTEGER,
  flexbone_category flexbone_category,
  source contact_source DEFAULT 'Import',
  company_type TEXT,  -- from Company_Type column
  ehr TEXT,
  contact_count INTEGER DEFAULT 0,

  -- From Accounts sheet
  specialty TEXT,
  subspecialties TEXT,
  ehr_vendor TEXT,
  patient_portal TEXT,
  has_asc BOOLEAN DEFAULT false,
  asc_or_count INTEGER,
  surgeries_per_year TEXT,
  locations_count INTEGER,
  founded_year INTEGER,
  practice_npi TEXT,
  asc_npi TEXT,
  insurance_plans_accepted TEXT,
  high_volume_cpt_codes TEXT,
  high_volume_diagnostic_cpt_codes TEXT,

  -- From ASC-without-contact-list (Apollo data)
  industry TEXT,
  company_linkedin_url TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  company_street TEXT,
  company_postal_code TEXT,
  company_phone TEXT,
  technologies TEXT,
  total_funding DECIMAL,
  latest_funding TEXT,
  latest_funding_amount DECIMAL,
  annual_revenue DECIMAL,
  sic_codes TEXT,
  naics_codes TEXT,
  short_description TEXT,
  logo_url TEXT,
  subsidiary_of TEXT,
  apollo_account_id TEXT,
  keywords TEXT,

  -- Metadata
  account_owner TEXT,
  account_stage TEXT DEFAULT 'Cold',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTACTS TABLE (maps to crm-contacts + campaign sheets)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,

  -- Core info
  first_name TEXT NOT NULL,
  last_name TEXT,
  title TEXT,
  colloquial_title TEXT,  -- simplified title
  email TEXT,
  secondary_email TEXT,
  linkedin TEXT,
  phone TEXT,

  -- CRM fields
  owner TEXT,  -- assigned sales rep
  stage contact_stage DEFAULT 'new',
  priority_tier priority_tier DEFAULT 'unassigned',
  flexbone_category flexbone_category,
  source contact_source DEFAULT 'Import',

  -- Campaign tracking
  campaign_batch TEXT,
  campaign_start_date DATE,
  last_channel TEXT,  -- email, linkedin, phone, etc.
  last_engaged_by TEXT,
  last_contacted_date DATE,
  engagement_notes TEXT,

  -- Import metadata
  date_imported DATE,
  original_company_name TEXT,  -- raw company name from import
  original_sheet TEXT,  -- which sheet this came from

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMPANY ENRICHMENT TABLE (maps to company-enrichment sheet - 77 columns)
CREATE TABLE company_enrichments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Facility info
  facility_type TEXT,
  parent_org TEXT,
  locations INTEGER,
  providers INTEGER,
  operating_rooms INTEGER,
  annual_cases INTEGER,
  estimated_revenue DECIMAL,
  revenue_math TEXT,
  specialties TEXT,
  facility_hook TEXT,

  -- CPT Code Intelligence (up to 3 procedures)
  cpt_1_code TEXT,
  cpt_1_description TEXT,
  cpt_1_cold_email_desc TEXT,
  cpt_1_volume INTEGER,
  cpt_1_reimbursement DECIMAL,
  cpt_2_code TEXT,
  cpt_2_description TEXT,
  cpt_2_cold_email_desc TEXT,
  cpt_2_volume INTEGER,
  cpt_2_reimbursement DECIMAL,
  cpt_3_code TEXT,
  cpt_3_description TEXT,
  cpt_3_cold_email_desc TEXT,
  cpt_3_volume INTEGER,
  cpt_3_reimbursement DECIMAL,
  cpt_hook TEXT,

  -- Technology stack
  ehr_system TEXT,
  ehr_confidence TEXT,
  ehr_evidence TEXT,
  patient_portal BOOLEAN DEFAULT false,
  patient_portal_url TEXT,
  online_scheduling BOOLEAN DEFAULT false,
  chat_feature BOOLEAN DEFAULT false,
  other_tech TEXT,
  tech_hook TEXT,

  -- Payer intelligence
  insurances_accepted TEXT,
  insurances_count INTEGER DEFAULT 0,
  accepts_medicare BOOLEAN DEFAULT false,
  accepts_medicaid BOOLEAN DEFAULT false,
  payer_gaps TEXT,
  payer_hook TEXT,

  -- Forms
  forms_online BOOLEAN DEFAULT false,
  form_format TEXT,
  forms_hook TEXT,

  -- Competitive landscape
  competitor_1 TEXT,
  competitor_2 TEXT,
  competitor_3 TEXT,
  competitor_hook TEXT,

  -- Staffing
  currently_hiring BOOLEAN DEFAULT false,
  open_roles TEXT,
  staffing_hook TEXT,

  -- Reviews
  google_rating DECIMAL,
  google_reviews INTEGER,
  review_complaints TEXT,
  review_hook TEXT,

  -- Key contacts from enrichment
  contact_1_name TEXT,
  contact_1_title TEXT,
  contact_1_email TEXT,
  contact_2_name TEXT,
  contact_2_title TEXT,
  contact_2_email TEXT,
  contact_3_name TEXT,
  contact_3_title TEXT,
  contact_3_email TEXT,
  general_email TEXT,
  general_phone TEXT,
  best_contact_name TEXT,
  best_contact_title TEXT,
  best_contact_reason TEXT,

  -- AI-generated outreach content
  news_hooks TEXT,
  outreach_angle TEXT,
  best_subject_line TEXT,
  best_opening_sentence TEXT,
  full_json JSONB,  -- complete enrichment JSON blob

  enriched_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROCEDURE INTELLIGENCE TABLE (maps to procedure_intelligence sheet)
CREATE TABLE procedure_intelligence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  cpt_code TEXT NOT NULL,
  description TEXT,
  category TEXT,
  volume_level TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CAMPAIGN BATCHES TABLE
CREATE TABLE campaign_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  contact_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVITIES / ENGAGEMENT LOG
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  user_id UUID,  -- who performed the action
  activity_type TEXT NOT NULL,  -- email, call, linkedin, meeting, note, enrichment
  channel TEXT,
  subject TEXT,
  body TEXT,
  outcome TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI ENRICHMENT JOBS TABLE
CREATE TABLE ai_enrichment_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL,  -- 'company_research', 'contact_research', 'outreach_draft'
  status TEXT DEFAULT 'pending',  -- pending, processing, completed, failed
  input_data JSONB,
  output_data JSONB,
  model_used TEXT DEFAULT 'claude-opus-4-6',
  tokens_used INTEGER,
  error_message TEXT,
  requested_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- USER PROFILES TABLE
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'sales_rep',  -- admin, sales_rep, viewer
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES for performance on 50K+ records
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_stage ON contacts(stage);
CREATE INDEX idx_contacts_category ON contacts(flexbone_category);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_owner ON contacts(owner);
CREATE INDEX idx_contacts_search ON contacts USING gin(
  (first_name || ' ' || COALESCE(last_name, '') || ' ' || COALESCE(email, '')) gin_trgm_ops
);
CREATE INDEX idx_companies_name ON companies USING gin(company_name gin_trgm_ops);
CREATE INDEX idx_companies_category ON companies(flexbone_category);
CREATE INDEX idx_companies_state ON companies(state);
CREATE INDEX idx_enrichments_company ON company_enrichments(company_id);
CREATE INDEX idx_activities_contact ON activities(contact_id);
CREATE INDEX idx_activities_company ON activities(company_id);
CREATE INDEX idx_procedure_intel_company ON procedure_intelligence(company_id);

-- ROW LEVEL SECURITY
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_enrichments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_enrichment_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedure_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_batches ENABLE ROW LEVEL SECURITY;

-- Policies: All authenticated users can read/write (small team)
CREATE POLICY "Authenticated users full access" ON companies FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access" ON contacts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access" ON company_enrichments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access" ON activities FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access" ON ai_enrichment_jobs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access" ON user_profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access" ON procedure_intelligence FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users full access" ON campaign_batches FOR ALL USING (auth.role() = 'authenticated');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER enrichments_updated_at BEFORE UPDATE ON company_enrichments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed initial users (run after Supabase auth is set up)
-- These are placeholders - actual users should be created via Supabase Auth
-- INSERT INTO auth.users (id, email) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'shafay@flexbone.ai'),
--   ('00000000-0000-0000-0000-000000000002', 'sayem@flexbone.ai')
-- ON CONFLICT DO NOTHING;

-- INSERT INTO user_profiles (id, email, full_name, role) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'shafay@flexbone.ai', 'Shafay Ahmed', 'admin'),
--   ('00000000-0000-0000-0000-000000000002', 'sayem@flexbone.ai', 'Sayem Hoque', 'admin')
-- ON CONFLICT DO NOTHING;
