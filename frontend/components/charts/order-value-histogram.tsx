"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { DescriptiveHistogramBin } from "@/lib/types"

type OrderValueHistogramProps = {
  data: DescriptiveHistogramBin[]
  height?: number
}

export function OrderValueHistogram({ data, height = 320 }: OrderValueHistogramProps) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
          <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 12 }} interval="preserveStartEnd" minTickGap={18} />
          <YAxis tick={{ fill: "#475569", fontSize: 12 }} />
          <Tooltip
            formatter={(value: number) => [value.toLocaleString("pt-BR"), "Pedidos"]}
            labelFormatter={(_, payload) => {
              const item = payload?.[0]?.payload as DescriptiveHistogramBin | undefined
              if (!item) return ""
              return `Faixa: R$ ${item.min_value.toLocaleString("pt-BR")} - R$ ${item.max_value.toLocaleString("pt-BR")}`
            }}
          />
          <Bar dataKey="count" fill="#0f172a" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
