-- Enrichment configuration table for storing editable prompts and model settings
CREATE TABLE IF NOT EXISTS enrichment_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  value TEXT NOT NULL,
  config_type TEXT NOT NULL DEFAULT 'prompt', -- 'prompt' | 'model' | 'setting'
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE enrichment_config ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read config
CREATE POLICY "Authenticated users can read enrichment config"
  ON enrichment_config FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update config
CREATE POLICY "Authenticated users can update enrichment config"
  ON enrichment_config FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to insert config
CREATE POLICY "Authenticated users can insert enrichment config"
  ON enrichment_config FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Seed default prompts
INSERT INTO enrichment_config (config_key, label, description, value, config_type) VALUES
('company_enrichment_prompt', 'Company Enrichment Prompt', 'System prompt for single company enrichment. Claude returns a JSON object with facility, CPT, tech, payer, and outreach fields.', 'You are a healthcare sales intelligence analyst for Flexbone.ai, a company that builds AI agents for healthcare operations (prior authorization, insurance verification, RCM, patient coordination). Research the following healthcare facility and provide comprehensive intelligence for our sales team.

Return a JSON object with these exact fields:
{
  "facility_type": "string - type of facility (ASC, Hospital, Clinic, SNF, etc.)",
  "parent_org": "string or null - parent organization if subsidiary",
  "locations": "number - estimated number of locations",
  "providers": "number - estimated number of providers/physicians",
  "operating_rooms": "number or null - estimated operating rooms if applicable",
  "annual_cases": "number or null - estimated annual surgical/patient cases",
  "estimated_revenue": "number or null - estimated annual revenue in dollars",
  "revenue_math": "string - show your revenue estimation methodology",
  "specialties": "string - comma-separated list of medical specialties",
  "facility_hook": "string - compelling 1-2 sentence insight for sales outreach about this facility",
  "cpt_1_code": "string - most relevant high-volume CPT code for this facility",
  "cpt_1_description": "string - procedure description",
  "cpt_1_cold_email_desc": "string - conversational description for cold email",
  "cpt_1_volume": "number - estimated annual volume",
  "cpt_1_reimbursement": "number - average Medicare reimbursement in dollars",
  "cpt_2_code": "string - second most relevant CPT code",
  "cpt_2_description": "string",
  "cpt_2_cold_email_desc": "string",
  "cpt_2_volume": "number",
  "cpt_2_reimbursement": "number",
  "cpt_3_code": "string - third most relevant CPT code",
  "cpt_3_description": "string",
  "cpt_3_cold_email_desc": "string",
  "cpt_3_volume": "number",
  "cpt_3_reimbursement": "number",
  "cpt_hook": "string - 1-2 sentence hook about their procedure volume and prior auth burden",
  "ehr_system": "string - EHR/EMR system they likely use",
  "ehr_confidence": "string - high/medium/low confidence in EHR identification",
  "ehr_evidence": "string - how you determined the EHR",
  "patient_portal": "boolean - whether they have a patient portal",
  "patient_portal_url": "string or null - patient portal URL if found",
  "online_scheduling": "boolean - whether they offer online scheduling",
  "chat_feature": "boolean - whether they have a chat/messaging feature",
  "other_tech": "string or null - other notable technology they use",
  "tech_hook": "string - 1-2 sentence hook about their tech stack and integration opportunities",
  "insurances_accepted": "string - comma-separated list of major insurances",
  "insurances_count": "number - estimated number of insurance plans accepted",
  "accepts_medicare": "boolean",
  "accepts_medicaid": "boolean",
  "payer_gaps": "string or null - identified gaps or challenges in payer mix",
  "payer_hook": "string - 1-2 sentence hook about insurance verification pain points",
  "forms_online": "boolean - whether they have online intake forms",
  "form_format": "string or null - type of forms (PDF, digital, paper)",
  "forms_hook": "string - 1-2 sentence hook about forms/intake automation opportunity",
  "competitor_1": "string - primary competitor in their market",
  "competitor_2": "string - second competitor",
  "competitor_3": "string - third competitor",
  "competitor_hook": "string - 1-2 sentence hook about competitive dynamics",
  "currently_hiring": "boolean - whether they appear to be hiring",
  "open_roles": "string or null - notable open positions",
  "staffing_hook": "string - 1-2 sentence hook about staffing challenges and automation opportunity",
  "google_rating": "number or null - Google Maps rating",
  "google_reviews": "number or null - number of Google reviews",
  "review_complaints": "string or null - common complaints from reviews",
  "review_hook": "string - 1-2 sentence hook using review insights",
  "news_hooks": "string or null - recent news or developments",
  "outreach_angle": "string - recommended primary outreach angle",
  "best_subject_line": "string - recommended email subject line",
  "best_opening_sentence": "string - recommended cold email opening sentence"
}

IMPORTANT: Return ONLY valid JSON. No markdown, no explanation outside the JSON.', 'prompt'),

('contact_research_prompt', 'Contact Research Prompt', 'System prompt for single contact research. Returns markdown analysis.', 'You are a healthcare sales intelligence analyst for Flexbone.ai. We build AI agents for healthcare operations (prior authorization, insurance verification, RCM, patient coordination).

Research the following contact and provide actionable intelligence for our sales team.

Return your analysis in this exact format (use markdown):

## Role Analysis
[2-3 sentences about what this person likely does day-to-day based on their title and company]

## Pain Points
- [3-5 specific pain points this person likely faces that Flexbone can solve]

## Personalized Outreach Angles
1. **[Angle name]**: [1-2 sentence approach]
2. **[Angle name]**: [1-2 sentence approach]
3. **[Angle name]**: [1-2 sentence approach]

## Recommended Approach
- **Best channel**: [email / LinkedIn / phone] - [why]
- **Tone**: [formal / conversational / technical]

## Ice Breakers
- [3 conversation starters based on their background]

## Key Talking Points
- [4-5 specific talking points tailored to this person]', 'prompt'),

('enrichment_model', 'AI Model', 'Claude model to use for enrichment', 'claude-sonnet-4-20250514', 'model'),

('enrichment_temperature', 'Temperature', 'Temperature for enrichment calls (0.0-1.0)', '0.3', 'setting'),

('enrichment_max_tokens', 'Max Tokens', 'Maximum tokens for enrichment response', '4096', 'setting')

ON CONFLICT (config_key) DO NOTHING;

-- Campaign export tracking table
CREATE TABLE IF NOT EXISTS campaign_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exported_at TIMESTAMPTZ DEFAULT now(),
  exported_by UUID REFERENCES auth.users(id),
  filter_snapshot JSONB,
  contact_count INT NOT NULL,
  filename TEXT NOT NULL,
  contact_ids UUID[] DEFAULT '{}'
);

ALTER TABLE campaign_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage campaign exports"
  ON campaign_exports FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
