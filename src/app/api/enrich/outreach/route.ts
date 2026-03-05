import { NextRequest, NextResponse } from 'next/server'
import { complete } from '@/lib/ai/anthropic'
import { authenticateRequest, isAuthError } from '@/lib/api-auth'

export const runtime = 'edge'

const EMAIL_SYSTEM_PROMPT = `You are an expert healthcare sales copywriter for Flexbone.ai. We build AI agents for healthcare operations: prior authorization automation, insurance verification, RCM optimization, and patient coordination.

Write 3 cold email variants to this healthcare contact. Each variant should take a different angle. The emails should be:
- Concise (under 150 words each)
- Personalized using the contact and company data provided
- Focused on a specific pain point
- Conversational but professional
- Include a clear, low-commitment CTA

Return your response as JSON:
{
  "emails": [
    {
      "variant": "Pain Point",
      "subject": "subject line",
      "body": "email body with \\n for line breaks",
      "angle": "brief description of the angle used"
    },
    {
      "variant": "Social Proof",
      "subject": "subject line",
      "body": "email body",
      "angle": "brief description"
    },
    {
      "variant": "Value Prop",
      "subject": "subject line",
      "body": "email body",
      "angle": "brief description"
    }
  ]
}

IMPORTANT: Return ONLY valid JSON. No markdown.`

const LINKEDIN_SYSTEM_PROMPT = `You are an expert healthcare sales copywriter for Flexbone.ai. We build AI agents for healthcare operations: prior authorization, insurance verification, RCM, and patient coordination.

Write a LinkedIn connection request message (under 300 characters) and a follow-up InMail (under 200 words) for this healthcare contact.

Return your response as JSON:
{
  "connection_request": "short connection request message (under 300 chars)",
  "follow_up_inmail": {
    "subject": "InMail subject line",
    "body": "InMail body"
  },
  "profile_comment_ideas": ["idea 1", "idea 2", "idea 3"]
}

IMPORTANT: Return ONLY valid JSON. No markdown.`

const PHONE_SYSTEM_PROMPT = `You are an expert healthcare sales coach for Flexbone.ai. We build AI agents for healthcare operations: prior authorization automation, insurance verification, RCM optimization, and patient coordination.

Create a phone call script for calling this healthcare contact. The script should feel natural, not robotic.

Return your response as JSON:
{
  "opening": "first 2-3 sentences to say when they pick up",
  "qualifying_questions": ["question 1", "question 2", "question 3"],
  "pain_point_probes": ["probe 1", "probe 2", "probe 3"],
  "value_proposition": "2-3 sentence elevator pitch tailored to their role",
  "objection_handlers": {
    "not_interested": "response",
    "already_have_solution": "response",
    "no_budget": "response",
    "send_info": "response"
  },
  "close": "how to ask for next steps",
  "voicemail_script": "30-second voicemail if they don't pick up"
}

IMPORTANT: Return ONLY valid JSON. No markdown.`

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest({ rateLimit: 10 })
    if (isAuthError(auth)) return auth.response
    const { supabase } = auth

    const { contactId, channel } = await request.json()

    if (!contactId || !channel) {
      return NextResponse.json({ error: 'contactId and channel are required' }, { status: 400 })
    }

    if (!['email', 'linkedin', 'phone'].includes(channel)) {
      return NextResponse.json({ error: 'channel must be email, linkedin, or phone' }, { status: 400 })
    }

    // Fetch contact + company + enrichment
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*, companies!contacts_company_id_fkey(id, company_name, flexbone_category, website, city, state, specialty, ehr, short_description)')
      .eq('id', contactId)
      .single()

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const c = contact as Record<string, unknown>
    const company = c.companies as Record<string, unknown> | null

    // Try to get enrichment data for the company
    let enrichment: Record<string, unknown> | null = null
    if (company?.id) {
      const { data: enrichData } = await supabase
        .from('company_enrichments')
        .select('facility_hook, cpt_hook, tech_hook, payer_hook, outreach_angle, best_subject_line, best_opening_sentence, specialties, ehr_system')
        .eq('company_id', company.id as string)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      enrichment = enrichData as Record<string, unknown> | null
    }

    // Build context
    const contextParts = [
      `Contact: ${c.first_name} ${c.last_name || ''}`.trim(),
      c.title ? `Title: ${c.title}` : null,
      c.email ? `Email: ${c.email}` : null,
      c.linkedin ? `LinkedIn: ${c.linkedin}` : null,
      c.flexbone_category ? `Category: ${c.flexbone_category}` : null,
      company ? `\nCompany: ${company.company_name}` : null,
      company?.website ? `Website: ${company.website}` : null,
      company?.city && company?.state ? `Location: ${company.city}, ${company.state}` : null,
      company?.specialty ? `Specialty: ${company.specialty}` : null,
      company?.ehr ? `EHR: ${company.ehr}` : null,
      company?.short_description ? `Description: ${company.short_description}` : null,
    ].filter(Boolean)

    if (enrichment) {
      contextParts.push('\n--- AI Enrichment Data ---')
      if (enrichment.specialties) contextParts.push(`Specialties: ${enrichment.specialties}`)
      if (enrichment.ehr_system) contextParts.push(`EHR System: ${enrichment.ehr_system}`)
      if (enrichment.facility_hook) contextParts.push(`Facility Hook: ${enrichment.facility_hook}`)
      if (enrichment.cpt_hook) contextParts.push(`CPT Hook: ${enrichment.cpt_hook}`)
      if (enrichment.tech_hook) contextParts.push(`Tech Hook: ${enrichment.tech_hook}`)
      if (enrichment.payer_hook) contextParts.push(`Payer Hook: ${enrichment.payer_hook}`)
      if (enrichment.outreach_angle) contextParts.push(`Outreach Angle: ${enrichment.outreach_angle}`)
    }

    const systemPrompt = channel === 'email' ? EMAIL_SYSTEM_PROMPT
      : channel === 'linkedin' ? LINKEDIN_SYSTEM_PROMPT
      : PHONE_SYSTEM_PROMPT

    const prompt = `Generate ${channel} outreach content for this contact:\n\n${contextParts.join('\n')}`

    const result = await complete({
      system: systemPrompt,
      prompt,
      maxTokens: 4096,
      temperature: 0.7,
    })

    // Try to parse as JSON
    let content: unknown = result.text
    try {
      const jsonMatch = result.text.match(/```json\s*([\s\S]*?)```/) || result.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        content = JSON.parse(jsonMatch[1] || jsonMatch[0])
      }
    } catch {
      // Keep as raw text if JSON parsing fails
    }

    return NextResponse.json({
      success: true,
      contactId,
      channel,
      content,
      tokens: {
        input: result.inputTokens,
        output: result.outputTokens,
        total: result.inputTokens + result.outputTokens,
      },
    })
  } catch (error) {
    console.error('Outreach generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
