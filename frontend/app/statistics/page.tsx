import { OrderValueHistogram } from "@/components/charts/order-value-histogram"
import { OrdersByStatusChart } from "@/components/charts/orders-by-status"
import { SalesCategoryChart } from "@/components/charts/sales-category-chart"
import { SalesMonthlyChart } from "@/components/charts/sales-monthly-chart"
import { SalesByStateMapDynamic } from "@/components/maps/sales-by-state-map-dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getOrderValueDescriptiveStats,
  getOrdersByStatus,
  getOverviewMetrics,
  getSalesByCategory,
  getSalesByState,
  getSalesMonthly,
} from "@/services/api"

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
  const [metrics, ordersByStatus, salesMonthly, salesByCategory, salesByState, orderValueStats] = await Promise.all([
    getOverviewMetrics(),
    getOrdersByStatus(),
    getSalesMonthly(),
    getSalesByCategory(),
    getSalesByState(),
    getOrderValueDescriptiveStats(),
  ])

  const ordersChartData = ordersByStatus.map((item) => ({
    name: item.label,
    value: item.value,
  }))

  const topState = salesByState[0]

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto grid w-full max-w-[1420px] gap-6">
        <section>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Estatística e Probabilidade</h1>
          <p className="text-slate-600">Análise exploratória dos dados do e-commerce com KPIs e distribuição operacional</p>
        </section>

        <section className="grid gap-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Visão geral e insights introdutórios</h2>
            <p className="text-sm text-slate-600">Bloco 1 — Estatística Descritiva: distribuição de valores de pedidos</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Card>
              <CardHeader>
                <CardDescription>Média</CardDescription>
                <CardTitle>{toCurrency(orderValueStats.mean_value)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Mediana</CardDescription>
                <CardTitle>{toCurrency(orderValueStats.median_value)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Desvio padrão</CardDescription>
                <CardTitle>{toCurrency(orderValueStats.std_dev_value)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Valor mínimo</CardDescription>
                <CardTitle>{toCurrency(orderValueStats.min_value)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Valor máximo</CardDescription>
                <CardTitle>{toCurrency(orderValueStats.max_value)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição de valores de pedidos</CardTitle>
              <CardDescription>Histograma da concentração de pedidos por faixa de valor</CardDescription>
            </CardHeader>
            <CardContent>
              <OrderValueHistogram data={orderValueStats.histogram} />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
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
              <CardTitle>Composicao operacional dos pedidos</CardTitle>
              <CardDescription>Distribuicao de pedidos por status</CardDescription>
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
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Receita por mês</CardTitle>
              <CardDescription>Evolução temporal do faturamento</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesMonthlyChart data={salesMonthly} />
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Top categorias por receita</CardTitle>
              <CardDescription>Ranking das categorias com maior participação</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesCategoryChart data={salesByCategory} />
            </CardContent>
          </Card>
        </section>

        <section>
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

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Top estado</CardTitle>
              <CardDescription>Estado com maior receita no período analisado</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">
                {topState ? `${topState.customer_state}: ${toCurrency(topState.revenue)} (${topState.orders.toLocaleString("pt-BR")} pedidos)` : "Sem dados"}
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
