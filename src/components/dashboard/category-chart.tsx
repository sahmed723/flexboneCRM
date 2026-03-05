'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const CATEGORY_COLORS: Record<string, string> = {
  ASC: '#3B82F6',
  Optometry: '#14B8A6',
  SNF: '#10B981',
  'Health System': '#EF4444',
  Insurer: '#F97316',
  BPO: '#A855F7',
  DSO: '#EC4899',
  Newsletter: '#6B7280',
  'ASC Association': '#0EA5E9',
}

interface CategoryChartProps {
  data: { category: string; count: number }[]
}

export function CategoryChart({ data }: CategoryChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
        <XAxis
          dataKey="category"
          tick={{ fontSize: 12, fill: '#6B7280' }}
          axisLine={{ stroke: '#E5E5E5' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => v.toLocaleString()}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E5E5',
            borderRadius: '8px',
            fontSize: '13px',
          }}
          formatter={(value) => [Number(value).toLocaleString(), 'Contacts']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.category}
              fill={CATEGORY_COLORS[entry.category] || '#6B7280'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
