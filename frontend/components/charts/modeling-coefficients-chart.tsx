"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type CoefficientPoint = {
  feature_label: string
  coefficient: number
}

type ModelingCoefficientsChartProps = {
  data: CoefficientPoint[]
}

function toSigned(value: number) {
  const absolute = Math.abs(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })
  if (value > 0) return `+${absolute}`
  if (value < 0) return `-${absolute}`
  return absolute
}

export function ModelingCoefficientsChart({ data }: ModelingCoefficientsChartProps) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
          <XAxis
            type="number"
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={{ stroke: "#cbd5e1" }}
            tickLine={{ stroke: "#cbd5e1" }}
          />
          <YAxis
            type="category"
            dataKey="feature_label"
            width={170}
            tick={{ fill: "#334155", fontSize: 12 }}
            axisLine={{ stroke: "#cbd5e1" }}
            tickLine={{ stroke: "#cbd5e1" }}
          />
          <Tooltip
            formatter={(value: number) => [toSigned(value), "Coeficiente"]}
            contentStyle={{
              borderRadius: "0.75rem",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
            }}
          />
          <Bar dataKey="coefficient" fill="#0f172a" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
