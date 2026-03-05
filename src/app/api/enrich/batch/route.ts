import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { complete, extractJSON, MODEL } from '@/lib/ai/anthropic'
import { authenticateRequest, isAuthError } from '@/lib/api-auth'

export const runtime = 'edge'

const MAX_CONCURRENT = 5

const COMPANY_SYSTEM_PROMPT = `You are a healthcare sales intelligence analyst for Flexbone.ai. Research the following healthcare facility and return a JSON object with these fields:
{
  "facility_type": "string",
  "parent_org": "string or null",
  "locations": "number",
  "providers": "number",
  "specialties": "string",
  "facility_hook": "string - 1-2 sentence sales hook about this facility",
  "ehr_system": "string",
  "estimated_revenue": "number or null",
  "outreach_angle": "string",
  "best_subject_line": "string",
  "best_opening_sentence": "string"
}
Focus on pain points around prior authorization, insurance verification, and revenue cycle management.
IMPORTANT: Return ONLY valid JSON.`

const CONTACT_SYSTEM_PROMPT = `You are a healthcare sales intelligence analyst for Flexbone.ai. Research this contact and return a JSON object:
{
  "role_summary": "string - what this person likely does",
  "pain_points": ["string array of 3 pain points"],
  "outreach_angle": "string - recommended approach",
  "recommended_channel": "email | linkedin | phone",
  "ice_breaker": "string - conversation starter",
  "key_talking_points": ["string array of 3 talking points"]
}
IMPORTANT: Return ONLY valid JSON.`

interface BatchJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
}

async function processCompany(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
  batchJobId: string
): Promise<BatchJob> {
  try {
    const { data: company } = await supabase
      .from('companies')
      .select('company_name, website, flexbone_category, city, state, specialty, ehr, short_description')
      .eq('id', companyId)
      .single()

    if (!company) return { id: companyId, status: 'failed', error: 'Not found' }

    const c = company as Record<string, unknown>
    const context = [
      `Company: ${c.company_name}`,
      c.website ? `Website: ${c.website}` : null,
      c.flexbone_category ? `Category: ${c.flexbone_category}` : null,
      c.city && c.state ? `Location: ${c.city}, ${c.state}` : null,
      c.specialty ? `Specialty: ${c.specialty}` : null,
      c.ehr ? `EHR: ${c.ehr}` : null,
      c.short_description ? `Description: ${c.short_description}` : null,
    ].filter(Boolean).join('\n')

    const result = await complete({
      system: COMPANY_SYSTEM_PROMPT,
      prompt: `Research this healthcare facility:\n\n${context}`,
      maxTokens: 2048,
      temperature: 0.3,
    })

    const data = extractJSON(result.text)
    if (!data) return { id: companyId, status: 'failed', error: 'Failed to parse JSON' }

    // Save enrichment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('company_enrichments') as any).insert({
      company_id: companyId,
      facility_type: data.facility_type || null,
      parent_org: data.parent_org || null,
      locations: typeof data.locations === 'number' ? data.locations : null,
      providers: typeof data.providers === 'number' ? data.providers : null,
      specialties: data.specialties || null,
      facility_hook: data.facility_hook || null,
      ehr_system: data.ehr_system || null,
      estimated_revenue: typeof data.estimated_revenue === 'number' ? data.estimated_revenue : null,
      outreach_angle: data.outreach_angle || null,
      best_subject_line: data.best_subject_line || null,
      best_opening_sentence: data.best_opening_sentence || null,
      full_json: data,
      enriched_date: new Date().toISOString(),
    })

    // Log activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('activities') as any).insert({
      company_id: companyId,
      activity_type: 'enrichment',
      subject: `Batch enrichment: ${c.company_name}`,
      body: `Enriched via batch job ${batchJobId}`,
      metadata: { batch_job_id: batchJobId, model: MODEL, tokens: result.inputTokens + result.outputTokens },
    })

    return { id: companyId, status: 'completed' }
  } catch (error) {
    return { id: companyId, status: 'failed', error: (error as Error).message }
  }
}

async function processContact(
  supabase: Awaited<ReturnType<typeof createClient>>,
  contactId: string,
  batchJobId: string
): Promise<BatchJob> {
  try {
    const { data: contact } = await supabase
      .from('contacts')
      .select('first_name, last_name, title, email, linkedin, flexbone_category, companies!contacts_company_id_fkey(company_name)')
      .eq('id', contactId)
      .single()

    if (!contact) return { id: contactId, status: 'failed', error: 'Not found' }

    const c = contact as Record<string, unknown>
    const company = c.companies as { company_name: string } | null
    const context = [
      `Name: ${c.first_name} ${c.last_name || ''}`.trim(),
      c.title ? `Title: ${c.title}` : null,
      c.email ? `Email: ${c.email}` : null,
      c.linkedin ? `LinkedIn: ${c.linkedin}` : null,
      c.flexbone_category ? `Category: ${c.flexbone_category}` : null,
      company ? `Company: ${company.company_name}` : null,
    ].filter(Boolean).join('\n')

    const result = await complete({
      system: CONTACT_SYSTEM_PROMPT,
      prompt: `Research this healthcare contact:\n\n${context}`,
      maxTokens: 2048,
      temperature: 0.3,
    })

    // Save as activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('activities') as any).insert({
      contact_id: contactId,
      activity_type: 'enrichment',
      subject: `Batch research: ${c.first_name} ${c.last_name || ''}`.trim(),
      body: result.text,
      metadata: { batch_job_id: batchJobId, model: MODEL, tokens: result.inputTokens + result.outputTokens },
    })

    return { id: contactId, status: 'completed' }
  } catch (error) {
    return { id: contactId, status: 'failed', error: (error as Error).message }
  }
}

// Process items with concurrency limit
async function processWithConcurrency<T>(
  items: T[],
  processor: (item: T) => Promise<BatchJob>,
  maxConcurrent: number
): Promise<BatchJob[]> {
  const results: BatchJob[] = []
  const executing = new Set<Promise<void>>()

  for (const item of items) {
    const p = processor(item).then((result) => {
      results.push(result)
      executing.delete(p)
    })
    executing.add(p)

    if (executing.size >= maxConcurrent) {
      await Promise.race(executing)
    }
  }

  await Promise.all(executing)
  return results
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest({ rateLimit: 5, rateLimitWindow: 60_000 })
    if (isAuthError(auth)) return auth.response

    const { companyIds, contactIds, type } = await request.json()

    const ids = type === 'company' ? companyIds : contactIds

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'companyIds or contactIds array is required' }, { status: 400 })
    }

    if (ids.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 items per batch' }, { status: 400 })
    }

    const supabase = await createClient()

    // Create batch job record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: batchJob } = await (supabase.from('ai_enrichment_jobs') as any)
      .insert({
        job_type: `batch_${type}_enrichment`,
        status: 'processing',
        model_used: MODEL,
        input_data: { ids, type, count: ids.length },
      })
      .select()
      .single()

    const batchJobId = (batchJob as { id: string } | null)?.id || 'unknown'

    // Process with concurrency limit
    const results = await processWithConcurrency(
      ids as string[],
      (id) =>
        type === 'company'
          ? processCompany(supabase, id, batchJobId)
          : processContact(supabase, id, batchJobId),
      MAX_CONCURRENT
    )

    const completed = results.filter((r) => r.status === 'completed').length
    const failed = results.filter((r) => r.status === 'failed').length

    // Update batch job
    if (batchJobId !== 'unknown') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('ai_enrichment_jobs') as any)
        .update({
          status: failed === ids.length ? 'failed' : 'completed',
          output_data: { results, completed, failed },
          completed_at: new Date().toISOString(),
        })
        .eq('id', batchJobId)
    }

    return NextResponse.json({
      success: true,
      batchJobId,
      total: ids.length,
      completed,
      failed,
      results,
    })
  } catch (error) {
    console.error('Batch enrichment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Batch enrichment failed' },
      { status: 500 }
    )
  }
}
