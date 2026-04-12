"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type SalesCategoryChartProps = {
  data: Array<{
    product_category_name_english: string
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

export function SalesCategoryChart({ data }: SalesCategoryChartProps) {
  const topCategories = [...data].slice(0, 10).reverse()

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={topCategories} layout="vertical" margin={{ left: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
          <XAxis
            type="number"
            tick={{ fill: "#475569", fontSize: 12 }}
            tickFormatter={(value) =>
              new Intl.NumberFormat("pt-BR", { notation: "compact", compactDisplay: "short" }).format(value)
            }
          />
          <YAxis
            type="category"
            dataKey="product_category_name_english"
            tick={{ fill: "#334155", fontSize: 11 }}
            width={160}
          />
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Bar dataKey="revenue" fill="#2563eb" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
