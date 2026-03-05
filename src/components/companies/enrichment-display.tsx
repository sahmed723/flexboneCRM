import { cn } from '@/lib/utils'
import {
  Building2, Cpu, Shield, FileText,
  Swords, Users, Star, Mail,
  Stethoscope, DollarSign, Activity, Sparkles,
} from 'lucide-react'

interface EnrichmentCardProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}

function EnrichmentCard({ title, icon, children, className }: EnrichmentCardProps) {
  return (
    <div className={cn('rounded-lg border border-[#E5E5E5] bg-white shadow-sm', className)}>
      <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-5 py-3.5">
        <span className="text-[#F5C518]">{icon}</span>
        <h4 className="text-sm font-semibold text-[#1A1A2E]">{title}</h4>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function Field({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className={cn('space-y-0.5', className)}>
      <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">{label}</p>
      <p className="text-sm text-[#374151]">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</p>
    </div>
  )
}

function HookBadge({ label, text }: { label: string; text: string | null }) {
  if (!text) return null
  return (
    <div className="mt-3 rounded-md bg-[#F5C518]/5 border border-[#F5C518]/20 p-3">
      <p className="text-xs font-medium text-[#F5C518] mb-1">{label}</p>
      <p className="text-sm text-[#374151] italic">{text}</p>
    </div>
  )
}

interface EnrichmentData {
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
  enriched_date: string | null
  [key: string]: unknown
}

interface EnrichmentDisplayProps {
  data: EnrichmentData
}

export function EnrichmentDisplay({ data }: EnrichmentDisplayProps) {
  const cptProcedures = [
    { code: data.cpt_1_code, desc: data.cpt_1_description, email: data.cpt_1_cold_email_desc, vol: data.cpt_1_volume, reimb: data.cpt_1_reimbursement },
    { code: data.cpt_2_code, desc: data.cpt_2_description, email: data.cpt_2_cold_email_desc, vol: data.cpt_2_volume, reimb: data.cpt_2_reimbursement },
    { code: data.cpt_3_code, desc: data.cpt_3_description, email: data.cpt_3_cold_email_desc, vol: data.cpt_3_volume, reimb: data.cpt_3_reimbursement },
  ].filter(p => p.code)

  const competitors = [data.competitor_1, data.competitor_2, data.competitor_3].filter(Boolean)

  const keyContacts = [
    { name: data.contact_1_name, title: data.contact_1_title, email: data.contact_1_email },
    { name: data.contact_2_name, title: data.contact_2_title, email: data.contact_2_email },
    { name: data.contact_3_name, title: data.contact_3_title, email: data.contact_3_email },
  ].filter(c => c.name)

  return (
    <div className="space-y-4">
      {/* Facility Intelligence */}
      <EnrichmentCard title="Facility Intelligence" icon={<Building2 className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Field label="Facility Type" value={data.facility_type} />
          <Field label="Parent Org" value={data.parent_org} />
          <Field label="Locations" value={data.locations} />
          <Field label="Providers" value={data.providers} />
          <Field label="Operating Rooms" value={data.operating_rooms} />
          <Field label="Annual Cases" value={data.annual_cases?.toLocaleString()} />
          <Field label="Est. Revenue" value={data.estimated_revenue ? `$${data.estimated_revenue.toLocaleString()}` : null} />
          <Field label="Specialties" value={data.specialties} className="col-span-2" />
        </div>
        {data.revenue_math && (
          <div className="mt-3 rounded-md bg-[#F5F5F5] p-3">
            <p className="text-xs font-medium text-[#6B7280] mb-1">Revenue Calculation</p>
            <p className="text-sm text-[#374151]">{data.revenue_math}</p>
          </div>
        )}
        <HookBadge label="Facility Hook" text={data.facility_hook} />
      </EnrichmentCard>

      {/* CPT Code Intelligence */}
      {cptProcedures.length > 0 && (
        <EnrichmentCard title="CPT Code Intelligence" icon={<Stethoscope className="h-4 w-4" />}>
          <div className="space-y-4">
            {cptProcedures.map((proc, i) => (
              <div key={i} className="rounded-md border border-[#F0F0F0] p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-mono font-medium text-blue-700">
                      {proc.code}
                    </span>
                    <p className="mt-1.5 text-sm font-medium text-[#374151]">{proc.desc}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Field label="Volume" value={proc.vol?.toLocaleString()} />
                  <Field label="Reimbursement" value={proc.reimb ? `$${proc.reimb.toLocaleString()}` : null} />
                </div>
                {proc.email && (
                  <p className="mt-2 text-xs text-[#6B7280] italic">{proc.email}</p>
                )}
              </div>
            ))}
          </div>
          <HookBadge label="CPT Hook" text={data.cpt_hook} />
        </EnrichmentCard>
      )}

      {/* Technology Stack */}
      <EnrichmentCard title="Technology Stack" icon={<Cpu className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="EHR System" value={data.ehr_system} />
          <Field label="EHR Confidence" value={data.ehr_confidence} />
          <Field label="Patient Portal" value={data.patient_portal} />
          <Field label="Portal URL" value={
            data.patient_portal_url ? (
              <a href={data.patient_portal_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                {data.patient_portal_url}
              </a>
            ) : null
          } />
          <Field label="Online Scheduling" value={data.online_scheduling} />
          <Field label="Chat Feature" value={data.chat_feature} />
          <Field label="Other Tech" value={data.other_tech} className="col-span-2" />
        </div>
        {data.ehr_evidence && (
          <div className="mt-3 rounded-md bg-[#F5F5F5] p-3">
            <p className="text-xs font-medium text-[#6B7280] mb-1">EHR Evidence</p>
            <p className="text-sm text-[#374151]">{data.ehr_evidence}</p>
          </div>
        )}
        <HookBadge label="Tech Hook" text={data.tech_hook} />
      </EnrichmentCard>

      {/* Payer Intelligence */}
      <EnrichmentCard title="Payer Intelligence" icon={<Shield className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Insurances Count" value={data.insurances_count || null} />
          <Field label="Medicare" value={data.accepts_medicare} />
          <Field label="Medicaid" value={data.accepts_medicaid} />
          <Field label="Insurances Accepted" value={data.insurances_accepted} className="col-span-full" />
          <Field label="Payer Gaps" value={data.payer_gaps} className="col-span-full" />
        </div>
        <HookBadge label="Payer Hook" text={data.payer_hook} />
      </EnrichmentCard>

      {/* Forms */}
      {(data.forms_online || data.form_format || data.forms_hook) && (
        <EnrichmentCard title="Forms" icon={<FileText className="h-4 w-4" />}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Forms Online" value={data.forms_online} />
            <Field label="Format" value={data.form_format} />
          </div>
          <HookBadge label="Forms Hook" text={data.forms_hook} />
        </EnrichmentCard>
      )}

      {/* Competitive Landscape */}
      {competitors.length > 0 && (
        <EnrichmentCard title="Competitive Landscape" icon={<Swords className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {competitors.map((comp, i) => (
              <div key={i} className="rounded-md border border-[#F0F0F0] p-3">
                <p className="text-xs font-medium text-[#9CA3AF]">Competitor {i + 1}</p>
                <p className="text-sm text-[#374151] mt-0.5">{comp}</p>
              </div>
            ))}
          </div>
          <HookBadge label="Competitor Hook" text={data.competitor_hook} />
        </EnrichmentCard>
      )}

      {/* Staffing & Reviews */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EnrichmentCard title="Staffing" icon={<Users className="h-4 w-4" />}>
          <div className="space-y-3">
            <Field label="Currently Hiring" value={data.currently_hiring} />
            <Field label="Open Roles" value={data.open_roles} />
          </div>
          <HookBadge label="Staffing Hook" text={data.staffing_hook} />
        </EnrichmentCard>

        <EnrichmentCard title="Reviews" icon={<Star className="h-4 w-4" />}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Google Rating" value={data.google_rating ? `${data.google_rating}/5` : null} />
            <Field label="Google Reviews" value={data.google_reviews?.toLocaleString()} />
            <Field label="Complaints" value={data.review_complaints} className="col-span-2" />
          </div>
          <HookBadge label="Review Hook" text={data.review_hook} />
        </EnrichmentCard>
      </div>

      {/* Key Contacts from Enrichment */}
      {keyContacts.length > 0 && (
        <EnrichmentCard title="Key Contacts" icon={<Mail className="h-4 w-4" />}>
          <div className="space-y-3">
            {keyContacts.map((contact, i) => (
              <div key={i} className="flex items-center gap-3 rounded-md border border-[#F0F0F0] p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A1A2E] text-xs font-semibold text-white shrink-0">
                  {contact.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#374151]">{contact.name}</p>
                  <p className="text-xs text-[#6B7280]">{contact.title}</p>
                </div>
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="text-xs text-blue-600 hover:underline shrink-0">
                    {contact.email}
                  </a>
                )}
              </div>
            ))}
          </div>
          {data.best_contact_name && (
            <div className="mt-3 rounded-md bg-emerald-50 border border-emerald-200 p-3">
              <p className="text-xs font-medium text-emerald-600 mb-1">Best Contact</p>
              <p className="text-sm text-[#374151]">
                <span className="font-medium">{data.best_contact_name}</span>
                {data.best_contact_title && <span className="text-[#6B7280]"> — {data.best_contact_title}</span>}
              </p>
              {data.best_contact_reason && (
                <p className="text-xs text-[#6B7280] mt-1">{data.best_contact_reason}</p>
              )}
            </div>
          )}
        </EnrichmentCard>
      )}

      {/* AI Outreach Content */}
      {(data.news_hooks || data.outreach_angle || data.best_subject_line || data.best_opening_sentence) && (
        <EnrichmentCard title="AI Outreach Content" icon={<Sparkles className="h-4 w-4" />}>
          <div className="space-y-4">
            {data.news_hooks && (
              <div>
                <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-1">News Hooks</p>
                <p className="text-sm text-[#374151]">{data.news_hooks}</p>
              </div>
            )}
            {data.outreach_angle && (
              <div>
                <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-1">Outreach Angle</p>
                <p className="text-sm text-[#374151]">{data.outreach_angle}</p>
              </div>
            )}
            {data.best_subject_line && (
              <div className="rounded-md bg-[#F5F5F5] p-3">
                <p className="text-xs font-medium text-[#6B7280] mb-1">Best Subject Line</p>
                <p className="text-sm font-medium text-[#0A0A0A]">&ldquo;{data.best_subject_line}&rdquo;</p>
              </div>
            )}
            {data.best_opening_sentence && (
              <div className="rounded-md bg-[#F5F5F5] p-3">
                <p className="text-xs font-medium text-[#6B7280] mb-1">Best Opening Sentence</p>
                <p className="text-sm text-[#374151] italic">&ldquo;{data.best_opening_sentence}&rdquo;</p>
              </div>
            )}
          </div>
        </EnrichmentCard>
      )}
    </div>
  )
}
