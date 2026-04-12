"use client"

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts"

type OrdersByStatusChartProps = {
  data: Array<{ name: string; value: number }>
}

const COLORS = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1", "#ef4444"]

export function OrdersByStatusChart({ data }: OrdersByStatusChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
