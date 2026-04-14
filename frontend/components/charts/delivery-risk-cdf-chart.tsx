"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { DeliveryRiskCdfPoint } from "@/lib/types"

type DeliveryRiskCdfChartProps = {
  data: DeliveryRiskCdfPoint[]
}

export function DeliveryRiskCdfChart({ data }: DeliveryRiskCdfChartProps) {
  if (!data.length) {
    return <p className="text-sm text-slate-500">Sem dados de evolução acumulada para o recorte atual.</p>
  }

  const sortedData = [...data].sort((a, b) => a.days - b.days)

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sortedData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="#cbd5e1" strokeDasharray="3 3" />
          <XAxis
            dataKey="days"
            type="number"
            tick={{ fill: "#475569", fontSize: 12 }}
            tickFormatter={(value: number) => `${value.toFixed(0)}d`}
            domain={["dataMin", "dataMax"]}
          />
          <YAxis
            tick={{ fill: "#475569", fontSize: 12 }}
            domain={[0, 100]}
            tickFormatter={(value: number) => `${value.toFixed(0)}%`}
          />
          <Tooltip
            formatter={(value: number) => [
              `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`,
              "Probabilidade acumulada",
            ]}
            labelFormatter={(label) => `Até ${Number(label).toFixed(0)} dias`}
          />
          <ReferenceLine y={80} stroke="#94a3b8" strokeDasharray="4 4" />
          <ReferenceLine y={95} stroke="#cbd5e1" strokeDasharray="4 4" />
          <Line
            dataKey="cumulative_probability"
            name="CDF de entrega"
            type="monotone"
            stroke="#0f172a"
            strokeWidth={2.4}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
