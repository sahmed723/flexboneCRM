import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Settings, User, Users, Download, Upload, Key, Bell, Database } from 'lucide-react'
import { ExportContactsButton, ExportCompaniesButton } from '@/components/settings/export-buttons'

export const runtime = 'edge'

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

const TEAM_MEMBERS = [
  { name: 'Shafay Ahmed', email: 'shafay@flexbone.co', role: 'Admin', initials: 'SA' },
  { name: 'Sayem Ahmed', email: 'sayem@flexbone.co', role: 'Admin', initials: 'SA' },
]

export default async function SettingsPage() {
  const user = await getCurrentUser()

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[#F5C518]/10 p-2">
          <Settings className="h-5 w-5 text-[#F5C518]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1A1A2E]">Settings</h1>
          <p className="text-sm text-[#6B7280]">Manage your account and team preferences</p>
        </div>
      </div>

      {/* Profile */}
      <section className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-5 py-3.5">
          <User className="h-4 w-4 text-[#6B7280]" />
          <h2 className="text-sm font-semibold text-[#374151]">Profile</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1A1A2E] text-lg font-bold text-white">
              {user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#374151]">{user?.email || 'Not signed in'}</p>
              <p className="text-xs text-[#9CA3AF]">Account ID: {user?.id?.slice(0, 8) || '—'}...</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SettingsField label="Email" value={user?.email || '—'} />
            <SettingsField label="Role" value="Admin" />
            <SettingsField label="Created" value={user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'} />
            <SettingsField label="Last Sign In" value={user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'} />
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-5 py-3.5">
          <Users className="h-4 w-4 text-[#6B7280]" />
          <h2 className="text-sm font-semibold text-[#374151]">Team Members</h2>
        </div>
        <div className="divide-y divide-[#F0F0F0]">
          {TEAM_MEMBERS.map((member) => (
            <div key={member.email} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5C518]/10 text-xs font-semibold text-[#F5C518]">
                  {member.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#374151]">{member.name}</p>
                  <p className="text-xs text-[#9CA3AF]">{member.email}</p>
                </div>
              </div>
              <span className="rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-medium text-[#6B7280]">
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Import/Export */}
      <section className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-5 py-3.5">
          <Download className="h-4 w-4 text-[#6B7280]" />
          <h2 className="text-sm font-semibold text-[#374151]">Import / Export</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-[#E5E5E5] p-4">
            <div>
              <p className="text-sm font-medium text-[#374151]">Export Contacts</p>
              <p className="text-xs text-[#9CA3AF]">Download all contacts as a CSV file</p>
            </div>
            <ExportContactsButton />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[#E5E5E5] p-4">
            <div>
              <p className="text-sm font-medium text-[#374151]">Export Companies</p>
              <p className="text-xs text-[#9CA3AF]">Download all companies as a CSV file</p>
            </div>
            <ExportCompaniesButton />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[#E5E5E5] p-4">
            <div>
              <p className="text-sm font-medium text-[#374151]">Import Data</p>
              <p className="text-xs text-[#9CA3AF]">Upload contacts via Excel or CSV file</p>
            </div>
            <button className="flex items-center gap-1.5 rounded-md border border-[#E5E5E5] px-3 py-1.5 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors">
              <Upload className="h-3.5 w-3.5" />
              Import
            </button>
          </div>
        </div>
      </section>

      {/* API Keys */}
      <section className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-5 py-3.5">
          <Key className="h-4 w-4 text-[#6B7280]" />
          <h2 className="text-sm font-semibold text-[#374151]">API Keys</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-[#E5E5E5] p-4">
            <div>
              <p className="text-sm font-medium text-[#374151]">OpenAI API Key</p>
              <p className="text-xs text-[#9CA3AF]">Used for AI-powered contact enrichment</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#9CA3AF]">sk-...••••••••</span>
              <button className="rounded-md border border-[#E5E5E5] px-2 py-1 text-xs font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors">
                Update
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[#E5E5E5] p-4">
            <div>
              <p className="text-sm font-medium text-[#374151]">Apollo API Key</p>
              <p className="text-xs text-[#9CA3AF]">Used for contact data sourcing</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#D1D5DB]">Not configured</span>
              <button className="rounded-md border border-[#E5E5E5] px-2 py-1 text-xs font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors">
                Add Key
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Data Health */}
      <section className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-5 py-3.5">
          <Database className="h-4 w-4 text-[#6B7280]" />
          <h2 className="text-sm font-semibold text-[#374151]">Data Health</h2>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between rounded-lg border border-[#E5E5E5] p-4">
            <div>
              <p className="text-sm font-medium text-[#374151]">Data Integrity Dashboard</p>
              <p className="text-xs text-[#9CA3AF]">Verify contact counts, company links, and enrichment coverage</p>
            </div>
            <Link
              href="/dashboard/settings/data-health"
              className="flex items-center gap-1.5 rounded-md border border-[#E5E5E5] px-3 py-1.5 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors"
            >
              <Database className="h-3.5 w-3.5" />
              View Report
            </Link>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-5 py-3.5">
          <Bell className="h-4 w-4 text-[#6B7280]" />
          <h2 className="text-sm font-semibold text-[#374151]">Notifications</h2>
        </div>
        <div className="p-5 space-y-3">
          <NotificationToggle
            label="Pipeline stage changes"
            description="Get notified when a contact moves to a new stage"
            defaultChecked
          />
          <NotificationToggle
            label="New enrichment results"
            description="Get notified when AI enrichment completes"
            defaultChecked
          />
          <NotificationToggle
            label="Campaign milestones"
            description="Get notified when campaigns reach contact thresholds"
            defaultChecked={false}
          />
          <NotificationToggle
            label="Team activity digest"
            description="Daily summary of team engagement activity"
            defaultChecked={false}
          />
        </div>
      </section>
    </div>
  )
}

function SettingsField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">{label}</p>
      <p className="text-sm text-[#374151]">{value}</p>
    </div>
  )
}

function NotificationToggle({ label, description, defaultChecked }: { label: string; description: string; defaultChecked: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#E5E5E5] p-4">
      <div>
        <p className="text-sm font-medium text-[#374151]">{label}</p>
        <p className="text-xs text-[#9CA3AF]">{description}</p>
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input type="checkbox" defaultChecked={defaultChecked} className="peer sr-only" />
        <div className="peer h-5 w-9 rounded-full bg-[#E5E5E5] after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#F5C518] peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-[#F5C518]/20" />
      </label>
    </div>
  )
}
