"use client"

import { useMemo } from "react"
import {
  Bar,
  ComposedChart,
  CartesianGrid,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { TicketRangeDistributionPoint } from "@/lib/types"

type TicketRangeParetoChartProps = {
  data: TicketRangeDistributionPoint[]
}

function toPercentage(value: number) {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

export function TicketRangeParetoChart({ data }: TicketRangeParetoChartProps) {
  const chartData = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.revenue - a.revenue)
    let cumulative = 0
    return sorted.map((item) => {
      cumulative += item.revenue_percentage
      return {
        label: item.label,
        revenue_percentage: item.revenue_percentage,
        cumulative_percentage: Math.min(cumulative, 100),
      }
    })
  }, [data])

  if (!chartData.length) {
    return <p className="text-sm text-slate-500">Sem dados para o pareto por faixas de ticket.</p>
  }

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 8, right: 14, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="#cbd5e1" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 11 }} />
          <YAxis
            yAxisId="left"
            tick={{ fill: "#475569", fontSize: 12 }}
            tickFormatter={(value: number) => `${value.toFixed(0)}%`}
            domain={[0, 100]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: "#475569", fontSize: 12 }}
            tickFormatter={(value: number) => `${value.toFixed(0)}%`}
            domain={[0, 100]}
            width={42}
          />
          <Tooltip
            formatter={(value: number, name: string) => [toPercentage(value), name]}
            labelFormatter={(label) => `Faixa: ${label}`}
          />
          <Legend />
          <ReferenceLine yAxisId="right" y={80} stroke="#94a3b8" strokeDasharray="4 4" />
          <Bar
            yAxisId="left"
            dataKey="revenue_percentage"
            name="% da receita"
            fill="#1d4ed8"
            radius={[6, 6, 0, 0]}
          />
          <Line
            yAxisId="right"
            dataKey="cumulative_percentage"
            name="% acumulado"
            stroke="#0f172a"
            strokeWidth={2.4}
            dot={{ r: 3 }}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
