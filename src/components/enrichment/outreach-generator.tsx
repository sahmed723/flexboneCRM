'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Mail, Linkedin, Phone, Loader2, Copy, Check, ExternalLink,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────

interface EmailVariant {
  variant: string
  subject: string
  body: string
  angle: string
}

interface LinkedInContent {
  connection_request: string
  follow_up_inmail: {
    subject: string
    body: string
  }
  profile_comment_ideas: string[]
}

interface PhoneContent {
  opening: string
  qualifying_questions: string[]
  pain_point_probes: string[]
  value_proposition: string
  objection_handlers: Record<string, string>
  close: string
  voicemail_script: string
}

// ─── Copy Button ─────────────────────────────────────────

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="inline-flex items-center gap-1 rounded-md border border-[#E5E5E5] px-2.5 py-1 text-xs font-medium text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#374151] transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      {label || 'Copy'}
    </button>
  )
}

// ─── Tab Button ──────────────────────────────────────────

function TabButton({
  active, onClick, icon, label,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-[#F5C518]/10 text-[#0A0A0A] border border-[#F5C518]/30'
          : 'text-[#6B7280] hover:bg-[#F9FAFB] border border-transparent'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

// ─── Main Component ──────────────────────────────────────

interface OutreachGeneratorProps {
  contactId: string
  contactName: string
  contactEmail?: string | null
}

export function OutreachGenerator({ contactId, contactName, contactEmail }: OutreachGeneratorProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'linkedin' | 'phone'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [emails, setEmails] = useState<EmailVariant[] | null>(null)
  const [linkedIn, setLinkedIn] = useState<LinkedInContent | null>(null)
  const [phoneScript, setPhoneScript] = useState<PhoneContent | null>(null)

  const generate = async (channel: 'email' | 'linkedin' | 'phone') => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/enrich/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, channel }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      const content = data.content

      if (channel === 'email' && content?.emails) {
        setEmails(content.emails)
      } else if (channel === 'linkedin') {
        setLinkedIn(content)
      } else if (channel === 'phone') {
        setPhoneScript(content)
      }
    } catch (err) {
      setError((err as Error).message)
    }

    setLoading(false)
  }

  const handleTabChange = (tab: 'email' | 'linkedin' | 'phone') => {
    setActiveTab(tab)
    setError(null)
  }

  const hasContent = (activeTab === 'email' && emails) || (activeTab === 'linkedin' && linkedIn) || (activeTab === 'phone' && phoneScript)

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#F0F0F0] px-5 py-3.5">
        <h3 className="text-sm font-semibold text-[#1A1A2E]">AI Outreach Generator</h3>
        <span className="text-xs text-[#9CA3AF]">for {contactName}</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2">
          <TabButton active={activeTab === 'email'} onClick={() => handleTabChange('email')} icon={<Mail className="h-3.5 w-3.5" />} label="Email" />
          <TabButton active={activeTab === 'linkedin'} onClick={() => handleTabChange('linkedin')} icon={<Linkedin className="h-3.5 w-3.5" />} label="LinkedIn" />
          <TabButton active={activeTab === 'phone'} onClick={() => handleTabChange('phone')} icon={<Phone className="h-3.5 w-3.5" />} label="Phone Script" />
        </div>

        {/* Generate button */}
        {!hasContent && !loading && (
          <div className="text-center py-6">
            <p className="text-sm text-[#9CA3AF] mb-3">
              Generate personalized {activeTab} outreach using AI enrichment data
            </p>
            <Button
              onClick={() => generate(activeTab)}
              className="bg-[#F5C518] text-[#0A0A0A] hover:bg-[#F5C518]/90 font-medium text-sm"
            >
              Generate {activeTab === 'email' ? 'Emails' : activeTab === 'linkedin' ? 'LinkedIn Messages' : 'Phone Script'}
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[#F5C518] mr-2" />
            <span className="text-sm text-[#6B7280]">Generating {activeTab} content...</span>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {/* Email content */}
        {activeTab === 'email' && emails && (
          <div className="space-y-4">
            {emails.map((email, i) => (
              <div key={i} className="rounded-md border border-[#E5E5E5] overflow-hidden">
                <div className="flex items-center justify-between bg-[#F9FAFB] px-4 py-2.5 border-b border-[#E5E5E5]">
                  <div>
                    <span className="text-xs font-semibold text-[#374151]">Variant {i + 1}: {email.variant}</span>
                    <span className="text-xs text-[#9CA3AF] ml-2">{email.angle}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <CopyBtn text={`Subject: ${email.subject}\n\n${email.body}`} label="Copy All" />
                    {contactEmail && (
                      <a
                        href={`mailto:${contactEmail}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body.replace(/\\n/g, '\n'))}`}
                        className="inline-flex items-center gap-1 rounded-md border border-[#E5E5E5] px-2.5 py-1 text-xs font-medium text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#374151] transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Draft
                      </a>
                    )}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div>
                    <span className="text-xs font-medium text-[#9CA3AF]">Subject:</span>
                    <p className="text-sm font-medium text-[#374151]">{email.subject}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-[#9CA3AF]">Body:</span>
                    <p className="text-sm text-[#374151] whitespace-pre-wrap leading-relaxed mt-0.5">
                      {email.body.replace(/\\n/g, '\n')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => generate('email')}
              className="text-xs"
            >
              Regenerate
            </Button>
          </div>
        )}

        {/* LinkedIn content */}
        {activeTab === 'linkedin' && linkedIn && (
          <div className="space-y-4">
            <div className="rounded-md border border-[#E5E5E5] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[#374151] uppercase tracking-wide">Connection Request</p>
                <CopyBtn text={linkedIn.connection_request} />
              </div>
              <p className="text-sm text-[#374151]">{linkedIn.connection_request}</p>
              <p className="mt-1 text-[10px] text-[#9CA3AF]">{linkedIn.connection_request.length} / 300 characters</p>
            </div>

            <div className="rounded-md border border-[#E5E5E5] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[#374151] uppercase tracking-wide">Follow-up InMail</p>
                <CopyBtn text={`Subject: ${linkedIn.follow_up_inmail.subject}\n\n${linkedIn.follow_up_inmail.body}`} />
              </div>
              <p className="text-xs text-[#9CA3AF] mb-1">Subject: <span className="text-[#374151] font-medium">{linkedIn.follow_up_inmail.subject}</span></p>
              <p className="text-sm text-[#374151] whitespace-pre-wrap">{linkedIn.follow_up_inmail.body}</p>
            </div>

            {linkedIn.profile_comment_ideas && linkedIn.profile_comment_ideas.length > 0 && (
              <div className="rounded-md border border-[#E5E5E5] p-4">
                <p className="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-2">Profile Comment Ideas</p>
                <ul className="space-y-1.5">
                  {linkedIn.profile_comment_ideas.map((idea, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-xs text-[#9CA3AF] mt-0.5">{i + 1}.</span>
                      <span className="text-sm text-[#374151]">{idea}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={() => generate('linkedin')} className="text-xs">
              Regenerate
            </Button>
          </div>
        )}

        {/* Phone script */}
        {activeTab === 'phone' && phoneScript && (
          <div className="space-y-4">
            <div className="rounded-md border border-[#E5E5E5] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[#374151] uppercase tracking-wide">Opening</p>
                <CopyBtn text={phoneScript.opening} />
              </div>
              <p className="text-sm text-[#374151] italic">&ldquo;{phoneScript.opening}&rdquo;</p>
            </div>

            <div className="rounded-md border border-[#E5E5E5] p-4">
              <p className="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-2">Qualifying Questions</p>
              <ul className="space-y-1.5">
                {phoneScript.qualifying_questions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#374151]">
                    <span className="text-[#F5C518] font-bold">?</span> {q}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border border-[#E5E5E5] p-4">
              <p className="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-2">Pain Point Probes</p>
              <ul className="space-y-1.5">
                {phoneScript.pain_point_probes.map((p, i) => (
                  <li key={i} className="text-sm text-[#374151]">&#x2022; {p}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border-l-[3px] border-[#F5C518] bg-[#F5C518]/5 p-4">
              <p className="text-xs font-semibold text-[#F5C518] uppercase tracking-wide mb-1">Value Proposition</p>
              <p className="text-sm text-[#374151]">{phoneScript.value_proposition}</p>
            </div>

            <div className="rounded-md border border-[#E5E5E5] p-4">
              <p className="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-3">Objection Handlers</p>
              <div className="space-y-3">
                {Object.entries(phoneScript.objection_handlers).map(([objection, response]) => (
                  <div key={objection}>
                    <p className="text-xs font-medium text-red-500 mb-0.5">&ldquo;{objection.replace(/_/g, ' ')}&rdquo;</p>
                    <p className="text-sm text-[#374151] pl-3 border-l-2 border-[#E5E5E5]">{response}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-[#E5E5E5] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[#374151] uppercase tracking-wide">Close</p>
                <CopyBtn text={phoneScript.close} />
              </div>
              <p className="text-sm text-[#374151]">{phoneScript.close}</p>
            </div>

            <div className="rounded-md bg-[#F9FAFB] border border-[#E5E5E5] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[#374151] uppercase tracking-wide">Voicemail Script</p>
                <CopyBtn text={phoneScript.voicemail_script} />
              </div>
              <p className="text-sm text-[#6B7280] italic">&ldquo;{phoneScript.voicemail_script}&rdquo;</p>
            </div>

            <Button variant="outline" size="sm" onClick={() => generate('phone')} className="text-xs">
              Regenerate
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
