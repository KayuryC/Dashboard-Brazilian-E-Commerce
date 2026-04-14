"use client"

import { RelationshipCorrelationHeatmapCell } from "@/lib/types"

type CorrelationHeatmapProps = {
  data: RelationshipCorrelationHeatmapCell[]
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getCellColor(correlation: number) {
  const value = clamp(correlation, -1, 1)
  if (Math.abs(value) < 0.05) return "rgb(248 250 252)"

  if (value > 0) {
    const alpha = 0.15 + Math.abs(value) * 0.65
    return `rgba(37, 99, 235, ${alpha.toFixed(3)})`
  }

  const alpha = 0.15 + Math.abs(value) * 0.65
  return `rgba(220, 38, 38, ${alpha.toFixed(3)})`
}

function getTextColor(correlation: number) {
  return Math.abs(correlation) >= 0.5 ? "text-white" : "text-slate-800"
}

export function CorrelationHeatmap({ data }: CorrelationHeatmapProps) {
  if (!data.length) {
    return <p className="text-sm text-slate-500">Sem dados para a matriz de correlação no recorte atual.</p>
  }

  const xLabels = Array.from(new Set(data.map((cell) => cell.x_label)))
  const yLabels = Array.from(new Set(data.map((cell) => cell.y_label)))
  const matrix = new Map(data.map((cell) => [`${cell.x_key}|${cell.y_key}`, cell]))

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[540px] gap-2"
        style={{ gridTemplateColumns: `180px repeat(${xLabels.length}, minmax(88px, 1fr))` }}
      >
        <div />
        {xLabels.map((label) => (
          <div key={`head-${label}`} className="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </div>
        ))}

        {yLabels.map((rowLabel, rowIndex) => {
          const rowKey = data.find((item) => item.y_label === rowLabel)?.y_key ?? `row-${rowIndex}`
          return (
            <div
              key={`row-wrap-${rowKey}`}
              className="contents"
            >
              <div
                className="flex items-center text-xs font-semibold text-slate-600"
              >
                {rowLabel}
              </div>

              {xLabels.map((columnLabel, colIndex) => {
                const columnKey =
                  data.find((item) => item.x_label === columnLabel)?.x_key ?? `col-${colIndex}`
                const cell = matrix.get(`${columnKey}|${rowKey}`)
                const correlation = cell?.correlation ?? 0
                return (
                  <div
                    key={`${rowKey}-${columnKey}`}
                    className={`flex h-14 items-center justify-center rounded-md border border-slate-200 text-xs font-semibold ${getTextColor(correlation)}`}
                    style={{ backgroundColor: getCellColor(correlation) }}
                    title={`${rowLabel} x ${columnLabel}: ${correlation.toLocaleString("pt-BR", { maximumFractionDigits: 3 })}`}
                  >
                    {correlation.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
