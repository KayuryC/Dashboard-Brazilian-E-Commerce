"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type SalesMonthlyChartProps = {
  data: Array<{
    purchase_year_month: string
    revenue: number
  }>
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value)
}

export function SalesMonthlyChart({ data }: SalesMonthlyChartProps) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
          <XAxis dataKey="purchase_year_month" tick={{ fill: "#475569", fontSize: 12 }} />
          <YAxis
            tick={{ fill: "#475569", fontSize: 12 }}
            tickFormatter={(value) =>
              new Intl.NumberFormat("pt-BR", { notation: "compact", compactDisplay: "short" }).format(value)
            }
          />
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Bar dataKey="revenue" fill="#0f172a" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
