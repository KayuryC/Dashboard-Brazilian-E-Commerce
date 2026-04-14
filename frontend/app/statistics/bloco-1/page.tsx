import dynamic from "next/dynamic"
import { TicketRangeDistribution } from "@/components/charts/ticket-range-distribution"
import { StatisticsGlobalFilters } from "@/components/filters/statistics-global-filters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buildExecutiveContext } from "@/lib/statistics-comparisons"
import {
  buildActiveDashboardFilters,
  buildDateScopeFilters,
  clampStatisticsFiltersToDateBounds,
  parseStatisticsFilters,
  type StatisticsSearchParams,
} from "@/lib/statistics-filters"
import {
  getDatasetDateRange,
  getOrderValueDescriptiveStats,
  getSalesByCity,
  getSalesByState,
} from "@/services/api"

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function ChartSkeleton({ height = 320 }: { height?: number }) {
  return (
    <div
      className="w-full animate-pulse rounded-lg border border-slate-200 bg-slate-100"
      style={{ height }}
    />
  )
}

const OrderValueBoxplot = dynamic(
  () => import("@/components/charts/order-value-boxplot").then((mod) => mod.OrderValueBoxplot),
  { loading: () => <ChartSkeleton height={240} /> },
)

function toPercentage(value: number) {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

type StatisticsDescriptivePageProps = {
  searchParams?: StatisticsSearchParams | Promise<StatisticsSearchParams>
}

export default async function StatisticsDescriptivePage({
  searchParams,
}: StatisticsDescriptivePageProps) {
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
  const activeFilters = buildActiveDashboardFilters(selectedFilters)

  const [orderValueStats, salesByStateComparison, cityOptionsData] = await Promise.all([
    getOrderValueDescriptiveStats(activeFilters),
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

  const executiveContext = buildExecutiveContext(selectedFilters, salesByStateComparison)
  const selectedStateComparison = executiveContext.selectedStateData
  const selectedStateShare = executiveContext.participationPercentage ?? 0
  const selectedStateRank = executiveContext.rankingPosition ?? 0

  const ticketDistribution = orderValueStats.ticket_range_distribution
  const lowTicketShare = ticketDistribution
    .filter((item) => item.max_value !== null && item.max_value <= 300)
    .reduce((sum, item) => sum + item.orders_percentage, 0)
  const highTicketRevenueShare = ticketDistribution
    .filter((item) => item.min_value >= 1000)
    .reduce((sum, item) => sum + item.revenue_percentage, 0)
  const dominantOrdersBand = [...ticketDistribution].sort((a, b) => b.orders_percentage - a.orders_percentage)[0]
  const dominantRevenueBand = [...ticketDistribution].sort((a, b) => b.revenue_percentage - a.revenue_percentage)[0]

  const ticketMeanLiftPercentage = orderValueStats.median_value
    ? ((orderValueStats.mean_value - orderValueStats.median_value) / orderValueStats.median_value) * 100
    : 0

  const insightProfile =
    dominantOrdersBand
      ? `A maior massa de pedidos está na faixa ${dominantOrdersBand.label}, com ${toPercentage(dominantOrdersBand.orders_percentage)} do volume.`
      : "Não há dados suficientes para identificar a faixa dominante de pedidos."

  const insightMeanVsMedian =
    ticketMeanLiftPercentage >= 10
      ? `Poucos pedidos de alto valor elevam a média geral em ${toPercentage(ticketMeanLiftPercentage)} sobre a mediana.`
      : "Média e mediana estão próximas, sugerindo menor distorção por pedidos extremos no ticket."

  const insightConcentration =
    dominantRevenueBand
      ? `Na receita, a faixa ${dominantRevenueBand.label} concentra ${toPercentage(dominantRevenueBand.revenue_percentage)} do faturamento do recorte.`
      : "Não há dados suficientes para calcular a concentração de receita por faixa."

  const executiveInsight = [
    lowTicketShare >= 50
      ? `O negócio é sustentado por volume de baixo ticket (${toPercentage(lowTicketShare)} até R$ 300).`
      : "O volume de pedidos está mais distribuído entre faixas de ticket.",
    ticketMeanLiftPercentage >= 10
      ? "Poucos pedidos de alto valor puxam a média para cima."
      : "A média está próxima da mediana, com baixa distorção por extremos.",
    highTicketRevenueShare >= 10
      ? `Pedidos acima de R$ 1.000 representam ${toPercentage(highTicketRevenueShare)} da receita e merecem estratégia dedicada.`
      : "A receita está menos dependente de tickets muito altos.",
  ].join(" ")

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto grid w-full max-w-[1560px] gap-8">
        <section>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Estatística e Probabilidade</h1>
          <p className="text-slate-600">
            Bloco 1 — Estatística Descritiva: distribuição de valores de pedidos
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

        <section className="grid gap-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Distribuição de valores de pedidos</h2>
            <p className="text-sm text-slate-600">
              Medidas descritivas para leitura de concentração, dispersão e extremos
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-slate-700">
                <span className="font-semibold text-slate-900">Analisando:</span> {executiveContext.analysisLabel}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-slate-700">
                <span className="font-semibold text-slate-900">Periodo:</span> {executiveContext.periodLabel}
              </span>
              {selectedStateComparison ? (
                <>
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-slate-700">
                    <span className="font-semibold text-slate-900">Participacao:</span> {toPercentage(selectedStateShare)}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-slate-700">
                    <span className="font-semibold text-slate-900">Ranking:</span> {selectedStateRank}º de{" "}
                    {executiveContext.rankingTotal}
                  </span>
                </>
              ) : (
                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-slate-700">
                  <span className="font-semibold text-slate-900">Participacao:</span> 100,0%
                </span>
              )}
            </div>
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
                <CardDescription>Q1 (1º quartil)</CardDescription>
                <CardTitle>{toCurrency(orderValueStats.q1_value)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Q3 (3º quartil)</CardDescription>
                <CardTitle>{toCurrency(orderValueStats.q3_value)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>IQR (Q3 - Q1)</CardDescription>
                <CardTitle>{toCurrency(orderValueStats.iqr_value)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-10">
            <Card className="xl:col-span-7">
              <CardHeader>
                <CardTitle>Visual principal — Boxplot</CardTitle>
                <CardDescription>Leitura da dispersão entre mínimo, quartis, mediana e máximo</CardDescription>
              </CardHeader>
              <CardContent>
                <OrderValueBoxplot
                  minValue={orderValueStats.min_value}
                  q1Value={orderValueStats.q1_value}
                  medianValue={orderValueStats.median_value}
                  q3Value={orderValueStats.q3_value}
                  maxValue={orderValueStats.max_value}
                />
              </CardContent>
            </Card>

            <Card className="xl:col-span-3">
              <CardHeader>
                <CardTitle>Faixa típica</CardTitle>
                <CardDescription>Intervalo central de valor dos pedidos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">Intervalo Q1-Q3:</span>{" "}
                  {toCurrency(orderValueStats.q1_value)} a {toCurrency(orderValueStats.q3_value)}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Amplitude (IQR):</span>{" "}
                  {toCurrency(orderValueStats.iqr_value)}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Faixa dominante (pedidos):</span>{" "}
                  {dominantOrdersBand ? `${dominantOrdersBand.label} (${toPercentage(dominantOrdersBand.orders_percentage)})` : "N/A"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Leitura executiva:</span> a faixa típica mostra o
                  ticket mais recorrente e ajuda a calibrar metas comerciais sem depender de casos extremos.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição por faixa de ticket</CardTitle>
              <CardDescription>Comparativo de participação de pedidos e receita em cada faixa</CardDescription>
            </CardHeader>
            <CardContent>
              <TicketRangeDistribution data={ticketDistribution} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Insight executivo</CardTitle>
              <CardDescription>Síntese orientada ao impacto no negócio</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-slate-700">
              <p>{executiveInsight}</p>
              <p className="text-slate-600">{insightProfile}</p>
              <p className="text-slate-600">{insightMeanVsMedian}</p>
              <p className="text-slate-600">{insightConcentration}</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
