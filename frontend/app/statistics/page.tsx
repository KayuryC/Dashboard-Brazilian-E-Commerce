import dynamic from "next/dynamic"
import { StatisticsGlobalFilters } from "@/components/filters/statistics-global-filters"
import { KpiSparkline } from "@/components/charts/kpi-sparkline"
import { SalesByStateMapDynamic } from "@/components/maps/sales-by-state-map-dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  buildExecutiveContext,
  calculateDeltaPercentage,
} from "@/lib/statistics-comparisons"
import {
  buildActiveDashboardFilters,
  buildDateScopeFilters,
  clampStatisticsFiltersToDateBounds,
  parseStatisticsFilters,
  type StatisticsSearchParams,
} from "@/lib/statistics-filters"
import {
  getDatasetDateRange,
  getSalesByCity,
  getSalesByState,
  getStatisticsSummary,
} from "@/services/api"

type StatisticsPageProps = {
  searchParams?: StatisticsSearchParams | Promise<StatisticsSearchParams>
}

function ChartSkeleton({ height = 320 }: { height?: number }) {
  return (
    <div
      className="w-full animate-pulse rounded-lg border border-slate-200 bg-slate-100"
      style={{ height }}
    />
  )
}

const OrdersByStatusChart = dynamic(
  () => import("@/components/charts/orders-by-status").then((mod) => mod.OrdersByStatusChart),
  { loading: () => <ChartSkeleton height={320} /> },
)

const ParetoCategoryChart = dynamic(
  () => import("@/components/charts/pareto-category-chart").then((mod) => mod.ParetoCategoryChart),
  { loading: () => <ChartSkeleton height={360} /> },
)

const RankingHorizontalBar = dynamic(
  () => import("@/components/charts/ranking-horizontal-bar").then((mod) => mod.RankingHorizontalBar),
  { loading: () => <ChartSkeleton height={360} /> },
)

const SalesMonthlyChart = dynamic(
  () => import("@/components/charts/sales-monthly-chart").then((mod) => mod.SalesMonthlyChart),
  { loading: () => <ChartSkeleton height={320} /> },
)

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

export default async function StatisticsPage({ searchParams }: StatisticsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const requestedFilters = parseStatisticsFilters(resolvedSearchParams)
  const datasetDateRange = await getDatasetDateRange()
  const selectedFilters =
    datasetDateRange.min_date && datasetDateRange.max_date
      ? clampStatisticsFiltersToDateBounds(requestedFilters, {
          minDate: datasetDateRange.min_date,
          maxDate: datasetDateRange.max_date,
        })
      : requestedFilters

  const dateScopeFilters = buildDateScopeFilters(selectedFilters)

  const [salesByStateComparison, cityOptionsData] = await Promise.all([
    getSalesByState(dateScopeFilters),
    selectedFilters.state
      ? getSalesByCity({
          ...dateScopeFilters,
          state: selectedFilters.state,
        })
      : Promise.resolve([]),
  ])

  const stateOptions = salesByStateComparison
    .map((item) => item.customer_state)
    .filter((value, index, array) => /^[A-Z]{2}$/.test(value) && array.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b, "pt-BR"))

  const cityOptions = cityOptionsData
    .map((item) => item.customer_city)
    .filter((value, index, array) => value && array.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b, "pt-BR"))

  const activeFilters = buildActiveDashboardFilters(selectedFilters)

  const [summary] = await Promise.all([
    getStatisticsSummary(activeFilters, 10),
  ])

  const metrics = summary.overview
  const ordersByStatus = summary.orders_by_status
  const salesMonthly = summary.sales_monthly
  const salesByCategory = summary.sales_by_category
  const salesByCityTop = summary.top_cities_by_revenue

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

  const topCityByRevenue = salesByCityTop[0]
  const topCityByOrders = summary.top_city_by_orders ?? salesByCityTop[0]
  const topCategory = salesByCategory[0]
  const topState = salesByStateComparison[0]
  const topStates = salesByStateComparison.slice(0, 3)

  const executiveContext = buildExecutiveContext(selectedFilters, salesByStateComparison)
  const selectedStateComparison = executiveContext.selectedStateData
  const selectedStateShare = executiveContext.participationPercentage ?? 0
  const selectedStateRank = executiveContext.rankingPosition ?? 0
  const averageStateRevenue =
    salesByStateComparison.length > 0
      ? salesByStateComparison.reduce((sum, item) => sum + item.revenue, 0) / salesByStateComparison.length
      : 0
  const selectedStateDeltaVsNationalAverage = selectedStateComparison
    ? calculateDeltaPercentage(selectedStateComparison.revenue, averageStateRevenue)
    : 0

  const categoryRankingData = salesByCategory.slice(0, 10).map((item) => ({
    label: item.product_category_name_english,
    value: item.revenue,
  }))

  const cityRankingData = salesByCityTop.slice(0, 10).map((item) => ({
    label: item.customer_city,
    value: item.revenue,
  }))

  const stateRankingData = salesByStateComparison.slice(0, 10).map((item) => ({
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
      <div className="stats-page-shell">
        <section className="stats-page-header">
          <h1 className="stats-page-title">Estatística e Probabilidade</h1>
          <p className="stats-page-subtitle">
            Análise exploratória dos dados do e-commerce com KPIs, distribuição operacional e leitura regional
          </p>
        </section>

        <StatisticsGlobalFilters
          currentFilters={{
            state: selectedFilters.state,
            city: selectedFilters.city,
            startDate: selectedFilters.startDate,
            endDate: selectedFilters.endDate,
          }}
          dateBounds={{
            minDate: datasetDateRange.min_date ?? undefined,
            maxDate: datasetDateRange.max_date ?? undefined,
          }}
          stateOptions={stateOptions}
          cityOptions={cityOptions}
        />

        <section className="stats-block-shell">
          <div className="stats-block-header">
            <h2 className="stats-block-title">Resumo Executivo + Destaques</h2>
            <p className="stats-block-subtitle">Quem lidera, onde está concentrado e o que domina a operação</p>
            <div className="stats-context-chip-row">
              <span className="stats-context-chip">
                <span className="stats-context-chip-label">Analisando:</span>{" "}
                {executiveContext.analysisLabel}
              </span>
              <span className="stats-context-chip">
                <span className="stats-context-chip-label">Período:</span>{" "}
                {executiveContext.periodLabel}
              </span>
              {selectedStateComparison ? (
                <>
                  <span className="stats-context-chip">
                    <span className="stats-context-chip-label">Participação:</span>{" "}
                    {toPercentage(selectedStateShare)}
                  </span>
                  <span className="stats-context-chip">
                    <span className="stats-context-chip-label">Ranking:</span>{" "}
                    {selectedStateRank}º de {executiveContext.rankingTotal}
                  </span>
                </>
              ) : (
                <span className="stats-context-chip">
                  <span className="stats-context-chip-label">Participação:</span> 100,0% (Brasil)
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Card className="stats-kpi-card">
              <CardHeader className="pb-2">
                <CardDescription className="stats-kpi-label">Pedidos</CardDescription>
                <CardTitle className="stats-kpi-value">{metrics.total_orders.toLocaleString("pt-BR")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p className="stats-kpi-helper">
                  Volume alto concentrado em{" "}
                  <span className="font-medium text-slate-800">{dominantStatus?.label ?? "status líder"}</span>{" "}
                  ({toPercentage(dominantStatusShare)}).
                </p>
                <KpiSparkline values={monthlyOrderSeries} color="#2563eb" />
              </CardContent>
            </Card>

            <Card className="stats-kpi-card">
              <CardHeader className="pb-2">
                <CardDescription className="stats-kpi-label">Receita</CardDescription>
                <CardTitle className="stats-kpi-value">{toCurrency(metrics.total_revenue)}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p className="stats-kpi-helper">
                  Crescimento de{" "}
                  <span className={`font-medium ${growthHighlightClass}`}>{toSignedPercentage(revenueGrowthPercentage)}</span>{" "}
                  do início ao fim da série mensal.
                </p>
                <KpiSparkline values={monthlyRevenueSeries} color="#059669" />
              </CardContent>
            </Card>

            <Card className="stats-kpi-card">
              <CardHeader className="pb-2">
                <CardDescription className="stats-kpi-label">Ticket médio</CardDescription>
                <CardTitle className="stats-kpi-value">{toCurrency(metrics.average_ticket)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="stats-kpi-helper">
                  Indicador de estabilidade de monetização por pedido ao longo do período.
                </p>
              </CardContent>
            </Card>

            <Card className="stats-kpi-card">
              <CardHeader className="pb-2">
                <CardDescription className="stats-kpi-label">Atraso</CardDescription>
                <CardTitle className="stats-kpi-value">{toPercentage(metrics.late_delivery_percentage)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="stats-kpi-helper">
                  Impacto operacional direto na experiência logística e no nível de serviço.
                </p>
              </CardContent>
            </Card>

            <Card className="stats-kpi-card">
              <CardHeader className="pb-2">
                <CardDescription className="stats-kpi-label">Nota média</CardDescription>
                <CardTitle className="stats-kpi-value">
                  {metrics.average_review_score.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="stats-kpi-helper">
                  Sinal consolidado de percepção do cliente, com {reviewSatisfactionLabel}.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">Receita total</CardDescription>
                <CardTitle className="stats-kpi-value">{toCurrency(metrics.total_revenue)}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">Receita média mensal</CardDescription>
                <CardTitle className="stats-kpi-value">{toCurrency(averageMonthlyRevenue)}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">Crescimento (%)</CardDescription>
                <CardTitle className={`stats-kpi-value ${growthHighlightClass}`}>
                  {toSignedPercentage(revenueGrowthPercentage)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="stats-panel-card">
              <CardHeader>
                <CardTitle className="stats-chart-title">Cidade líder</CardTitle>
                <CardDescription className="stats-chart-subtitle">KPI + contexto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-lg font-semibold text-slate-900">
                  {topCityByRevenue?.customer_city ?? "Sem dados"}
                </p>
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
              </CardContent>
            </Card>

            <Card className="stats-panel-card">
              <CardHeader>
                <CardTitle className="stats-chart-title">Categoria líder</CardTitle>
                <CardDescription className="stats-chart-subtitle">Produto/categoria mais vendida</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-lg font-semibold text-slate-900">
                  {topCategory?.product_category_name_english ?? "Sem dados"}
                </p>
                <p className="text-sm text-slate-600">
                  {topCategory
                    ? `${toCurrency(topCategory.revenue)} • ${topCategory.items.toLocaleString("pt-BR")} itens`
                    : "Sem dados de categoria"}
                </p>
              </CardContent>
            </Card>

            <Card className="stats-panel-card">
              <CardHeader>
                <CardTitle className="stats-chart-title">Status dominante</CardTitle>
                <CardDescription className="stats-chart-subtitle">Composição operacional</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-lg font-semibold text-slate-900">{dominantStatus?.label ?? "Sem dados"}</p>
                <p className="text-sm text-slate-600">
                  {dominantStatus
                    ? `${dominantStatus.value.toLocaleString("pt-BR")} pedidos • ${toPercentage(dominantStatusShare)}`
                    : "Sem dados de status"}
                </p>
              </CardContent>
            </Card>
          </div>

          {selectedFilters.state && selectedStateComparison ? (
            <Card className="stats-panel-card">
              <CardHeader>
                <CardTitle className="stats-chart-title">Comparativo de {selectedFilters.state}</CardTitle>
                <CardDescription className="stats-chart-subtitle">
                  Posicionamento do estado filtrado em relação ao Brasil e à média nacional
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 md:grid-cols-3">
                <p className="text-sm text-slate-700">
                  Participação na receita nacional:{" "}
                  <span className="font-semibold text-slate-900">{toPercentage(selectedStateShare)}</span>
                </p>
                <p className="text-sm text-slate-700">
                  Posição no ranking nacional:{" "}
                  <span className="font-semibold text-slate-900">
                    {selectedStateRank}º de {executiveContext.rankingTotal}
                  </span>
                </p>
                <p className="text-sm text-slate-700">
                  Receita vs media dos estados:{" "}
                  <span className="font-semibold text-slate-900">
                    {toSignedPercentage(selectedStateDeltaVsNationalAverage)}
                  </span>
                </p>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-6 2xl:grid-cols-5">
            <Card className="stats-panel-card 2xl:col-span-3">
              <CardHeader>
                <CardTitle className="stats-chart-title">Top 10 categorias por receita</CardTitle>
                <CardDescription className="stats-chart-subtitle">Ranking horizontal enterprise</CardDescription>
              </CardHeader>
              <CardContent>
                <RankingHorizontalBar
                  data={categoryRankingData}
                  valueFormat="currency"
                  barColor="#1d4ed8"
                  height={460}
                />
              </CardContent>
            </Card>

            <Card className="stats-panel-card 2xl:col-span-2">
              <CardHeader>
                <CardTitle className="stats-chart-title">Top 10 cidades por receita</CardTitle>
                <CardDescription className="stats-chart-subtitle">
                  Ranking visível de concentração regional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RankingHorizontalBar
                  data={cityRankingData}
                  valueFormat="currency"
                  barColor="#0f766e"
                  height={420}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="stats-panel-card lg:col-span-3">
              <CardHeader>
                <CardTitle className="stats-chart-title">Pareto de categorias</CardTitle>
                <CardDescription className="stats-chart-subtitle">
                  Top 20% das categorias concentram {toPercentage(paretoTopShare)} da receita acumulada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ParetoCategoryChart data={paretoData} />
              </CardContent>
            </Card>

            <Card className="stats-panel-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="stats-chart-title">Estados líderes</CardTitle>
                <CardDescription className="stats-chart-subtitle">
                  Top 10 horizontal + mini ranking Top 3
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RankingHorizontalBar
                  data={stateRankingData}
                  valueFormat="currency"
                  barColor="#0f172a"
                  height={320}
                />
                {topStates.map((state, index) => (
                  <div
                    key={state.customer_state}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                  >
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
            <Card className="stats-panel-card lg:col-span-3">
              <CardHeader>
                <CardTitle className="stats-chart-title">Distribuição de pedidos por status</CardTitle>
                <CardDescription className="stats-chart-subtitle">Composição do funil operacional</CardDescription>
              </CardHeader>
              <CardContent>
                <OrdersByStatusChart data={ordersChartData} />
              </CardContent>
            </Card>

            <Card className="stats-panel-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="stats-chart-title">Composição operacional dos pedidos</CardTitle>
                <CardDescription className="stats-chart-subtitle">Distribuição de pedidos por status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {ordersByStatus.map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <span className="text-sm text-slate-700">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {item.value.toLocaleString("pt-BR")}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="stats-panel-card">
            <CardHeader>
              <CardTitle className="stats-chart-title">Receita por mês</CardTitle>
              <CardDescription className="stats-chart-subtitle">Evolução temporal do faturamento</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesMonthlyChart data={salesMonthly} />
            </CardContent>
          </Card>

          <Card className="stats-panel-card">
            <CardHeader>
              <CardTitle className="stats-chart-title">Receita por estado</CardTitle>
              <CardDescription className="stats-chart-subtitle">
                Mapa coroplético e leitura regional comparativa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SalesByStateMapDynamic
                data={salesByStateComparison}
                highlightState={selectedFilters.state || undefined}
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
