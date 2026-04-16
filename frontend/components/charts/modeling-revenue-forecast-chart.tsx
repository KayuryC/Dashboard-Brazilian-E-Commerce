"use client"

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type ForecastPoint = {
  period: string
  actual_value: number | null
  predicted_value: number
  is_future: boolean
}

type ModelingRevenueForecastChartProps = {
  data: ForecastPoint[]
}

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value)
}

export function ModelingRevenueForecastChart({ data }: ModelingRevenueForecastChartProps) {
  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
          <XAxis
            dataKey="period"
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={{ stroke: "#cbd5e1" }}
            tickLine={{ stroke: "#cbd5e1" }}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={{ stroke: "#cbd5e1" }}
            tickLine={{ stroke: "#cbd5e1" }}
            tickFormatter={(value) => toCurrency(Number(value))}
          />
          <Tooltip
            formatter={(value: number) => toCurrency(value)}
            contentStyle={{
              borderRadius: "0.75rem",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
            }}
          />
          <Line
            type="monotone"
            dataKey="actual_value"
            name="Receita real"
            stroke="#0f172a"
            strokeWidth={2}
            dot={{ r: 2 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="predicted_value"
            name="Receita prevista"
            stroke="#2563eb"
            strokeDasharray="6 4"
            strokeWidth={2}
            dot={{ r: 1 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
