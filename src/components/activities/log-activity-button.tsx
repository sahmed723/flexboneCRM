'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LogActivityModal } from '@/components/log-activity-modal'
import { Plus } from 'lucide-react'

export function LogActivityButtonClient() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[#F5C518] text-[#0A0A0A] hover:bg-[#F5C518]/90 text-sm font-medium"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Log Activity
      </Button>
      <LogActivityModal open={open} onOpenChange={setOpen} />
    </>
  )
}
