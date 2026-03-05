import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  fetchCompanyById,
  fetchCompanyContacts,
  fetchCompanyEnrichment,
  fetchCompanyProcedures,
  fetchCompanyActivities,
} from '@/lib/queries/companies'
import { EnrichmentCard } from '@/components/enrichment/enrichment-card'
import { EnrichButton } from '@/components/enrichment/enrich-button'
import { CategoryBadge } from '@/components/ui/category-badge'
import { StageBadge } from '@/components/ui/stage-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft, ExternalLink, Pencil, Sparkles,
  Building2, MapPin, Globe, Phone,
  Linkedin, Calendar, Mail,
} from 'lucide-react'
import type { Company } from '@/lib/supabase/types'

export const runtime = 'edge'

interface PageProps {
  params: Promise<{ id: string }>
}

interface ContactRow {
  id: string
  first_name: string
  last_name: string | null
  title: string | null
  email: string | null
  phone: string | null
  stage: string | null
  priority_tier: string | null
  linkedin: string | null
  owner: string | null
}

interface ProcedureRow {
  id: string
  cpt_code: string
  description: string | null
  category: string | null
  volume_level: string | null
  notes: string | null
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

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: company, error } = await fetchCompanyById(supabase, id)
  if (error || !company) notFound()

  const [
    { data: contacts },
    { data: enrichment },
    { data: procedures },
    { data: activities },
  ] = await Promise.all([
    fetchCompanyContacts(supabase, id),
    fetchCompanyEnrichment(supabase, id),
    fetchCompanyProcedures(supabase, id),
    fetchCompanyActivities(supabase, id),
  ])

  const c = company as Company

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/dashboard/companies"
          className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0A0A0A] mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Companies
        </Link>

        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#1A1A2E]">{c.company_name as string}</h1>
              <CategoryBadge category={c.flexbone_category as string | null} />
            </div>
            {c.clean_company_name && (
              <p className="text-sm text-[#6B7280]">{c.clean_company_name}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-[#6B7280]">
              {(c.city || c.state) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {[c.city, c.state].filter(Boolean).join(', ')}
                </span>
              )}
              {c.website && (
                <a
                  href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {c.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 h-9">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <EnrichButton
              entityId={id}
              entityType="company"
              entityName={c.company_name as string}
              lastEnrichedDate={(() => {
                const e = enrichment as { enriched_date?: string | null; created_at?: string | null } | null
                return e?.enriched_date || e?.created_at || null
              })()}
            />
          </div>
        </div>
      </div>

      {/* Body: Tabs + Sidebar */}
      <div className="flex gap-6">
        {/* Main content with tabs */}
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="overview">
            <TabsList className="bg-white border border-[#E5E5E5] h-10">
              <TabsTrigger value="overview" className="text-sm data-[state=active]:bg-[#F5C518]/10 data-[state=active]:text-[#0A0A0A]">Overview</TabsTrigger>
              <TabsTrigger value="contacts" className="text-sm data-[state=active]:bg-[#F5C518]/10 data-[state=active]:text-[#0A0A0A]">
                Contacts ({contacts.length})
              </TabsTrigger>
              <TabsTrigger value="enrichment" className="text-sm data-[state=active]:bg-[#F5C518]/10 data-[state=active]:text-[#0A0A0A]">
                Enrichment {enrichment ? '✓' : ''}
              </TabsTrigger>
              <TabsTrigger value="procedures" className="text-sm data-[state=active]:bg-[#F5C518]/10 data-[state=active]:text-[#0A0A0A]">
                Procedures ({procedures.length})
              </TabsTrigger>
              <TabsTrigger value="activities" className="text-sm data-[state=active]:bg-[#F5C518]/10 data-[state=active]:text-[#0A0A0A]">
                Activities ({activities.length})
              </TabsTrigger>
            </TabsList>

            {/* ─── Overview Tab ─── */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              <OverviewSection title="Company Info" icon={<Building2 className="h-4 w-4" />}>
                <FieldGrid>
                  <OverviewField label="Company Name" value={c.company_name} />
                  <OverviewField label="Clean Name" value={c.clean_company_name} />
                  <OverviewField label="Category" value={c.flexbone_category} />
                  <OverviewField label="Company Type" value={c.company_type} />
                  <OverviewField label="Source" value={c.source} />
                  <OverviewField label="Company Size" value={c.company_size ? c.company_size.toLocaleString() : null} />
                  <OverviewField label="EHR" value={c.ehr} />
                  <OverviewField label="Account Owner" value={c.account_owner} />
                  <OverviewField label="Account Stage" value={c.account_stage} />
                  <OverviewField label="Contact Count" value={String(c.contact_count || 0)} />
                </FieldGrid>
              </OverviewSection>

              <OverviewSection title="Location" icon={<MapPin className="h-4 w-4" />}>
                <FieldGrid>
                  <OverviewField label="City" value={c.city} />
                  <OverviewField label="State" value={c.state} />
                  <OverviewField label="Street" value={c.company_street} />
                  <OverviewField label="Postal Code" value={c.company_postal_code} />
                  <OverviewField label="Phone" value={c.company_phone} />
                </FieldGrid>
              </OverviewSection>

              <OverviewSection title="Healthcare Details" icon={<Building2 className="h-4 w-4" />}>
                <FieldGrid>
                  <OverviewField label="Specialty" value={c.specialty} />
                  <OverviewField label="Subspecialties" value={c.subspecialties} />
                  <OverviewField label="EHR Vendor" value={c.ehr_vendor} />
                  <OverviewField label="Patient Portal" value={c.patient_portal} />
                  <OverviewField label="Has ASC" value={c.has_asc ? 'Yes' : 'No'} />
                  <OverviewField label="ASC/OR Count" value={c.asc_or_count ? String(c.asc_or_count) : null} />
                  <OverviewField label="Surgeries/Year" value={c.surgeries_per_year} />
                  <OverviewField label="Locations" value={c.locations_count ? String(c.locations_count) : null} />
                  <OverviewField label="Founded" value={c.founded_year ? String(c.founded_year) : null} />
                  <OverviewField label="Practice NPI" value={c.practice_npi} />
                  <OverviewField label="ASC NPI" value={c.asc_npi} />
                  <OverviewField label="Insurance Plans" value={c.insurance_plans_accepted} />
                  <OverviewField label="High Volume CPT" value={c.high_volume_cpt_codes} />
                </FieldGrid>
              </OverviewSection>

              <OverviewSection title="Apollo Data" icon={<Globe className="h-4 w-4" />}>
                <FieldGrid>
                  <OverviewField label="Industry" value={c.industry} />
                  <OverviewField label="Annual Revenue" value={c.annual_revenue ? `$${c.annual_revenue.toLocaleString()}` : null} />
                  <OverviewField label="Total Funding" value={c.total_funding ? `$${c.total_funding.toLocaleString()}` : null} />
                  <OverviewField label="Latest Funding" value={c.latest_funding} />
                  <OverviewField label="Technologies" value={c.technologies} />
                  <OverviewField label="SIC Codes" value={c.sic_codes} />
                  <OverviewField label="NAICS Codes" value={c.naics_codes} />
                  <OverviewField label="LinkedIn" value={c.company_linkedin_url} isLink />
                  <OverviewField label="Description" value={c.short_description} />
                </FieldGrid>
              </OverviewSection>

              {c.notes && (
                <OverviewSection title="Notes" icon={<Building2 className="h-4 w-4" />}>
                  <p className="text-sm text-[#374151] whitespace-pre-wrap">{c.notes}</p>
                </OverviewSection>
              )}
            </TabsContent>

            {/* ─── Contacts Tab ─── */}
            <TabsContent value="contacts" className="mt-4">
              <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#FAFAFA] hover:bg-[#FAFAFA]">
                      <TableHead className="text-xs font-medium text-[#6B7280]">Name</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Title</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Email</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Phone</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Stage</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Owner</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.length > 0 ? (
                      (contacts as ContactRow[]).map((contact) => (
                        <TableRow key={contact.id} className="hover:bg-[#FAFAFA]">
                          <TableCell className="py-3">
                            <Link
                              href={`/dashboard/contacts/${contact.id}`}
                              className="text-sm font-medium text-[#0A0A0A] hover:text-[#F5C518]"
                            >
                              {contact.first_name} {contact.last_name || ''}
                            </Link>
                          </TableCell>
                          <TableCell className="text-sm text-[#374151]">
                            {contact.title || <span className="text-[#9CA3AF]">—</span>}
                          </TableCell>
                          <TableCell>
                            {contact.email ? (
                              <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:underline">
                                {contact.email}
                              </a>
                            ) : (
                              <span className="text-sm text-[#9CA3AF]">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-[#374151]">
                            {contact.phone || <span className="text-[#9CA3AF]">—</span>}
                          </TableCell>
                          <TableCell>
                            <StageBadge stage={contact.stage} />
                          </TableCell>
                          <TableCell className="text-sm text-[#374151]">
                            {contact.owner || <span className="text-[#9CA3AF]">—</span>}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-sm text-[#9CA3AF]">
                          No contacts linked to this company.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* ─── Enrichment Tab ─── */}
            <TabsContent value="enrichment" className="mt-4">
              {enrichment ? (
                <div className="space-y-4">
                  <EnrichmentCard data={enrichment as Record<string, unknown>} />
                  <div className="flex justify-center">
                    <EnrichButton
                      entityId={id}
                      entityType="company"
                      entityName={c.company_name as string}
                      lastEnrichedDate={(() => {
                        const e = enrichment as { enriched_date?: string | null; created_at?: string | null } | null
                        return e?.enriched_date || e?.created_at || null
                      })()}
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[#E5E5E5] bg-white p-12 text-center">
                  <Sparkles className="h-10 w-10 text-[#D1D5DB] mx-auto mb-3" />
                  <h3 className="text-base font-medium text-[#374151] mb-1">No enrichment data yet</h3>
                  <p className="text-sm text-[#9CA3AF] mb-4">
                    Run AI enrichment to gather facility intelligence, CPT codes, technology stack, and more.
                  </p>
                  <EnrichButton
                    entityId={id}
                    entityType="company"
                    entityName={c.company_name as string}
                  />
                </div>
              )}
            </TabsContent>

            {/* ─── Procedures Tab ─── */}
            <TabsContent value="procedures" className="mt-4">
              <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#FAFAFA] hover:bg-[#FAFAFA]">
                      <TableHead className="text-xs font-medium text-[#6B7280]">CPT Code</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Description</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Category</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Volume</TableHead>
                      <TableHead className="text-xs font-medium text-[#6B7280]">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {procedures.length > 0 ? (
                      (procedures as ProcedureRow[]).map((proc) => (
                        <TableRow key={proc.id} className="hover:bg-[#FAFAFA]">
                          <TableCell>
                            <span className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-mono font-medium text-blue-700">
                              {proc.cpt_code}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-[#374151]">{proc.description || '—'}</TableCell>
                          <TableCell className="text-sm text-[#374151]">{proc.category || '—'}</TableCell>
                          <TableCell className="text-sm text-[#374151]">{proc.volume_level || '—'}</TableCell>
                          <TableCell className="text-sm text-[#6B7280] max-w-xs truncate">{proc.notes || '—'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-sm text-[#9CA3AF]">
                          No procedure intelligence data available.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* ─── Activities Tab ─── */}
            <TabsContent value="activities" className="mt-4">
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {(activities as ActivityRow[]).map((act) => (
                    <div key={act.id} className="rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <ActivityIcon type={act.activity_type} />
                          <div>
                            <p className="text-sm font-medium text-[#374151] capitalize">
                              {act.activity_type}
                              {act.channel && <span className="text-[#9CA3AF] font-normal"> via {act.channel}</span>}
                            </p>
                            {act.subject && (
                              <p className="text-sm text-[#6B7280]">{act.subject}</p>
                            )}
                          </div>
                        </div>
                        <time className="text-xs text-[#9CA3AF]">
                          {new Date(act.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </time>
                      </div>
                      {act.body && (
                        <p className="mt-2 text-sm text-[#374151] whitespace-pre-wrap pl-8">{act.body}</p>
                      )}
                      {act.outcome && (
                        <p className="mt-1 text-xs text-[#6B7280] pl-8">Outcome: {act.outcome}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[#E5E5E5] bg-white p-12 text-center">
                  <Calendar className="h-10 w-10 text-[#D1D5DB] mx-auto mb-3" />
                  <h3 className="text-base font-medium text-[#374151] mb-1">No activities yet</h3>
                  <p className="text-sm text-[#9CA3AF]">
                    Activities will appear here as your team engages with this company.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right sidebar */}
        <aside className="hidden xl:block w-72 shrink-0">
          <div className="sticky top-20 space-y-4">
            {/* Quick Stats */}
            <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm">
              <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Quick Stats</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B7280]">Contacts</span>
                  <span className="text-sm font-semibold text-[#0A0A0A]">{contacts.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B7280]">Company Size</span>
                  <span className="text-sm font-semibold text-[#0A0A0A]">
                    {c.company_size ? c.company_size.toLocaleString() : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B7280]">Enriched</span>
                  <span className={`text-sm font-semibold ${enrichment ? 'text-emerald-600' : 'text-[#9CA3AF]'}`}>
                    {enrichment ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B7280]">Activities</span>
                  <span className="text-sm font-semibold text-[#0A0A0A]">{activities.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B7280]">Stage</span>
                  <span className="text-sm font-semibold text-[#0A0A0A]">{c.account_stage || '—'}</span>
                </div>
              </div>
            </div>

            {/* Key Contacts */}
            {contacts.length > 0 && (
              <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm">
                <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Key Contacts</h4>
                <div className="space-y-3">
                  {(contacts as ContactRow[]).slice(0, 5).map((contact) => (
                    <Link
                      key={contact.id}
                      href={`/dashboard/contacts/${contact.id}`}
                      className="flex items-center gap-2.5 group"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1A1A2E] text-[10px] font-semibold text-white shrink-0">
                        {contact.first_name?.[0]}{contact.last_name?.[0] || ''}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#374151] group-hover:text-[#F5C518] truncate transition-colors">
                          {contact.first_name} {contact.last_name || ''}
                        </p>
                        <p className="text-xs text-[#9CA3AF] truncate">{contact.title || 'No title'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Enrichment Date */}
            {enrichment && (
              <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm">
                <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Last Enrichment</h4>
                <p className="text-sm text-[#374151]">
                  {(() => {
                    const e = enrichment as { enriched_date?: string | null; created_at?: string | null }
                    const d = e.enriched_date || e.created_at
                    return d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'
                  })()}
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

// ─── Helper Components ──────────────────────────────────────

function OverviewSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-5 py-3.5">
        <span className="text-[#6B7280]">{icon}</span>
        <h3 className="text-sm font-semibold text-[#1A1A2E]">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">{children}</div>
}

function OverviewField({ label, value, isLink }: { label: string; value: string | null; isLink?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">{label}</p>
      {value ? (
        isLink ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
            {value}
          </a>
        ) : (
          <p className="text-sm text-[#374151]">{value}</p>
        )
      ) : (
        <p className="text-sm text-[#D1D5DB]">—</p>
      )}
    </div>
  )
}

function ActivityIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    email: <Mail className="h-5 w-5 text-blue-500" />,
    call: <Phone className="h-5 w-5 text-green-500" />,
    linkedin: <Linkedin className="h-5 w-5 text-blue-700" />,
    meeting: <Calendar className="h-5 w-5 text-purple-500" />,
    note: <Building2 className="h-5 w-5 text-gray-500" />,
    enrichment: <Sparkles className="h-5 w-5 text-[#F5C518]" />,
  }
  return <span className="shrink-0">{icons[type] || <Building2 className="h-5 w-5 text-gray-400" />}</span>
}
