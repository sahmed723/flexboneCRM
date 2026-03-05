import { cn } from '@/lib/utils'
import type { FlexboneCategory } from '@/lib/supabase/types'

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  ASC:              { bg: 'bg-blue-100',    text: 'text-blue-700' },
  SNF:              { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  BPO:              { bg: 'bg-purple-100',  text: 'text-purple-700' },
  'Health System':  { bg: 'bg-red-100',     text: 'text-red-700' },
  Insurer:          { bg: 'bg-orange-100',  text: 'text-orange-700' },
  Optometry:        { bg: 'bg-teal-100',    text: 'text-teal-700' },
  DSO:              { bg: 'bg-pink-100',    text: 'text-pink-700' },
  Newsletter:       { bg: 'bg-gray-100',    text: 'text-gray-700' },
  'ASC Association':{ bg: 'bg-sky-100',     text: 'text-sky-700' },
}

interface CategoryBadgeProps {
  category: FlexboneCategory | string | null
  className?: string
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  if (!category) return null

  const colors = CATEGORY_COLORS[category] || { bg: 'bg-gray-100', text: 'text-gray-600' }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        colors.bg,
        colors.text,
        className
      )}
    >
      {category}
    </span>
  )
}

export { CATEGORY_COLORS }
