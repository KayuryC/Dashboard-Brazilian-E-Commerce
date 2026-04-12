import { OrdersByStatusChart } from "@/components/charts/orders-by-status"
import { SalesByStateMapDynamic } from "@/components/maps/sales-by-state-map-dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getOverviewMetrics, getSalesByState } from "@/services/api"

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function toPercentage(value: number) {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
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

        <section className="grid gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Visão Executiva</h2>
            <p className="text-sm text-slate-600">
              Como está o e-commerce no geral? Leitura rápida dos principais indicadores.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Card>
              <CardHeader>
                <CardDescription>Total de pedidos</CardDescription>
                <CardTitle>{metrics.total_orders.toLocaleString("pt-BR")}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Receita total</CardDescription>
                <CardTitle>{toCurrency(metrics.total_revenue)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Ticket médio</CardDescription>
                <CardTitle>{toCurrency(metrics.average_ticket)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Percentual de atraso</CardDescription>
                <CardTitle>{toPercentage(metrics.late_delivery_percentage)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Nota média de avaliação</CardDescription>
                <CardTitle>{metrics.average_review_score.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Pedidos entregues</CardDescription>
              <CardTitle>{metrics.delivered_orders.toLocaleString("pt-BR")}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Pedidos cancelados</CardDescription>
              <CardTitle>{metrics.canceled_orders.toLocaleString("pt-BR")}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Total de clientes</CardDescription>
              <CardTitle>{metrics.total_customers.toLocaleString("pt-BR")}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Status distintos</CardDescription>
              <CardTitle>{Object.keys(metrics.status_breakdown).length}</CardTitle>
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
              <SalesByStateMapDynamic data={salesByStateData} />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
