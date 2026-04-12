"use client"

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type ParetoCategoryPoint = {
  category: string
  revenue: number
  cumulative_share: number
}

type ParetoCategoryChartProps = {
  data: ParetoCategoryPoint[]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value)
}

export function ParetoCategoryChart({ data }: ParetoCategoryChartProps) {
  const chartData = [...data].slice(0, 15)

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ left: 10, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
          <XAxis dataKey="category" tick={{ fill: "#475569", fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={90} />
          <YAxis
            yAxisId="revenue"
            tick={{ fill: "#475569", fontSize: 12 }}
            tickFormatter={(value) =>
              new Intl.NumberFormat("pt-BR", {
                notation: "compact",
                compactDisplay: "short",
              }).format(value)
            }
          />
          <YAxis
            yAxisId="share"
            orientation="right"
            domain={[0, 100]}
            tick={{ fill: "#334155", fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "Receita") return formatCurrency(value)
              return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
            }}
          />
          <Legend />
          <Bar yAxisId="revenue" dataKey="revenue" name="Receita" fill="#0f172a" radius={[6, 6, 0, 0]} />
          <Line
            yAxisId="share"
            type="monotone"
            dataKey="cumulative_share"
            name="Acumulado (%)"
            stroke="#f97316"
            strokeWidth={3}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
