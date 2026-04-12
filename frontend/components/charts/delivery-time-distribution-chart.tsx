"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { DeliveryHistogramBin } from "@/lib/types"

type DeliveryTimeDistributionChartProps = {
  data: DeliveryHistogramBin[]
}

export function DeliveryTimeDistributionChart({ data }: DeliveryTimeDistributionChartProps) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
          <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 12 }} interval="preserveStartEnd" minTickGap={18} />
          <YAxis tick={{ fill: "#475569", fontSize: 12 }} />
          <Tooltip
            formatter={(value: number) => [value.toLocaleString("pt-BR"), "Pedidos entregues"]}
            labelFormatter={(_, payload) => {
              const item = payload?.[0]?.payload as DeliveryHistogramBin | undefined
              if (!item) return ""
              return `Faixa: ${item.min_days.toLocaleString("pt-BR")} - ${item.max_days.toLocaleString("pt-BR")} dias`
            }}
          />
          <Bar dataKey="count" fill="#0f172a" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
