'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface EnrichButtonProps {
  entityId: string
  entityType: 'company' | 'contact'
  entityName: string
  lastEnrichedDate?: string | null
}

export function EnrichButton({ entityId, entityType, entityName, lastEnrichedDate }: EnrichButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleEnrich = async () => {
    setLoading(true)
    setResult(null)

    try {
      const endpoint = entityType === 'company'
        ? '/api/enrich/company'
        : '/api/enrich/contact'

      const body = entityType === 'company'
        ? { companyId: entityId }
        : { contactId: entityId }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (res.ok) {
        const tokenMsg = data.tokens?.total ? ` (${data.tokens.total.toLocaleString()} tokens)` : ''
        setResult({ success: true, message: `Enriched successfully${tokenMsg}` })
        toast.success(`${entityName} enriched successfully`)
        router.refresh()
      } else {
        const msg = data.error || 'Enrichment failed'
        setResult({ success: false, message: msg })
        toast.error(msg)
      }
    } catch (error) {
      const msg = (error as Error).message
      setResult({ success: false, message: msg })
      toast.error(`Enrichment failed: ${msg}`)
    }

    setLoading(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          onClick={handleEnrich}
          disabled={loading}
          size="sm"
          className="gap-1.5 h-9 bg-[#F5C518] text-[#0A0A0A] hover:bg-[#F5C518]/90 font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Enriching {entityName}...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              {lastEnrichedDate ? 'Re-enrich with AI' : 'Run AI Enrichment'}
            </>
          )}
        </Button>
      </div>

      {lastEnrichedDate && !result && (
        <p className="text-xs text-[#9CA3AF]">
          Last enriched: {new Date(lastEnrichedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      )}

      {!lastEnrichedDate && !result && !loading && (
        <p className="text-xs text-[#9CA3AF]">Not yet enriched</p>
      )}

      {result && (
        <div className={`flex items-center gap-1.5 text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}>
          {result.success ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
          {result.message}
        </div>
      )}
    </div>
  )
}
