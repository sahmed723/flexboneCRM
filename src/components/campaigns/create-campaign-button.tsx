'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createCampaign } from '@/lib/queries/campaigns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Loader2 } from 'lucide-react'

export function CreateCampaignButton() {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')

  const resetForm = () => {
    setName('')
    setDescription('')
    setStartDate('')
  }

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSaving(true)

    const { error } = await createCampaign(supabase, {
      name: name.trim(),
      description: description.trim() || null,
      start_date: startDate || null,
      status: 'active',
    })

    setSaving(false)
    if (!error) {
      resetForm()
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[#F5C518] text-[#0A0A0A] hover:bg-[#F5C518]/90 text-sm font-medium"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        New Campaign
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1A1A2E]">Create Campaign</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#374151]">Campaign Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., feb-asc-outreach"
                className="h-9 bg-white border-[#E5E5E5] text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#374151]">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Campaign description..."
                className="bg-white border-[#E5E5E5] text-sm min-h-[60px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#374151]">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 bg-white border-[#E5E5E5] text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="text-sm">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !name.trim()}
              className="bg-[#F5C518] text-[#0A0A0A] hover:bg-[#F5C518]/90 text-sm font-medium"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
