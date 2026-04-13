"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type RankingHorizontalBarPoint = {
  label: string
  value: number
}

type RankingHorizontalBarProps = {
  data: RankingHorizontalBarPoint[]
  valueFormat?: "number" | "currency"
  barColor?: string
  height?: number
}

function formatValue(value: number, valueFormat: "number" | "currency") {
  if (valueFormat === "currency") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value)
  }

  return value.toLocaleString("pt-BR")
}

export function RankingHorizontalBar({
  data,
  valueFormat = "number",
  barColor = "#0f172a",
  height = 420,
}: RankingHorizontalBarProps) {
  const chartData = [...data].slice(0, 10).reverse()

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
          <XAxis
            type="number"
            tick={{ fill: "#475569", fontSize: 12 }}
            tickFormatter={(value) => {
              if (valueFormat === "currency") {
                return new Intl.NumberFormat("pt-BR", {
                  notation: "compact",
                  compactDisplay: "short",
                  style: "currency",
                  currency: "BRL",
                  maximumFractionDigits: 1,
                }).format(value)
              }

              return new Intl.NumberFormat("pt-BR", {
                notation: "compact",
                compactDisplay: "short",
              }).format(value)
            }}
          />
          <YAxis type="category" dataKey="label" tick={{ fill: "#334155", fontSize: 11 }} width={180} />
          <Tooltip formatter={(value: number) => formatValue(value, valueFormat)} />
          <Bar dataKey="value" fill={barColor} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
