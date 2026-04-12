import dynamic from "next/dynamic"

import { OrdersByStatusChart } from "@/components/charts/orders-by-status"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getOverviewMetrics, getSalesByState } from "@/services/api"

const SalesByStateMap = dynamic(
  () => import("@/components/maps/sales-by-state-map").then((mod) => mod.SalesByStateMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[460px] items-center justify-center rounded-lg border bg-slate-100 text-sm text-slate-600">
        Carregando mapa...
      </div>
    ),
  }
)

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export default async function HomePage() {
  const [metrics, salesByStateData] = await Promise.all([getOverviewMetrics(), getSalesByState()])
  const statusData = Object.entries(metrics.status_breakdown).map(([name, value]) => ({
    name,
    value,
  }))

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto grid max-w-6xl gap-6">
        <section>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Giras</h1>
          <p className="text-slate-600">Visão geral operacional baseada nos dados Olist</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Pedidos</CardDescription>
              <CardTitle>{metrics.total_orders.toLocaleString("pt-BR")}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Entregues</CardDescription>
              <CardTitle>{metrics.delivered_orders.toLocaleString("pt-BR")}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Cancelados</CardDescription>
              <CardTitle>{metrics.canceled_orders.toLocaleString("pt-BR")}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Ticket médio</CardDescription>
              <CardTitle>{toCurrency(metrics.average_ticket)}</CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Pedidos por status</CardTitle>
              <CardDescription>Distribuição geral do funil de pedidos</CardDescription>
            </CardHeader>
            <CardContent>
              <OrdersByStatusChart data={statusData} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Receita total</CardTitle>
              <CardDescription>Somatório de pagamentos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">{toCurrency(metrics.total_revenue)}</p>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Receita por estado</CardTitle>
              <CardDescription>Mapa coroplético com intensidade por receita</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesByStateMap data={salesByStateData} />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
