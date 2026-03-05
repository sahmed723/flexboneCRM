import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { fetchContactById, fetchContactActivities, type ContactDetail } from '@/lib/queries/contacts'
import { CategoryBadge } from '@/components/ui/category-badge'
import { StageBadge } from '@/components/ui/stage-badge'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft, Pencil, Sparkles, Mail, Phone, Linkedin,
  ExternalLink, Copy, Building2, MapPin, Globe, Calendar,
  Send, Clock, FileText,
} from 'lucide-react'
import { CopyButton } from '@/components/contacts/copy-button'
import { EnrichButton } from '@/components/enrichment/enrich-button'
import { OutreachGenerator } from '@/components/enrichment/outreach-generator'

export const runtime = 'edge'

interface PageProps {
  params: Promise<{ id: string }>
}

interface ActivityRow {
  id: string
  activity_type: string
  subject: string | null
  body: string | null
  outcome: string | null
  channel: string | null
  created_at: string
  user_id: string | null
}

export default async function ContactDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: contact, error } = await fetchContactById(supabase, id)
  if (error || !contact) notFound()

  const c = contact as ContactDetail
  const { data: activities } = await fetchContactActivities(supabase, id)
  const company = c.companies

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link href="/dashboard/contacts" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0A0A0A] mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Contacts
        </Link>

        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1A1A2E] text-lg font-bold text-white">
                {c.first_name[0]}{c.last_name?.[0] || ''}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-[#1A1A2E]">
                    {c.first_name} {c.last_name || ''}
                  </h1>
                  <StageBadge stage={c.stage} />
                  <CategoryBadge category={c.flexbone_category} />
                </div>
                {c.title && <p className="text-sm text-[#6B7280]">{c.title}</p>}
                {c.colloquial_title && c.colloquial_title !== c.title && (
                  <p className="text-xs text-[#9CA3AF]">{c.colloquial_title}</p>
                )}
              </div>
            </div>
            {company && (
              <Link
                href={`/dashboard/companies/${company.id}`}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Building2 className="h-3.5 w-3.5" />
                {company.company_name}
                {company.city && <span className="text-[#9CA3AF]">· {company.city}, {company.state}</span>}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 h-9">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <EnrichButton
              entityId={id}
              entityType="contact"
              entityName={`${c.first_name} ${c.last_name || ''}`.trim()}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info Card */}
          <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-5 py-3.5">
              <Mail className="h-4 w-4 text-[#6B7280]" />
              <h3 className="text-sm font-semibold text-[#1A1A2E]">Contact Information</h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Email */}
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Email</p>
                  {c.email ? (
                    <div className="flex items-center gap-2">
                      <a href={`mailto:${c.email}`} className="text-sm text-blue-600 hover:underline">{c.email}</a>
                      <CopyButton text={c.email} />
                    </div>
                  ) : (
                    <p className="text-sm text-[#D1D5DB]">—</p>
                  )}
                </div>

                {/* Secondary Email */}
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Secondary Email</p>
                  {c.secondary_email ? (
                    <div className="flex items-center gap-2">
                      <a href={`mailto:${c.secondary_email}`} className="text-sm text-blue-600 hover:underline">{c.secondary_email}</a>
                      <CopyButton text={c.secondary_email} />
                    </div>
                  ) : (
                    <p className="text-sm text-[#D1D5DB]">—</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Phone</p>
                  {c.phone ? (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-[#6B7280]" />
                      <a href={`tel:${c.phone}`} className="text-sm text-[#374151] hover:text-blue-600">{c.phone}</a>
                    </div>
                  ) : (
                    <p className="text-sm text-[#D1D5DB]">—</p>
                  )}
                </div>

                {/* LinkedIn */}
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">LinkedIn</p>
                  {c.linkedin ? (
                    <a
                      href={c.linkedin.startsWith('http') ? c.linkedin : `https://${c.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                    >
                      <Linkedin className="h-3.5 w-3.5" />
                      LinkedIn Profile
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-sm text-[#D1D5DB]">—</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Company Info Card */}
          {company && (
            <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#F0F0F0] px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#6B7280]" />
                  <h3 className="text-sm font-semibold text-[#1A1A2E]">Company</h3>
                </div>
                <Link href={`/dashboard/companies/${company.id}`} className="text-xs text-blue-600 hover:underline">
                  View full profile →
                </Link>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <h4 className="text-base font-semibold text-[#0A0A0A]">{company.company_name}</h4>
                  <CategoryBadge category={company.flexbone_category} />
                </div>
                <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                  {(company.city || company.state) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {[company.city, company.state].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {company.website && (
                    <a
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      {company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Campaign History */}
          <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-5 py-3.5">
              <Send className="h-4 w-4 text-[#6B7280]" />
              <h3 className="text-sm font-semibold text-[#1A1A2E]">Campaign History</h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <DetailField label="Campaign Batch" value={c.campaign_batch} />
                <DetailField label="Campaign Start" value={c.campaign_start_date ? new Date(c.campaign_start_date).toLocaleDateString() : null} />
                <DetailField label="Last Channel" value={c.last_channel} />
                <DetailField label="Last Engaged By" value={c.last_engaged_by} />
                <DetailField label="Last Contacted" value={c.last_contacted_date ? new Date(c.last_contacted_date).toLocaleDateString() : null} />
                <DetailField label="Source" value={c.source} />
              </div>
              {c.engagement_notes && (
                <div className="mt-4 rounded-md bg-[#F9FAFB] border border-[#F0F0F0] p-3">
                  <p className="text-xs font-medium text-[#6B7280] mb-1">Engagement Notes</p>
                  <p className="text-sm text-[#374151] whitespace-pre-wrap">{c.engagement_notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Engagement Timeline */}
          <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-5 py-3.5">
              <Clock className="h-4 w-4 text-[#6B7280]" />
              <h3 className="text-sm font-semibold text-[#1A1A2E]">Activity Timeline</h3>
            </div>
            <div className="p-5">
              {(activities as ActivityRow[]).length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-[#E5E5E5]" />
                  <div className="space-y-6">
                    {(activities as ActivityRow[]).map((act) => (
                      <div key={act.id} className="relative pl-10">
                        <div className="absolute left-2 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white border-2 border-[#E5E5E5]">
                          <div className={`h-2 w-2 rounded-full ${activityColor(act.activity_type)}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#374151] capitalize">{act.activity_type}</span>
                            {act.channel && <span className="text-xs text-[#9CA3AF]">via {act.channel}</span>}
                            <span className="text-xs text-[#9CA3AF]">
                              {new Date(act.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          {act.subject && <p className="text-sm text-[#6B7280] mt-0.5">{act.subject}</p>}
                          {act.body && <p className="text-sm text-[#374151] mt-1 whitespace-pre-wrap">{act.body}</p>}
                          {act.outcome && <p className="text-xs text-[#9CA3AF] mt-1">Outcome: {act.outcome}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-[#D1D5DB] mx-auto mb-2" />
                  <p className="text-sm text-[#9CA3AF]">No activities recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Quick Info */}
          <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Details</h4>
            <div className="space-y-3">
              <SidebarField label="Stage" value={<StageBadge stage={c.stage} />} />
              <SidebarField label="Priority" value={
                <span className="text-sm font-medium text-[#374151] capitalize">{c.priority_tier.replace('_', ' ')}</span>
              } />
              <SidebarField label="Owner" value={c.owner || '—'} />
              <SidebarField label="Category" value={<CategoryBadge category={c.flexbone_category} />} />
              <SidebarField label="Source" value={c.source} />
              <SidebarField label="Date Imported" value={c.date_imported ? new Date(c.date_imported).toLocaleDateString() : '—'} />
              <SidebarField label="Original Sheet" value={c.original_sheet || '—'} />
            </div>
          </div>

          {/* AI Research Panel */}
          <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <div className="text-center">
              <Sparkles className="h-8 w-8 text-[#F5C518] mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-[#1A1A2E] mb-1">AI Research</h4>
              <p className="text-xs text-[#9CA3AF] mb-3">
                Get AI-powered insights on this contact including role, background, and outreach angles.
              </p>
              <EnrichButton
                entityId={id}
                entityType="contact"
                entityName={`${c.first_name} ${c.last_name || ''}`.trim()}
              />
            </div>
          </div>

          {/* AI Outreach Generator */}
          <OutreachGenerator
            contactId={id}
            contactName={`${c.first_name} ${c.last_name || ''}`.trim()}
            contactEmail={c.email}
          />

          {/* Notes */}
          <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-5 py-3.5">
              <FileText className="h-4 w-4 text-[#6B7280]" />
              <h3 className="text-sm font-semibold text-[#1A1A2E]">Notes</h3>
            </div>
            <div className="p-5">
              {c.engagement_notes ? (
                <p className="text-sm text-[#374151] whitespace-pre-wrap">{c.engagement_notes}</p>
              ) : (
                <p className="text-sm text-[#9CA3AF] italic">No notes yet. Click edit to add notes.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">{label}</p>
      <p className="text-sm text-[#374151]">{value || <span className="text-[#D1D5DB]">—</span>}</p>
    </div>
  )
}

function SidebarField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#6B7280]">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}

function activityColor(type: string): string {
  const colors: Record<string, string> = {
    email: 'bg-blue-500',
    call: 'bg-green-500',
    linkedin: 'bg-blue-700',
    meeting: 'bg-purple-500',
    note: 'bg-gray-400',
    enrichment: 'bg-[#F5C518]',
  }
  return colors[type] || 'bg-gray-400'
}
