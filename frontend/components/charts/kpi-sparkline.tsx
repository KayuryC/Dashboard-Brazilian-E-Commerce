"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts"

type KpiSparklineProps = {
  values: number[]
  color?: string
}

export function KpiSparkline({ values, color = "#0f172a" }: KpiSparklineProps) {
  const data = values.map((value, index) => ({
    idx: index,
    value,
  }))

  if (data.length === 0) {
    return <div className="h-12 w-full rounded-md bg-slate-100" />
  }

  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Tooltip
            formatter={(value: number) =>
              value.toLocaleString("pt-BR", {
                maximumFractionDigits: 0,
              })
            }
            labelFormatter={() => ""}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
