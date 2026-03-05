'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Building2, Cpu, Shield, FileText, Swords, Users, Star,
  Mail, ChevronDown, ChevronRight, Copy, Check, CreditCard,
  Briefcase,
} from 'lucide-react'

// ─── Copy Button ─────────────────────────────────────────

function CopyInline({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-[#6B7280] hover:text-[#374151] hover:bg-[#F3F4F6] transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

// ─── Hook Badge ──────────────────────────────────────────

function HookBadge({ label, text }: { label: string; text: string | null }) {
  if (!text) return null
  return (
    <div className="mt-3 rounded-md border-l-[3px] border-[#F5C518] bg-[#F5C518]/5 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#F5C518] mb-1">{label}</p>
      <p className="text-sm text-[#374151] leading-relaxed">{text}</p>
      <CopyInline text={text} />
    </div>
  )
}

// ─── Field ───────────────────────────────────────────────

function Field({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className={cn('space-y-0.5', className)}>
      <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">{label}</p>
      <p className="text-sm text-[#374151]">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</p>
    </div>
  )
}

// ─── Collapsible Section ─────────────────────────────────

function Section({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[#F5C518]">{icon}</span>
          <h4 className="text-sm font-semibold text-[#1A1A2E]">{title}</h4>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
        ) : (
          <ChevronRight className="h-4 w-4 text-[#9CA3AF]" />
        )}
      </button>
      {open && <div className="border-t border-[#F0F0F0] p-5">{children}</div>}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────

interface EnrichmentData {
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
  news_hooks?: string | null
  outreach_angle?: string | null
  best_subject_line?: string | null
  best_opening_sentence?: string | null
  enriched_date?: string | null
}

interface EnrichmentCardProps {
  data: EnrichmentData
}

export function EnrichmentCard({ data: d }: EnrichmentCardProps) {
  return (
    <div className="space-y-4">
      {/* Facility Intelligence */}
      <Section title="Facility Intelligence" icon={<Building2 className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Field label="Facility Type" value={d.facility_type} />
          <Field label="Parent Org" value={d.parent_org} />
          <Field label="Locations" value={d.locations?.toLocaleString()} />
          <Field label="Providers" value={d.providers?.toLocaleString()} />
          <Field label="Operating Rooms" value={d.operating_rooms?.toLocaleString()} />
          <Field label="Annual Cases" value={d.annual_cases?.toLocaleString()} />
          <Field label="Estimated Revenue" value={d.estimated_revenue ? `$${d.estimated_revenue.toLocaleString()}` : null} />
          <Field label="Specialties" value={d.specialties} className="col-span-2" />
        </div>
        {d.revenue_math && (
          <div className="mt-3 rounded-md bg-[#F9FAFB] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1">Revenue Methodology</p>
            <p className="text-xs text-[#6B7280]">{d.revenue_math}</p>
          </div>
        )}
        <HookBadge label="Facility Hook" text={d.facility_hook || null} />
      </Section>

      {/* CPT Code Intelligence */}
      <Section title="CPT Code Intelligence" icon={<FileText className="h-4 w-4" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E5E5]">
                <th className="pb-2 text-left text-xs font-medium text-[#9CA3AF]">CPT Code</th>
                <th className="pb-2 text-left text-xs font-medium text-[#9CA3AF]">Procedure</th>
                <th className="pb-2 text-left text-xs font-medium text-[#9CA3AF]">Cold Email Desc</th>
                <th className="pb-2 text-right text-xs font-medium text-[#9CA3AF]">Volume</th>
                <th className="pb-2 text-right text-xs font-medium text-[#9CA3AF]">Reimbursement</th>
              </tr>
            </thead>
            <tbody>
              {[
                { code: d.cpt_1_code, desc: d.cpt_1_description, email: d.cpt_1_cold_email_desc, vol: d.cpt_1_volume, reimb: d.cpt_1_reimbursement },
                { code: d.cpt_2_code, desc: d.cpt_2_description, email: d.cpt_2_cold_email_desc, vol: d.cpt_2_volume, reimb: d.cpt_2_reimbursement },
                { code: d.cpt_3_code, desc: d.cpt_3_description, email: d.cpt_3_cold_email_desc, vol: d.cpt_3_volume, reimb: d.cpt_3_reimbursement },
              ].filter(r => r.code).map((row, i) => (
                <tr key={i} className="border-b border-[#F5F5F5]">
                  <td className="py-2.5">
                    <span className="inline-flex rounded bg-blue-50 px-2 py-0.5 text-xs font-mono font-medium text-blue-700">
                      {row.code}
                    </span>
                  </td>
                  <td className="py-2.5 text-[#374151] max-w-[180px]">{row.desc || '—'}</td>
                  <td className="py-2.5 text-[#6B7280] max-w-[200px] text-xs">{row.email || '—'}</td>
                  <td className="py-2.5 text-right text-[#374151]">{row.vol?.toLocaleString() || '—'}</td>
                  <td className="py-2.5 text-right text-[#374151]">{row.reimb ? `$${row.reimb.toLocaleString()}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <HookBadge label="CPT Hook" text={d.cpt_hook || null} />
      </Section>

      {/* Technology Stack */}
      <Section title="Technology Stack" icon={<Cpu className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Field label="EHR System" value={d.ehr_system} />
          <Field label="EHR Confidence" value={d.ehr_confidence} />
          <Field label="EHR Evidence" value={d.ehr_evidence} />
          <Field label="Patient Portal" value={d.patient_portal} />
          <Field label="Portal URL" value={d.patient_portal_url} />
          <Field label="Online Scheduling" value={d.online_scheduling} />
          <Field label="Chat Feature" value={d.chat_feature} />
          <Field label="Other Tech" value={d.other_tech} />
        </div>
        <HookBadge label="Tech Hook" text={d.tech_hook || null} />
      </Section>

      {/* Payer Intelligence */}
      <Section title="Payer Intelligence" icon={<CreditCard className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Field label="Insurances Accepted" value={d.insurances_accepted} className="col-span-2" />
          <Field label="Insurance Count" value={d.insurances_count?.toString()} />
          <Field label="Accepts Medicare" value={d.accepts_medicare} />
          <Field label="Accepts Medicaid" value={d.accepts_medicaid} />
          <Field label="Payer Gaps" value={d.payer_gaps} className="col-span-2" />
        </div>
        <HookBadge label="Payer Hook" text={d.payer_hook || null} />
      </Section>

      {/* Forms */}
      <Section title="Forms & Intake" icon={<Shield className="h-4 w-4" />} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Forms Online" value={d.forms_online} />
          <Field label="Form Format" value={d.form_format} />
        </div>
        <HookBadge label="Forms Hook" text={d.forms_hook || null} />
      </Section>

      {/* Competitive Landscape */}
      <Section title="Competitive Landscape" icon={<Swords className="h-4 w-4" />}>
        <div className="grid grid-cols-3 gap-4">
          {[d.competitor_1, d.competitor_2, d.competitor_3].filter(Boolean).map((comp, i) => (
            <div key={i} className="rounded-md border border-[#E5E5E5] p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Competitor {i + 1}</p>
              <p className="mt-1 text-sm font-medium text-[#374151]">{comp}</p>
            </div>
          ))}
        </div>
        <HookBadge label="Competitor Hook" text={d.competitor_hook || null} />
      </Section>

      {/* Staffing & Hiring */}
      <Section title="Staffing & Hiring" icon={<Briefcase className="h-4 w-4" />} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Currently Hiring" value={d.currently_hiring} />
          <Field label="Open Roles" value={d.open_roles} />
        </div>
        <HookBadge label="Staffing Hook" text={d.staffing_hook || null} />
      </Section>

      {/* Reviews & Reputation */}
      <Section title="Reviews & Reputation" icon={<Star className="h-4 w-4" />} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Field label="Google Rating" value={d.google_rating ? `${d.google_rating} / 5` : null} />
          <Field label="Google Reviews" value={d.google_reviews?.toLocaleString()} />
          <Field label="Common Complaints" value={d.review_complaints} className="col-span-2" />
        </div>
        <HookBadge label="Review Hook" text={d.review_hook || null} />
      </Section>

      {/* AI Outreach Content */}
      <Section title="AI Outreach Content" icon={<Mail className="h-4 w-4" />}>
        <div className="space-y-4">
          {d.news_hooks && (
            <div>
              <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-1">News Hooks</p>
              <p className="text-sm text-[#374151]">{d.news_hooks}</p>
            </div>
          )}

          {d.outreach_angle && (
            <div className="rounded-md bg-[#F9FAFB] p-4">
              <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-1">Recommended Outreach Angle</p>
              <p className="text-sm text-[#374151]">{d.outreach_angle}</p>
            </div>
          )}

          {d.best_subject_line && (
            <div className="rounded-md border border-[#E5E5E5] p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Best Subject Line</p>
                <CopyInline text={d.best_subject_line} />
              </div>
              <p className="text-sm font-medium text-[#374151]">{d.best_subject_line}</p>
            </div>
          )}

          {d.best_opening_sentence && (
            <div className="rounded-md border border-[#E5E5E5] p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Best Opening Sentence</p>
                <CopyInline text={d.best_opening_sentence} />
              </div>
              <p className="text-sm text-[#374151] italic">&ldquo;{d.best_opening_sentence}&rdquo;</p>
            </div>
          )}
        </div>
      </Section>
    </div>
  )
}
