import { OrdersByStatusChart } from "@/components/charts/orders-by-status"
import { SalesCategoryChart } from "@/components/charts/sales-category-chart"
import { SalesMonthlyChart } from "@/components/charts/sales-monthly-chart"
import { SalesByStateMapDynamic } from "@/components/maps/sales-by-state-map-dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getOrdersByStatus, getOverviewMetrics, getSalesByCategory, getSalesByState, getSalesMonthly } from "@/services/api"

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function toPercentage(value: number) {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

export default async function StatisticsPage() {
  const [metrics, ordersByStatus, salesMonthly, salesByCategory, salesByState] = await Promise.all([
    getOverviewMetrics(),
    getOrdersByStatus(),
    getSalesMonthly(),
    getSalesByCategory(),
    getSalesByState(),
  ])

  const ordersChartData = ordersByStatus.map((item) => ({
    name: item.label,
    value: item.value,
  }))

  const topState = salesByState[0]

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto grid w-full max-w-[1560px] gap-8">
        <section>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Estatística e Probabilidade</h1>
          <p className="text-slate-600">
            Análise exploratória dos dados do e-commerce com KPIs, distribuição operacional e leitura regional
          </p>
        </section>

        <section className="grid gap-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Visão geral</h2>
            <p className="text-sm text-slate-600">Insights introdutórios sobre desempenho geral e operação</p>
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
                <CardDescription>Atraso (%)</CardDescription>
                <CardTitle>{toPercentage(metrics.late_delivery_percentage)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Nota média</CardDescription>
                <CardTitle>{metrics.average_review_score.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Distribuição de pedidos por status</CardTitle>
                <CardDescription>Composição do funil operacional</CardDescription>
              </CardHeader>
              <CardContent>
                <OrdersByStatusChart data={ordersChartData} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Composição operacional dos pedidos</CardTitle>
                <CardDescription>Distribuição de pedidos por status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {ordersByStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-sm text-slate-700">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-900">{item.value.toLocaleString("pt-BR")}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Receita por mês</CardTitle>
              <CardDescription>Evolução temporal do faturamento</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesMonthlyChart data={salesMonthly} />
            </CardContent>
          </Card>

          <div className="grid gap-6 2xl:grid-cols-5">
            <Card className="2xl:col-span-3">
              <CardHeader>
                <CardTitle>Top categorias por receita</CardTitle>
                <CardDescription>Ranking das categorias com maior participação</CardDescription>
              </CardHeader>
              <CardContent>
                <SalesCategoryChart data={salesByCategory} />
              </CardContent>
            </Card>

            <Card className="2xl:col-span-2">
              <CardHeader>
                <CardTitle>Top estado</CardTitle>
                <CardDescription>Estado com maior receita no período analisado</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700">
                  {topState
                    ? `${topState.customer_state}: ${toCurrency(topState.revenue)} (${topState.orders.toLocaleString("pt-BR")} pedidos)`
                    : "Sem dados"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Receita por estado</CardTitle>
              <CardDescription>Mapa coroplético e leitura regional</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesByStateMapDynamic data={salesByState} />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
