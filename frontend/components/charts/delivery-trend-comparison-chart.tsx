"use client"

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { DeliveryMonthlyTrendPoint } from "@/lib/types"

type DeliveryTrendComparisonChartProps = {
  data: DeliveryMonthlyTrendPoint[]
}

function toDays(value: number) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} dias`
}

function formatMonthLabel(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) return value
  const [year, month] = value.split("-")
  return `${month}/${year.slice(2)}`
}

export function DeliveryTrendComparisonChart({ data }: DeliveryTrendComparisonChartProps) {
  const series = data
    .filter((item) => /^\d{4}-\d{2}$/.test(item.purchase_year_month))
    .map((item) => ({
      ...item,
      month_label: formatMonthLabel(item.purchase_year_month),
    }))

  if (!series.length) {
    return <p className="text-sm text-slate-500">Sem dados suficientes para a série temporal de entrega.</p>
  }

  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="#cbd5e1" strokeDasharray="3 3" />
          <XAxis dataKey="month_label" tick={{ fill: "#475569", fontSize: 12 }} />
          <YAxis
            yAxisId="days"
            tick={{ fill: "#475569", fontSize: 12 }}
            tickFormatter={(value: number) => `${value.toFixed(0)}d`}
          />
          <YAxis
            yAxisId="percentage"
            orientation="right"
            tick={{ fill: "#475569", fontSize: 12 }}
            tickFormatter={(value: number) => `${value.toFixed(0)}%`}
            width={44}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "Atraso (%)") {
                return [`${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`, name]
              }
              return [toDays(value), name]
            }}
            labelFormatter={(label) => `Período: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="avg_delivery_days"
            name="Tempo real"
            stroke="#0f172a"
            strokeWidth={2.4}
            dot={false}
            activeDot={{ r: 4 }}
            yAxisId="days"
          />
          <Line
            type="monotone"
            dataKey="avg_estimated_days"
            name="Tempo estimado"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            yAxisId="days"
          />
          <Line
            type="monotone"
            dataKey="late_delivery_percentage"
            name="Atraso (%)"
            stroke="#ef4444"
            strokeWidth={1.6}
            strokeDasharray="4 4"
            dot={false}
            yAxisId="percentage"
            activeDot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
