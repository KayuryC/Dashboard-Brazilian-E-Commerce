"use client"

import { RelationshipBoxplotGroup } from "@/lib/types"

type ReviewScoreBoxplotGroupsProps = {
  data: RelationshipBoxplotGroup[]
}

function clampPercentage(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

export function ReviewScoreBoxplotGroups({ data }: ReviewScoreBoxplotGroupsProps) {
  if (!data.length) {
    return <p className="text-sm text-slate-500">Sem dados de avaliacao para grupos de atraso no recorte atual.</p>
  }

  const safeMin = Math.min(...data.map((item) => item.min_value), 1)
  const safeMax = Math.max(...data.map((item) => item.max_value), 5)
  const range = Math.max(safeMax - safeMin, 1)

  const toPosition = (value: number) => clampPercentage(((value - safeMin) / range) * 100)

  return (
    <div className="space-y-5">
      {data.map((group) => {
        const minPos = toPosition(group.min_value)
        const q1Pos = toPosition(group.q1_value)
        const medianPos = toPosition(group.median_value)
        const q3Pos = toPosition(group.q3_value)
        const maxPos = toPosition(group.max_value)

        const boxLeft = Math.min(q1Pos, q3Pos)
        const boxWidth = Math.max(Math.abs(q3Pos - q1Pos), 1.2)

        return (
          <div key={group.group} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold text-slate-900">{group.group}</span>
              <span>{group.count.toLocaleString("pt-BR")} pedidos com avaliacao</span>
            </div>

            <div className="relative h-16">
              <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-slate-300" />

              <div
                className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-slate-700"
                style={{ left: `${minPos}%`, width: `${Math.max(maxPos - minPos, 1.2)}%` }}
              />
              <div className="absolute top-1/2 h-5 w-px -translate-y-1/2 bg-slate-700" style={{ left: `${minPos}%` }} />
              <div className="absolute top-1/2 h-5 w-px -translate-y-1/2 bg-slate-700" style={{ left: `${maxPos}%` }} />

              <div
                className="absolute top-1/2 h-10 -translate-y-1/2 rounded-md border border-blue-500/70 bg-blue-500/25"
                style={{ left: `${boxLeft}%`, width: `${boxWidth}%` }}
              />
              <div className="absolute top-1/2 h-10 w-1 -translate-y-1/2 bg-blue-800" style={{ left: `${medianPos}%` }} />
            </div>

            <div className="mb-3 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-700">
              <span className="font-semibold text-slate-900">Media do grupo:</span>{" "}
              {group.mean_value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
            </div>

            <div className="grid grid-cols-5 gap-2 text-center text-[11px] text-slate-600">
              <div>
                <p className="font-medium text-slate-800">Min</p>
                <p>{group.min_value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="font-medium text-slate-800">Q1</p>
                <p>{group.q1_value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="font-medium text-slate-800">Mediana</p>
                <p>{group.median_value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="font-medium text-slate-800">Q3</p>
                <p>{group.q3_value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="font-medium text-slate-800">Max</p>
                <p>{group.max_value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
