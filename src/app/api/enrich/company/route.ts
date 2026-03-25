import { NextRequest, NextResponse } from 'next/server'
import { complete, extractJSON, MODEL, loadEnrichmentConfig } from '@/lib/ai/anthropic'
import { authenticateRequest, isAuthError } from '@/lib/api-auth'
import type { Company } from '@/lib/supabase/types'

export const runtime = 'edge'

const DEFAULT_SYSTEM_PROMPT = `You are a healthcare sales intelligence analyst for Flexbone.ai, a company that builds AI agents for healthcare operations (prior authorization, insurance verification, RCM, patient coordination). Research the following healthcare facility and provide comprehensive intelligence for our sales team.

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

Each 'hook' field should be a compelling 1-2 sentence insight that our sales team can use to open a conversation. Focus on pain points around:
- Manual prior authorization processes
- Insurance verification bottlenecks
- Revenue cycle inefficiencies
- Patient scheduling friction
- Administrative overhead

The facility_hook, cpt_hook, tech_hook, payer_hook, etc. should each provide a unique angle for outreach specific to that data category.

IMPORTANT: Return ONLY valid JSON. No markdown, no explanation outside the JSON.`

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest({ rateLimit: 10 })
    if (isAuthError(auth)) return auth.response
    const { supabase } = auth

    const { companyId } = await request.json()

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
    }

    // Fetch company data
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const co = company as unknown as Company

    // Create enrichment job record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: job } = await (supabase.from('ai_enrichment_jobs') as any)
      .insert({
        company_id: companyId,
        job_type: 'company_enrichment',
        status: 'processing',
        model_used: MODEL,
        requested_by: null,
      })
      .select()
      .single()

    const jobId = (job as { id: string } | null)?.id

    // Load configurable prompt from DB
    const config = await loadEnrichmentConfig(supabase)
    const systemPrompt = config?.company_enrichment_prompt || DEFAULT_SYSTEM_PROMPT
    const model = config?.enrichment_model || MODEL
    const temperature = config?.enrichment_temperature ? parseFloat(config.enrichment_temperature) : 0.3
    const maxTokens = config?.enrichment_max_tokens ? parseInt(config.enrichment_max_tokens) : 4096

    // Build context prompt
    const contextParts = [
      `Company Name: ${co.company_name}`,
      co.website ? `Website: ${co.website}` : null,
      co.flexbone_category ? `Category: ${co.flexbone_category}` : null,
      co.city && co.state ? `Location: ${co.city}, ${co.state}` : null,
      co.state ? `State: ${co.state}` : null,
      co.specialty ? `Specialty: ${co.specialty}` : null,
      co.company_size ? `Company Size: ${co.company_size} employees` : null,
      co.ehr ? `Known EHR: ${co.ehr}` : null,
      co.has_asc ? `Has ASC: Yes` : null,
      co.industry ? `Industry: ${co.industry}` : null,
      co.surgeries_per_year ? `Surgeries/Year: ${co.surgeries_per_year}` : null,
      co.high_volume_cpt_codes ? `Known CPT Codes: ${co.high_volume_cpt_codes}` : null,
      co.technologies ? `Technologies: ${co.technologies}` : null,
      co.short_description ? `Description: ${co.short_description}` : null,
    ].filter(Boolean)

    const prompt = `Research this healthcare facility and provide comprehensive sales intelligence:\n\n${contextParts.join('\n')}`

    // Call Claude
    const result = await complete({
      system: systemPrompt,
      prompt,
      maxTokens,
      temperature,
    })

    const enrichmentData = extractJSON(result.text)

    if (!enrichmentData) {
      // Update job as failed
      if (jobId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('ai_enrichment_jobs') as any)
          .update({
            status: 'failed',
            error_message: 'Failed to parse AI response as JSON',
            tokens_used: result.inputTokens + result.outputTokens,
            completed_at: new Date().toISOString(),
          })
          .eq('id', jobId)
      }

      return NextResponse.json({ error: 'Failed to parse enrichment data' }, { status: 500 })
    }

    // Save enrichment to company_enrichments table
    const enrichmentRecord = {
      company_id: companyId,
      facility_type: enrichmentData.facility_type as string || null,
      parent_org: enrichmentData.parent_org as string || null,
      locations: typeof enrichmentData.locations === 'number' ? enrichmentData.locations : null,
      providers: typeof enrichmentData.providers === 'number' ? enrichmentData.providers : null,
      operating_rooms: typeof enrichmentData.operating_rooms === 'number' ? enrichmentData.operating_rooms : null,
      annual_cases: typeof enrichmentData.annual_cases === 'number' ? enrichmentData.annual_cases : null,
      estimated_revenue: typeof enrichmentData.estimated_revenue === 'number' ? enrichmentData.estimated_revenue : null,
      revenue_math: enrichmentData.revenue_math as string || null,
      specialties: enrichmentData.specialties as string || null,
      facility_hook: enrichmentData.facility_hook as string || null,
      cpt_1_code: enrichmentData.cpt_1_code as string || null,
      cpt_1_description: enrichmentData.cpt_1_description as string || null,
      cpt_1_cold_email_desc: enrichmentData.cpt_1_cold_email_desc as string || null,
      cpt_1_volume: typeof enrichmentData.cpt_1_volume === 'number' ? enrichmentData.cpt_1_volume : null,
      cpt_1_reimbursement: typeof enrichmentData.cpt_1_reimbursement === 'number' ? enrichmentData.cpt_1_reimbursement : null,
      cpt_2_code: enrichmentData.cpt_2_code as string || null,
      cpt_2_description: enrichmentData.cpt_2_description as string || null,
      cpt_2_cold_email_desc: enrichmentData.cpt_2_cold_email_desc as string || null,
      cpt_2_volume: typeof enrichmentData.cpt_2_volume === 'number' ? enrichmentData.cpt_2_volume : null,
      cpt_2_reimbursement: typeof enrichmentData.cpt_2_reimbursement === 'number' ? enrichmentData.cpt_2_reimbursement : null,
      cpt_3_code: enrichmentData.cpt_3_code as string || null,
      cpt_3_description: enrichmentData.cpt_3_description as string || null,
      cpt_3_cold_email_desc: enrichmentData.cpt_3_cold_email_desc as string || null,
      cpt_3_volume: typeof enrichmentData.cpt_3_volume === 'number' ? enrichmentData.cpt_3_volume : null,
      cpt_3_reimbursement: typeof enrichmentData.cpt_3_reimbursement === 'number' ? enrichmentData.cpt_3_reimbursement : null,
      cpt_hook: enrichmentData.cpt_hook as string || null,
      ehr_system: enrichmentData.ehr_system as string || null,
      ehr_confidence: enrichmentData.ehr_confidence as string || null,
      ehr_evidence: enrichmentData.ehr_evidence as string || null,
      patient_portal: Boolean(enrichmentData.patient_portal),
      patient_portal_url: enrichmentData.patient_portal_url as string || null,
      online_scheduling: Boolean(enrichmentData.online_scheduling),
      chat_feature: Boolean(enrichmentData.chat_feature),
      other_tech: enrichmentData.other_tech as string || null,
      tech_hook: enrichmentData.tech_hook as string || null,
      insurances_accepted: enrichmentData.insurances_accepted as string || null,
      insurances_count: typeof enrichmentData.insurances_count === 'number' ? enrichmentData.insurances_count : 0,
      accepts_medicare: Boolean(enrichmentData.accepts_medicare),
      accepts_medicaid: Boolean(enrichmentData.accepts_medicaid),
      payer_gaps: enrichmentData.payer_gaps as string || null,
      payer_hook: enrichmentData.payer_hook as string || null,
      forms_online: Boolean(enrichmentData.forms_online),
      form_format: enrichmentData.form_format as string || null,
      forms_hook: enrichmentData.forms_hook as string || null,
      competitor_1: enrichmentData.competitor_1 as string || null,
      competitor_2: enrichmentData.competitor_2 as string || null,
      competitor_3: enrichmentData.competitor_3 as string || null,
      competitor_hook: enrichmentData.competitor_hook as string || null,
      currently_hiring: Boolean(enrichmentData.currently_hiring),
      open_roles: enrichmentData.open_roles as string || null,
      staffing_hook: enrichmentData.staffing_hook as string || null,
      google_rating: typeof enrichmentData.google_rating === 'number' ? enrichmentData.google_rating : null,
      google_reviews: typeof enrichmentData.google_reviews === 'number' ? enrichmentData.google_reviews : null,
      review_complaints: enrichmentData.review_complaints as string || null,
      review_hook: enrichmentData.review_hook as string || null,
      news_hooks: enrichmentData.news_hooks as string || null,
      outreach_angle: enrichmentData.outreach_angle as string || null,
      best_subject_line: enrichmentData.best_subject_line as string || null,
      best_opening_sentence: enrichmentData.best_opening_sentence as string || null,
      full_json: enrichmentData,
      enriched_date: new Date().toISOString(),
    }

    // Upsert enrichment (replace existing if company already enriched)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: enrichError } = await (supabase.from('company_enrichments') as any)
      .upsert(enrichmentRecord, { onConflict: 'company_id' })

    if (enrichError) {
      // If upsert fails (no unique constraint on company_id), try insert
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('company_enrichments') as any).insert(enrichmentRecord)
    }

    // Log activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('activities') as any).insert({
      company_id: companyId,
      activity_type: 'enrichment',
      subject: `AI enrichment completed for ${co.company_name}`,
      body: `Enriched with ${Object.keys(enrichmentData).length} data points using ${MODEL}. Tokens used: ${result.inputTokens + result.outputTokens}`,
      metadata: {
        model: result.model,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
      },
    })

    // Update job as completed
    if (jobId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('ai_enrichment_jobs') as any)
        .update({
          status: 'completed',
          output_data: enrichmentData,
          tokens_used: result.inputTokens + result.outputTokens,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId)
    }

    return NextResponse.json({
      success: true,
      companyId,
      enrichment: enrichmentData,
      tokens: {
        input: result.inputTokens,
        output: result.outputTokens,
        total: result.inputTokens + result.outputTokens,
      },
    })
  } catch (error) {
    console.error('Company enrichment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Enrichment failed' },
      { status: 500 }
    )
  }
}
