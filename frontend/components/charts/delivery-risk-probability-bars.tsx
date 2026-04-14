"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { DeliveryRiskEventProbability } from "@/lib/types"

type DeliveryRiskProbabilityBarsProps = {
  data: DeliveryRiskEventProbability[]
}

function toPercentage(value: number) {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

export function DeliveryRiskProbabilityBars({ data }: DeliveryRiskProbabilityBarsProps) {
  if (!data.length) {
    return <p className="text-sm text-slate-500">Sem dados de probabilidade para o recorte atual.</p>
  }

  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid stroke="#cbd5e1" strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: "#475569", fontSize: 12 }}
            tickFormatter={(value: number) => `${value}%`}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={170}
            tick={{ fill: "#334155", fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number, name, payload) => {
              const count = payload?.payload?.count ?? 0
              return [toPercentage(value), `${name} (${count.toLocaleString("pt-BR")} pedidos)`]
            }}
          />
          <Bar dataKey="probability" name="Probabilidade" fill="#0f172a" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
