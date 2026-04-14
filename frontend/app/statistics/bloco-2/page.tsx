import dynamic from "next/dynamic"
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
  getDeliveryTimeAnalysis,
  getSalesByCity,
  getSalesByState,
} from "@/services/api"

function toDays(value: number) {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} dias`
}

function toPercentage(value: number) {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

function ChartSkeleton({ height = 320 }: { height?: number }) {
  return (
    <div
      className="w-full animate-pulse rounded-lg border border-slate-200 bg-slate-100"
      style={{ height }}
    />
  )
}

const DeliveryTimeDistributionChart = dynamic(
  () =>
    import("@/components/charts/delivery-time-distribution-chart").then(
      (mod) => mod.DeliveryTimeDistributionChart,
    ),
  { loading: () => <ChartSkeleton height={340} /> },
)

function toSignedDays(value: number) {
  const absoluteValue = Math.abs(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  if (value > 0) return `+${absoluteValue} dias`
  if (value < 0) return `-${absoluteValue} dias`
  return `${absoluteValue} dias`
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

type StatisticsDeliveryPageProps = {
  searchParams?: StatisticsSearchParams | Promise<StatisticsSearchParams>
}

export default async function StatisticsDeliveryPage({
  searchParams,
}: StatisticsDeliveryPageProps) {
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

  const [deliveryStats, deliveryStatsBrazilPeriod, salesByStateComparison, cityOptionsData] = await Promise.all([
    getDeliveryTimeAnalysis(activeFilters),
    getDeliveryTimeAnalysis(dateScopeFilters),
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
  const deliveryDeltaDays = deliveryStats.avg_delivery_days - deliveryStatsBrazilPeriod.avg_delivery_days
  const delayDeltaPercentage =
    deliveryStats.late_delivery_percentage - deliveryStatsBrazilPeriod.late_delivery_percentage

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto grid w-full max-w-[1560px] gap-8">
        <section>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Estatística e Probabilidade</h1>
          <p className="text-slate-600">Bloco 2 — Tempo de Entrega: análise de entrega</p>
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
            <h2 className="text-xl font-semibold text-slate-900">Análise de entrega</h2>
            <p className="text-sm text-slate-600">Tempo médio real, estimado, variação e percentual de atraso</p>
            <div className="mt-3 grid gap-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p>
                <span className="font-semibold text-slate-900">Analisando:</span>{" "}
                {executiveContext.analysisLabel}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Periodo:</span>{" "}
                {executiveContext.periodLabel}
              </p>
              {selectedStateComparison ? (
                <>
                  <p>
                    <span className="font-semibold text-slate-900">Participacao no total:</span>{" "}
                    {toPercentage(selectedStateShare)} da receita nacional
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Posicao no ranking nacional:</span>{" "}
                    {selectedStateRank}º de {executiveContext.rankingTotal}
                  </p>
                </>
              ) : (
                <p>
                  <span className="font-semibold text-slate-900">Participacao no total:</span> 100,0% da receita
                  (visao Brasil)
                </p>
              )}
            </div>
          </div>

          {selectedFilters.state ? (
            <Card>
              <CardHeader>
                <CardTitle>Contexto comparativo do recorte</CardTitle>
                <CardDescription>Entrega no recorte atual versus baseline Brasil (mesmo período)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                <p>
                  Tempo médio de entrega no recorte:{" "}
                  <span className="font-semibold text-slate-900">{toDays(deliveryStats.avg_delivery_days)}</span>{" "}
                  ({toSignedDays(deliveryDeltaDays)} vs Brasil).
                </p>
                <p>
                  Taxa de atraso no recorte:{" "}
                  <span className="font-semibold text-slate-900">
                    {toPercentage(deliveryStats.late_delivery_percentage)}
                  </span>{" "}
                  ({toSignedPercentage(delayDeltaPercentage)} vs Brasil).
                </p>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader>
                <CardDescription>Tempo médio de entrega</CardDescription>
                <CardTitle>{toDays(deliveryStats.avg_delivery_days)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Tempo estimado médio</CardDescription>
                <CardTitle>{toDays(deliveryStats.avg_estimated_days)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Desvio padrão</CardDescription>
                <CardTitle>{toDays(deliveryStats.std_delivery_days)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Atraso (%)</CardDescription>
                <CardTitle>{toPercentage(deliveryStats.late_delivery_percentage)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição de dias de entrega</CardTitle>
              <CardDescription>Concentração de pedidos entregues por faixa de dias</CardDescription>
            </CardHeader>
            <CardContent>
              <DeliveryTimeDistributionChart data={deliveryStats.histogram} />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
