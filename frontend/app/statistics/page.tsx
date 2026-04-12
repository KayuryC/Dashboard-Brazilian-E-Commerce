import { KpiSparkline } from "@/components/charts/kpi-sparkline"
import { OrdersByStatusChart } from "@/components/charts/orders-by-status"
import { ParetoCategoryChart } from "@/components/charts/pareto-category-chart"
import { RankingHorizontalBar } from "@/components/charts/ranking-horizontal-bar"
import { SalesMonthlyChart } from "@/components/charts/sales-monthly-chart"
import { SalesByStateMapDynamic } from "@/components/maps/sales-by-state-map-dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getOrdersByStatus,
  getOverviewMetrics,
  getSalesByCategory,
  getSalesByCity,
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

function toSignedPercentage(value: number) {
  const absoluteValue = Math.abs(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })

  if (value > 0) return `+${absoluteValue}%`
  if (value < 0) return `-${absoluteValue}%`
  return `${absoluteValue}%`
}

function toCompactNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value)
}

export default async function StatisticsPage() {
  const [metrics, ordersByStatus, salesMonthly, salesByCategory, salesByState, salesByCity] = await Promise.all([
    getOverviewMetrics(),
    getOrdersByStatus(),
    getSalesMonthly(),
    getSalesByCategory(),
    getSalesByState(),
    getSalesByCity(),
  ])

  const ordersChartData = ordersByStatus.map((item) => ({
    name: item.label,
    value: item.value,
  }))

  const validMonthlySeries = salesMonthly.filter((item) => /^\d{4}-\d{2}$/.test(item.purchase_year_month))
  const monthlyRevenueSeries = validMonthlySeries.map((item) => item.revenue)
  const monthlyOrderSeries = validMonthlySeries.map((item) => item.orders)
  const totalMonthlyRevenue = validMonthlySeries.reduce((sum, item) => sum + item.revenue, 0)
  const averageMonthlyRevenue = validMonthlySeries.length > 0 ? totalMonthlyRevenue / validMonthlySeries.length : 0
  const firstMonthRevenue = validMonthlySeries[0]?.revenue ?? 0
  const lastMonthRevenue = validMonthlySeries.at(-1)?.revenue ?? 0
  const revenueGrowthPercentage =
    firstMonthRevenue > 0 ? ((lastMonthRevenue - firstMonthRevenue) / firstMonthRevenue) * 100 : 0

  const totalOrdersByStatus = ordersByStatus.reduce((sum, item) => sum + item.value, 0)
  const dominantStatus = ordersByStatus[0]
  const dominantStatusShare =
    totalOrdersByStatus > 0 && dominantStatus ? (dominantStatus.value / totalOrdersByStatus) * 100 : 0
  const reviewSatisfactionLabel = metrics.average_review_score >= 4 ? "satisfação geral elevada" : "satisfação geral moderada"
  const growthHighlightClass =
    revenueGrowthPercentage >= 0 ? "text-emerald-700" : "text-rose-700"

  const topCityByRevenue = salesByCity[0]
  const topCityByOrders = [...salesByCity].sort((a, b) => b.orders - a.orders)[0]
  const topCategory = salesByCategory[0]
  const topState = salesByState[0]
  const topStates = salesByState.slice(0, 3)

  const categoryRankingData = salesByCategory.slice(0, 10).map((item) => ({
    label: item.product_category_name_english,
    value: item.revenue,
  }))

  const cityRankingData = salesByCity.slice(0, 10).map((item) => ({
    label: item.customer_city,
    value: item.revenue,
  }))

  const stateRankingData = salesByState.slice(0, 10).map((item) => ({
    label: item.customer_state,
    value: item.revenue,
  }))

  const categoriesForPareto = salesByCategory.filter((item) => item.revenue > 0)
  const paretoTotalRevenue = categoriesForPareto.reduce((sum, item) => sum + item.revenue, 0)
  let cumulativeRevenue = 0
  const paretoData = categoriesForPareto.map((item) => {
    cumulativeRevenue += item.revenue
    return {
      category: item.product_category_name_english,
      revenue: item.revenue,
      cumulative_share: paretoTotalRevenue > 0 ? (cumulativeRevenue / paretoTotalRevenue) * 100 : 0,
    }
  })
  const paretoTopCount = Math.max(1, Math.ceil(categoriesForPareto.length * 0.2))
  const paretoTopShare = paretoData[paretoTopCount - 1]?.cumulative_share ?? 0

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
            <h2 className="text-xl font-semibold text-slate-900">Resumo Executivo + Destaques</h2>
            <p className="text-sm text-slate-600">Quem lidera, onde está concentrado e o que domina a operação</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pedidos</CardDescription>
                <CardTitle>{metrics.total_orders.toLocaleString("pt-BR")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p className="text-sm text-slate-600">
                  Volume alto concentrado em <span className="font-medium text-slate-800">{dominantStatus?.label ?? "status líder"}</span> ({toPercentage(dominantStatusShare)}).
                </p>
                <KpiSparkline values={monthlyOrderSeries} color="#2563eb" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Receita</CardDescription>
                <CardTitle>{toCurrency(metrics.total_revenue)}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p className="text-sm text-slate-600">
                  Crescimento de <span className={`font-medium ${growthHighlightClass}`}>{toSignedPercentage(revenueGrowthPercentage)}</span> do início ao fim da série mensal.
                </p>
                <KpiSparkline values={monthlyRevenueSeries} color="#059669" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Ticket médio</CardDescription>
                <CardTitle>{toCurrency(metrics.average_ticket)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Indicador de estabilidade de monetização por pedido ao longo do período.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Atraso</CardDescription>
                <CardTitle>{toPercentage(metrics.late_delivery_percentage)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Impacto operacional direto na experiência logística e no nível de serviço.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Nota média</CardDescription>
                <CardTitle>{metrics.average_review_score.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Sinal consolidado de percepção do cliente, com {reviewSatisfactionLabel}.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>Receita total</CardDescription>
                <CardTitle>{toCurrency(metrics.total_revenue)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Receita média mensal</CardDescription>
                <CardTitle>{toCurrency(averageMonthlyRevenue)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Crescimento (%)</CardDescription>
                <CardTitle className={growthHighlightClass}>{toSignedPercentage(revenueGrowthPercentage)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Cidade líder</CardTitle>
                <CardDescription>KPI + contexto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-lg font-semibold text-slate-900">{topCityByRevenue?.customer_city ?? "Sem dados"}</p>
                <p className="text-sm text-slate-600">
                  {topCityByRevenue
                    ? `${toCurrency(topCityByRevenue.revenue)} • ${topCityByRevenue.orders.toLocaleString("pt-BR")} pedidos`
                    : "Sem dados de receita por cidade"}
                </p>
                <p className="text-sm text-slate-600">
                  Maior volume de pedidos:{" "}
                  <span className="font-medium text-slate-800">
                    {topCityByOrders
                      ? `${topCityByOrders.customer_city} (${toCompactNumber(topCityByOrders.orders)} pedidos)`
                      : "Sem dados"}
                  </span>
                </p>
                <p className="text-sm text-slate-600">
                  A maior concentração de pedidos está nas grandes capitais, com destaque para {topCityByRevenue?.customer_city ?? "a cidade líder"}.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Categoria líder</CardTitle>
                <CardDescription>Produto/categoria mais vendida</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-lg font-semibold text-slate-900">{topCategory?.product_category_name_english ?? "Sem dados"}</p>
                <p className="text-sm text-slate-600">
                  {topCategory
                    ? `${toCurrency(topCategory.revenue)} • ${topCategory.items.toLocaleString("pt-BR")} itens`
                    : "Sem dados de categoria"}
                </p>
                <p className="text-sm text-slate-600">
                  A categoria {topCategory?.product_category_name_english ?? "líder"} lidera o faturamento, indicando alta demanda nesse segmento.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status dominante</CardTitle>
                <CardDescription>Composição operacional</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-lg font-semibold text-slate-900">{dominantStatus?.label ?? "Sem dados"}</p>
                <p className="text-sm text-slate-600">
                  {dominantStatus
                    ? `${dominantStatus.value.toLocaleString("pt-BR")} pedidos • ${toPercentage(dominantStatusShare)}`
                    : "Sem dados de status"}
                </p>
                <p className="text-sm text-slate-600">
                  O funil operacional é dominado por {dominantStatus?.label?.toLowerCase() ?? "um status principal"}, sustentando previsibilidade do fluxo logístico.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 2xl:grid-cols-5">
            <Card className="2xl:col-span-3">
              <CardHeader>
                <CardTitle>Top 10 categorias por receita</CardTitle>
                <CardDescription>Ranking horizontal enterprise</CardDescription>
              </CardHeader>
              <CardContent>
                <RankingHorizontalBar
                  data={categoryRankingData}
                  valueFormatter={toCurrency}
                  barColor="#1d4ed8"
                  height={460}
                />
              </CardContent>
            </Card>

            <Card className="2xl:col-span-2">
              <CardHeader>
                <CardTitle>Top 10 cidades por receita</CardTitle>
                <CardDescription>Ranking visível de concentração regional</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  A maior concentração de pedidos está nas grandes capitais, com destaque para {topCityByRevenue?.customer_city ?? "a cidade líder"}.
                </p>
                <RankingHorizontalBar
                  data={cityRankingData}
                  valueFormatter={toCurrency}
                  barColor="#0f766e"
                  height={420}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Pareto de categorias</CardTitle>
                <CardDescription>
                  Top 20% das categorias concentram {toPercentage(paretoTopShare)} da receita acumulada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ParetoCategoryChart data={paretoData} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Estados líderes</CardTitle>
                <CardDescription>Top 10 horizontal + mini ranking Top 3</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RankingHorizontalBar
                  data={stateRankingData}
                  valueFormatter={toCurrency}
                  barColor="#0f172a"
                  height={320}
                />
                {topStates.map((state, index) => (
                  <div key={state.customer_state} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-sm font-medium text-slate-800">
                      {index + 1}. {state.customer_state}
                    </span>
                    <span className="text-sm text-slate-600">{toCurrency(state.revenue)}</span>
                  </div>
                ))}
                <p className="text-sm text-slate-600">
                  Estado líder:{" "}
                  <span className="font-medium text-slate-800">
                    {topState
                      ? `${topState.customer_state} (${toCompactNumber(topState.orders)} pedidos)`
                      : "Sem dados"}
                  </span>
                </p>
              </CardContent>
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
