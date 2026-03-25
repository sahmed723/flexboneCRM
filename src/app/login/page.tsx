'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A0A' }}>
      <div className="w-full max-w-md px-8">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <svg
            width="200"
            height="48"
            viewBox="0 0 200 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <text
              x="50%"
              y="50%"
              dominantBaseline="central"
              textAnchor="middle"
              fill="#F5C518"
              fontFamily="Inter, system-ui, sans-serif"
              fontSize="32"
              fontWeight="700"
              letterSpacing="-0.02em"
            >
              flexbone
            </text>
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-semibold text-white text-center mb-2">
          Sign in to Flexbone CRM
        </h1>
        <p className="text-sm text-neutral-400 text-center mb-8">
          Enter your credentials to access the dashboard
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-neutral-300 text-sm">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@flexbone.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-[#F5C518] focus:ring-[#F5C518]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-neutral-300 text-sm">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-[#F5C518] focus:ring-[#F5C518]"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 rounded-md p-3">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full font-semibold text-black hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#F5C518' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-xs text-neutral-600 text-center mt-8">
          Flexbone CRM &middot; Healthcare Revenue Intelligence
        </p>
      </div>
    </div>
  )
}
