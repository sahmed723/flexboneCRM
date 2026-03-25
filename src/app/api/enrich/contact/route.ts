import { NextRequest, NextResponse } from 'next/server'
import { complete, MODEL, loadEnrichmentConfig } from '@/lib/ai/anthropic'
import { authenticateRequest, isAuthError } from '@/lib/api-auth'

export const runtime = 'edge'

const DEFAULT_SYSTEM_PROMPT = `You are a healthcare sales intelligence analyst for Flexbone.ai. We build AI agents for healthcare operations (prior authorization, insurance verification, RCM, patient coordination).

Research the following contact and provide actionable intelligence for our sales team. Your analysis should help a sales rep understand this person's role, pain points, and the best way to approach them.

Return your analysis in this exact format (use markdown):

## Role Analysis
[2-3 sentences about what this person likely does day-to-day based on their title and company]

## Pain Points
- [3-5 specific pain points this person likely faces that Flexbone can solve]

## LinkedIn Profile Insights
[If a LinkedIn URL is provided, analyze what their profile suggests about their priorities and interests. If no URL, note that manual LinkedIn research is recommended]

## Personalized Outreach Angles
1. **[Angle name]**: [1-2 sentence approach]
2. **[Angle name]**: [1-2 sentence approach]
3. **[Angle name]**: [1-2 sentence approach]

## Recommended Approach
- **Best channel**: [email / LinkedIn / phone] - [why]
- **Best time**: [suggested timing]
- **Tone**: [formal / conversational / technical]

## Ice Breakers
- [3 conversation starters based on their background, company, or industry trends]

## Key Talking Points
- [4-5 specific talking points tailored to this person's role]

## Cautions
- [Any red flags or things to avoid in the conversation]`

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest({ rateLimit: 10 })
    if (isAuthError(auth)) return auth.response
    const { supabase } = auth

    const { contactId } = await request.json()

    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 })
    }

    // Fetch contact with company data
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*, companies!contacts_company_id_fkey(company_name, flexbone_category, website, city, state, specialty, ehr, has_asc, short_description)')
      .eq('id', contactId)
      .single()

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const c = contact as Record<string, unknown>
    const company = c.companies as Record<string, unknown> | null

    // Create enrichment job
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: job } = await (supabase.from('ai_enrichment_jobs') as any)
      .insert({
        contact_id: contactId,
        company_id: c.company_id || null,
        job_type: 'contact_research',
        status: 'processing',
        model_used: MODEL,
      })
      .select()
      .single()

    const jobId = (job as { id: string } | null)?.id

    // Build context
    const contextParts = [
      `Name: ${c.first_name} ${c.last_name || ''}`.trim(),
      c.title ? `Title: ${c.title}` : null,
      c.colloquial_title ? `Colloquial Title: ${c.colloquial_title}` : null,
      c.email ? `Email: ${c.email}` : null,
      c.linkedin ? `LinkedIn: ${c.linkedin}` : null,
      c.phone ? `Phone: ${c.phone}` : null,
      c.stage ? `CRM Stage: ${c.stage}` : null,
      c.flexbone_category ? `Category: ${c.flexbone_category}` : null,
      c.source ? `Source: ${c.source}` : null,
      c.engagement_notes ? `Previous Notes: ${c.engagement_notes}` : null,
      company ? `\nCompany: ${company.company_name}` : null,
      company?.flexbone_category ? `Company Category: ${company.flexbone_category}` : null,
      company?.website ? `Company Website: ${company.website}` : null,
      company?.city && company?.state ? `Company Location: ${company.city}, ${company.state}` : null,
      company?.specialty ? `Company Specialty: ${company.specialty}` : null,
      company?.ehr ? `Company EHR: ${company.ehr}` : null,
      company?.has_asc ? `Has ASC: Yes` : null,
      company?.short_description ? `Company Description: ${company.short_description}` : null,
    ].filter(Boolean)

    // Load configurable prompt from DB
    const config = await loadEnrichmentConfig(supabase)
    const systemPrompt = config?.contact_research_prompt || DEFAULT_SYSTEM_PROMPT
    const temperature = config?.enrichment_temperature ? parseFloat(config.enrichment_temperature) : 0.3
    const maxTokens = config?.enrichment_max_tokens ? parseInt(config.enrichment_max_tokens) : 4096

    const prompt = `Research this healthcare contact and provide sales intelligence:\n\n${contextParts.join('\n')}`

    const result = await complete({
      system: systemPrompt,
      prompt,
      maxTokens,
      temperature,
    })

    // Save as enrichment activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('activities') as any).insert({
      contact_id: contactId,
      company_id: c.company_id || null,
      activity_type: 'enrichment',
      subject: `AI research completed for ${c.first_name} ${c.last_name || ''}`.trim(),
      body: result.text,
      metadata: {
        model: result.model,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
        type: 'contact_research',
      },
    })

    // Update job
    if (jobId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('ai_enrichment_jobs') as any)
        .update({
          status: 'completed',
          output_data: { research: result.text },
          tokens_used: result.inputTokens + result.outputTokens,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId)
    }

    return NextResponse.json({
      success: true,
      contactId,
      research: result.text,
      tokens: {
        input: result.inputTokens,
        output: result.outputTokens,
        total: result.inputTokens + result.outputTokens,
      },
    })
  } catch (error) {
    console.error('Contact research error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Research failed' },
      { status: 500 }
    )
  }
}
