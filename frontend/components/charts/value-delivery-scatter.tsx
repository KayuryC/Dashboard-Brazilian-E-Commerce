"use client"

import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts"

import { RelationshipScatterPoint } from "@/lib/types"

type ValueDeliveryScatterProps = {
  data: RelationshipScatterPoint[]
}

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value)
}

function compactValue(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value)
}

export function ValueDeliveryScatter({ data }: ValueDeliveryScatterProps) {
  if (!data.length) {
    return <p className="text-sm text-slate-500">Sem dados suficientes para o scatter no recorte atual.</p>
  }

  const points = data
    .filter(
      (point) =>
        Number.isFinite(point.order_value) &&
        Number.isFinite(point.delivery_time_days) &&
        point.order_value >= 0 &&
        point.delivery_time_days >= 0,
    )
    .slice(0, 2500)

  const sampleSize = points.length
  const sumX = points.reduce((sum, point) => sum + point.order_value, 0)
  const sumY = points.reduce((sum, point) => sum + point.delivery_time_days, 0)
  const sumXX = points.reduce((sum, point) => sum + point.order_value * point.order_value, 0)
  const sumXY = points.reduce((sum, point) => sum + point.order_value * point.delivery_time_days, 0)

  const denominator = sampleSize * sumXX - sumX * sumX
  const slope = denominator !== 0 ? (sampleSize * sumXY - sumX * sumY) / denominator : 0
  const intercept = sampleSize > 0 ? (sumY - slope * sumX) / sampleSize : 0

  const xMin = Math.min(...points.map((point) => point.order_value))
  const xMax = Math.max(...points.map((point) => point.order_value))
  const trendStart = { x: xMin, y: slope * xMin + intercept }
  const trendEnd = { x: xMax, y: slope * xMax + intercept }

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <span>
          Amostra plotada:{" "}
          <span className="font-semibold text-slate-900">{sampleSize.toLocaleString("pt-BR")} pedidos</span>
        </span>
        <span>
          Tendencia linear:{" "}
          <span className="font-semibold text-slate-900">
            {slope >= 0 ? "+" : ""}
            {slope.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}
          </span>
        </span>
      </div>

      <div className="h-[440px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 16, right: 12, bottom: 28, left: 8 }}>
          <CartesianGrid stroke="#cbd5e1" strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="order_value"
            tick={{ fill: "#475569", fontSize: 12 }}
            tickFormatter={(value: number) => compactValue(value)}
            name="Valor do pedido"
          />
          <YAxis
            type="number"
            dataKey="delivery_time_days"
            tick={{ fill: "#475569", fontSize: 12 }}
            tickFormatter={(value: number) => `${value.toFixed(0)}d`}
            name="Tempo de entrega"
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            formatter={(value: number, name: string) => {
              if (name === "order_value") return [toCurrency(value), "Valor do pedido"]
              return [`${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} dias`, "Tempo de entrega"]
            }}
          />
          <ReferenceLine
            segment={[trendStart, trendEnd]}
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="6 4"
            ifOverflow="extendDomain"
          />
          <Scatter data={points} fill="#0f172a" opacity={0.35} />
        </ScatterChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
