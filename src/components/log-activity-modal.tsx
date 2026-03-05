'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { searchContactsForSelect, createActivity } from '@/lib/queries/activities'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Search, Loader2 } from 'lucide-react'

const ACTIVITY_TYPES = [
  { value: 'email', label: 'Email' },
  { value: 'call', label: 'Call' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'note', label: 'Note' },
]

const CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'in_person', label: 'In Person' },
  { value: 'video_call', label: 'Video Call' },
]

const OUTCOMES = [
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
  { value: 'no_response', label: 'No Response' },
  { value: 'follow_up', label: 'Follow Up Needed' },
]

interface ContactOption {
  id: string
  first_name: string
  last_name: string | null
  email: string | null
  company_name: string | null
}

interface LogActivityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LogActivityModal({ open, onOpenChange }: LogActivityModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)

  // Contact search
  const [contactQuery, setContactQuery] = useState('')
  const [contactResults, setContactResults] = useState<ContactOption[]>([])
  const [selectedContact, setSelectedContact] = useState<ContactOption | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Form fields
  const [activityType, setActivityType] = useState('email')
  const [channel, setChannel] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [outcome, setOutcome] = useState('')

  const searchContacts = useCallback(async (term: string) => {
    if (term.length < 2) {
      setContactResults([])
      return
    }
    setSearching(true)
    const results = await searchContactsForSelect(supabase, term)
    setContactResults(results)
    setShowResults(true)
    setSearching(false)
  }, [supabase])

  useEffect(() => {
    if (contactQuery.length < 2) {
      setContactResults([])
      setShowResults(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchContacts(contactQuery), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [contactQuery, searchContacts])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const resetForm = () => {
    setContactQuery('')
    setSelectedContact(null)
    setContactResults([])
    setActivityType('email')
    setChannel('')
    setSubject('')
    setBody('')
    setOutcome('')
  }

  const handleSubmit = async () => {
    if (!activityType) return
    setSaving(true)

    const { error } = await createActivity(supabase, {
      contact_id: selectedContact?.id || null,
      activity_type: activityType,
      channel: channel || null,
      subject: subject || null,
      body: body || null,
      outcome: outcome || null,
    })

    setSaving(false)
    if (!error) {
      resetForm()
      onOpenChange(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#1A1A2E]">Log Activity</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Contact search */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#374151]">Contact</Label>
            {selectedContact ? (
              <div className="flex items-center justify-between rounded-md border border-[#E5E5E5] bg-[#F9FAFB] px-3 py-2">
                <div>
                  <span className="text-sm font-medium text-[#374151]">
                    {selectedContact.first_name} {selectedContact.last_name}
                  </span>
                  {selectedContact.company_name && (
                    <span className="text-xs text-[#9CA3AF] ml-2">at {selectedContact.company_name}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedContact(null); setContactQuery('') }}
                  className="text-xs text-[#6B7280] hover:text-[#374151]"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative" ref={resultsRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                <Input
                  value={contactQuery}
                  onChange={(e) => setContactQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="pl-9 h-9 bg-white border-[#E5E5E5] text-sm"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] animate-spin" />
                )}
                {showResults && contactResults.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border border-[#E5E5E5] bg-white shadow-lg max-h-48 overflow-y-auto">
                    {contactResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedContact(c)
                          setShowResults(false)
                          setContactQuery(`${c.first_name} ${c.last_name || ''}`.trim())
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[#F9FAFB] transition-colors"
                      >
                        <div>
                          <span className="font-medium text-[#374151]">{c.first_name} {c.last_name}</span>
                          {c.email && <span className="text-xs text-[#9CA3AF] ml-2">{c.email}</span>}
                        </div>
                        {c.company_name && (
                          <span className="text-xs text-[#9CA3AF] shrink-0 ml-2">{c.company_name}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {showResults && contactQuery.length >= 2 && contactResults.length === 0 && !searching && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border border-[#E5E5E5] bg-white p-3 shadow-lg">
                    <p className="text-sm text-[#9CA3AF] text-center">No contacts found</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Activity type + Channel */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#374151]">Activity Type</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#374151]">Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#374151]">Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Activity subject..."
              className="h-9 bg-white border-[#E5E5E5] text-sm"
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#374151]">Details</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Activity details..."
              className="bg-white border-[#E5E5E5] text-sm min-h-[80px]"
            />
          </div>

          {/* Outcome */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#374151]">Outcome</Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select outcome" />
              </SelectTrigger>
              <SelectContent>
                {OUTCOMES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-sm">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !activityType}
            className="bg-[#F5C518] text-[#0A0A0A] hover:bg-[#F5C518]/90 text-sm font-medium"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Log Activity
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
