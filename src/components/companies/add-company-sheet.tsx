'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'

const CATEGORIES = [
  'ASC', 'SNF', 'BPO', 'Health System', 'Insurer',
  'Optometry', 'DSO', 'Newsletter', 'ASC Association',
]

export function AddCompanySheet() {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const companyName = formData.get('company_name') as string

    if (!companyName.trim()) {
      setError('Company name is required')
      setSaving(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase.from('companies') as any).insert({
      company_name: companyName.trim(),
      clean_company_name: (formData.get('clean_name') as string)?.trim() || null,
      website: (formData.get('website') as string)?.trim() || null,
      city: (formData.get('city') as string)?.trim() || null,
      state: (formData.get('state') as string)?.trim() || null,
      company_size: formData.get('company_size') ? Number(formData.get('company_size')) : null,
      flexbone_category: (formData.get('category') as string) || null,
      ehr: (formData.get('ehr') as string)?.trim() || null,
      source: 'Manual',
    })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="h-9 gap-1.5 bg-[#F5C518] text-[#0A0A0A] hover:bg-[#F5C518]/90 font-medium">
          <Plus className="h-4 w-4" />
          Add Company
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[440px] sm:max-w-[440px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[#1A1A2E]">Add New Company</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name" className="text-sm">Company Name *</Label>
            <Input id="company_name" name="company_name" required className="h-9" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clean_name" className="text-sm">Clean / Colloquial Name</Label>
            <Input id="clean_name" name="clean_name" className="h-9" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="text-sm">Website</Label>
            <Input id="website" name="website" placeholder="https://" className="h-9" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm">City</Label>
              <Input id="city" name="city" className="h-9" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="text-sm">State</Label>
              <Input id="state" name="state" maxLength={2} placeholder="GA" className="h-9" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_size" className="text-sm">Company Size</Label>
            <Input id="company_size" name="company_size" type="number" className="h-9" />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Category</Label>
            <Select name="category">
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ehr" className="text-sm">EHR System</Label>
            <Input id="ehr" name="ehr" className="h-9" />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-9"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 h-9 bg-[#F5C518] text-[#0A0A0A] hover:bg-[#F5C518]/90 font-medium"
            >
              {saving ? 'Saving...' : 'Add Company'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
