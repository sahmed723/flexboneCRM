'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
import { Settings, Save, Loader2, FlaskConical, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface ConfigRow {
  id: string
  config_key: string
  label: string
  description: string | null
  value: string
  config_type: string
  updated_at: string
}

const MODELS = [
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (Fast, Cheap)' },
  { value: 'claude-opus-4-20250514', label: 'Claude Opus 4 (Best Quality)' },
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (Fastest, Cheapest)' },
]

export default function EnrichmentSettingsPage() {
  const [configs, setConfigs] = useState<ConfigRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})

  const supabase = createClient()

  useEffect(() => {
    loadConfigs()
  }, [])

  async function loadConfigs() {
    setLoading(true)
    const { data, error } = await supabase
      .from('enrichment_config')
      .select('*')
      .order('config_type', { ascending: true })

    if (error) {
      toast.error('Failed to load enrichment config')
      setLoading(false)
      return
    }

    const rows = (data || []) as ConfigRow[]
    setConfigs(rows)
    const values: Record<string, string> = {}
    for (const row of rows) {
      values[row.config_key] = row.value
    }
    setEditValues(values)
    setLoading(false)
  }

  async function saveConfig(configKey: string) {
    setSaving(configKey)
    const newValue = editValues[configKey]
    if (newValue === undefined) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('enrichment_config') as any)
      .update({ value: newValue, updated_at: new Date().toISOString() })
      .eq('config_key', configKey)

    if (error) {
      toast.error(`Failed to save: ${error.message}`)
    } else {
      toast.success('Saved')
      await loadConfigs()
    }
    setSaving(null)
  }

  async function testPrompt() {
    setTesting(true)
    setTestResult(null)

    try {
      // Find a known company to test with
      const { data: companies } = await supabase
        .from('companies')
        .select('id, company_name')
        .not('company_name', 'is', null)
        .limit(1)
        .single()

      if (!companies) {
        toast.error('No companies found to test with')
        setTesting(false)
        return
      }

      const response = await fetch('/api/enrich/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: (companies as { id: string }).id }),
      })

      const result = await response.json()

      if (result.success) {
        setTestResult(JSON.stringify(result.enrichment, null, 2))
        toast.success(`Test enrichment completed. Tokens used: ${result.tokens?.total || 'unknown'}`)
      } else {
        setTestResult(`Error: ${result.error}`)
        toast.error(result.error)
      }
    } catch (err) {
      setTestResult(`Error: ${(err as Error).message}`)
      toast.error('Test failed')
    } finally {
      setTesting(false)
    }
  }

  const promptConfigs = configs.filter(c => c.config_type === 'prompt')
  const settingConfigs = configs.filter(c => c.config_type === 'model' || c.config_type === 'setting')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-[#F5C518]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/settings" className="text-[#6B7280] hover:text-[#1A1A2E]">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="rounded-lg bg-[#F5C518]/10 p-2">
          <Settings className="h-5 w-5 text-[#F5C518]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1A1A2E]">Enrichment Settings</h1>
          <p className="text-sm text-[#6B7280]">Configure AI enrichment prompts and model settings</p>
        </div>
      </div>

      {/* Model & Settings */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#1A1A2E] uppercase tracking-wide">Model & Parameters</h2>

        {settingConfigs.map((config) => (
          <div key={config.config_key} className="space-y-1.5">
            <Label className="text-sm font-medium">{config.label}</Label>
            {config.description && <p className="text-xs text-[#6B7280]">{config.description}</p>}

            {config.config_key === 'enrichment_model' ? (
              <div className="flex items-center gap-2">
                <Select
                  value={editValues[config.config_key] || config.value}
                  onValueChange={(v) => setEditValues(prev => ({ ...prev, [config.config_key]: v }))}
                >
                  <SelectTrigger className="w-80 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() => saveConfig(config.config_key)}
                  disabled={saving === config.config_key || editValues[config.config_key] === config.value}
                  className="h-9 gap-1.5 bg-[#1A1A2E] text-white hover:bg-[#2A2A3E]"
                >
                  {saving === config.config_key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={editValues[config.config_key] || ''}
                  onChange={(e) => setEditValues(prev => ({ ...prev, [config.config_key]: e.target.value }))}
                  className="w-48 h-9 text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => saveConfig(config.config_key)}
                  disabled={saving === config.config_key || editValues[config.config_key] === config.value}
                  className="h-9 gap-1.5 bg-[#1A1A2E] text-white hover:bg-[#2A2A3E]"
                >
                  {saving === config.config_key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Prompts */}
      {promptConfigs.map((config) => (
        <div key={config.config_key} className="rounded-lg border border-[#E5E5E5] bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#1A1A2E]">{config.label}</h2>
              {config.description && <p className="text-xs text-[#6B7280] mt-0.5">{config.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#9CA3AF]">
                Last updated: {new Date(config.updated_at).toLocaleDateString()}
              </span>
              <Button
                size="sm"
                onClick={() => saveConfig(config.config_key)}
                disabled={saving === config.config_key || editValues[config.config_key] === config.value}
                className="h-8 gap-1.5 bg-[#1A1A2E] text-white hover:bg-[#2A2A3E]"
              >
                {saving === config.config_key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </Button>
            </div>
          </div>

          <textarea
            value={editValues[config.config_key] || ''}
            onChange={(e) => setEditValues(prev => ({ ...prev, [config.config_key]: e.target.value }))}
            rows={20}
            className="w-full rounded-md border border-[#E5E5E5] bg-[#FAFAFA] p-3 text-sm font-mono leading-relaxed focus:border-[#F5C518] focus:outline-none focus:ring-1 focus:ring-[#F5C518] resize-y"
            spellCheck={false}
          />
        </div>
      ))}

      {/* Test Prompt */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#1A1A2E]">Test Enrichment</h2>
            <p className="text-xs text-[#6B7280]">Run enrichment on a company to test the current prompt and model settings</p>
          </div>
          <Button
            onClick={testPrompt}
            disabled={testing}
            className="h-8 gap-1.5 bg-[#F5C518] text-[#0A0A0A] hover:bg-[#E5B516]"
          >
            {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
            {testing ? 'Running...' : 'Test Prompt'}
          </Button>
        </div>

        {testResult && (
          <pre className="max-h-96 overflow-auto rounded-md bg-[#0A0A0A] p-4 text-xs text-emerald-400 font-mono">
            {testResult}
          </pre>
        )}
      </div>
    </div>
  )
}
