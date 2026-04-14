import { TicketRangeDistributionPoint } from "@/lib/types"

type TicketRangeDistributionProps = {
  data: TicketRangeDistributionPoint[]
}

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function toPercentage(value: number) {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

function WidthBar({ value }: { value: number }) {
  const normalized = Math.min(Math.max(value, 0), 100)

  return (
    <div className="h-2.5 w-full rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-slate-800 transition-all" style={{ width: `${normalized}%` }} />
    </div>
  )
}

export function TicketRangeDistribution({ data }: TicketRangeDistributionProps) {
  if (!data.length) {
    return <p className="text-sm text-slate-500">Sem dados para a distribuição por faixa de ticket no recorte atual.</p>
  }

  return (
    <div className="space-y-4">
      <div className="hidden grid-cols-[1.2fr_0.8fr_0.8fr_1fr_1fr] gap-4 border-b border-slate-200 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
        <span>Faixa</span>
        <span>Pedidos</span>
        <span>Receita</span>
        <span>% pedidos</span>
        <span>% receita</span>
      </div>

      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.label} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr_1fr] md:items-center md:gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.label}</p>
            </div>
            <div className="text-sm text-slate-700">{item.orders_count.toLocaleString("pt-BR")}</div>
            <div className="text-sm text-slate-700">{toCurrency(item.revenue)}</div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-800">{toPercentage(item.orders_percentage)}</p>
              <WidthBar value={item.orders_percentage} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-800">{toPercentage(item.revenue_percentage)}</p>
              <WidthBar value={item.revenue_percentage} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
