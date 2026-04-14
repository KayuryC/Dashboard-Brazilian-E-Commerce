"use client"

type OrderValueBoxplotProps = {
  minValue: number
  q1Value: number
  medianValue: number
  q3Value: number
  maxValue: number
}

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value)
}

function clampPercentage(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

export function OrderValueBoxplot({
  minValue,
  q1Value,
  medianValue,
  q3Value,
  maxValue,
}: OrderValueBoxplotProps) {
  const safeMin = Math.min(minValue, q1Value, medianValue, q3Value, maxValue)
  const safeMax = Math.max(minValue, q1Value, medianValue, q3Value, maxValue)
  const range = Math.max(safeMax - safeMin, 1)

  const toPosition = (value: number) =>
    clampPercentage(((value - safeMin) / range) * 100)

  const minPos = toPosition(minValue)
  const q1Pos = toPosition(q1Value)
  const medianPos = toPosition(medianValue)
  const q3Pos = toPosition(q3Value)
  const maxPos = toPosition(maxValue)

  const boxLeft = Math.min(q1Pos, q3Pos)
  const boxWidth = Math.max(Math.abs(q3Pos - q1Pos), 0.8)

  return (
    <div className="w-full rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 md:p-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Boxplot de valores por pedido</p>
        <p className="text-xs text-slate-500">Min · Q1 · Mediana · Q3 · Max</p>
      </div>

      <div className="relative h-28">
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-slate-300" />

        <div
          className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-slate-700"
          style={{ left: `${minPos}%`, width: `${Math.max(maxPos - minPos, 0.8)}%` }}
        />

        <div
          className="absolute top-1/2 h-6 w-px -translate-y-1/2 bg-slate-700"
          style={{ left: `${minPos}%` }}
        />
        <div
          className="absolute top-1/2 h-6 w-px -translate-y-1/2 bg-slate-700"
          style={{ left: `${maxPos}%` }}
        />

        <div
          className="absolute top-1/2 h-14 -translate-y-1/2 rounded-md border border-blue-500/70 bg-blue-500/25 shadow-sm"
          style={{ left: `${boxLeft}%`, width: `${boxWidth}%` }}
        />

        <div
          className="absolute top-1/2 h-14 w-1 -translate-y-1/2 bg-blue-800"
          style={{ left: `${medianPos}%` }}
        />
      </div>

      <div className="mt-1 grid grid-cols-5 gap-2 text-center text-[11px] text-slate-600">
        <div>
          <p className="font-medium text-slate-800">Min</p>
          <p>{toCurrency(minValue)}</p>
        </div>
        <div>
          <p className="font-medium text-slate-800">Q1</p>
          <p>{toCurrency(q1Value)}</p>
        </div>
        <div>
          <p className="font-medium text-slate-800">Mediana</p>
          <p>{toCurrency(medianValue)}</p>
        </div>
        <div>
          <p className="font-medium text-slate-800">Q3</p>
          <p>{toCurrency(q3Value)}</p>
        </div>
        <div>
          <p className="font-medium text-slate-800">Max</p>
          <p>{toCurrency(maxValue)}</p>
        </div>
      </div>
    </div>
  )
}
