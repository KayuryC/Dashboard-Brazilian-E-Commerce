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
  const onTimePercentage = Math.max(0, 100 - deliveryStats.late_delivery_percentage)
  const scheduleGapDays = deliveryStats.avg_estimated_days - deliveryStats.avg_delivery_days
  const deliveryEfficiencyPercentage = deliveryStats.avg_estimated_days
    ? ((deliveryStats.avg_estimated_days - deliveryStats.avg_delivery_days) / deliveryStats.avg_estimated_days) * 100
    : 0
  const variationCoefficient = deliveryStats.avg_delivery_days
    ? (deliveryStats.std_delivery_days / deliveryStats.avg_delivery_days) * 100
    : 0

  const totalDeliveredOrders = deliveryStats.histogram.reduce((sum, item) => sum + item.count, 0)
  const histogramWithCenter = deliveryStats.histogram.map((item) => ({
    ...item,
    center: (item.min_days + item.max_days) / 2,
  }))
  const upTo14DaysShare = totalDeliveredOrders
    ? (histogramWithCenter
        .filter((item) => item.center <= 14)
        .reduce((sum, item) => sum + item.count, 0) /
        totalDeliveredOrders) *
      100
    : 0
  const over30DaysShare = totalDeliveredOrders
    ? (histogramWithCenter
        .filter((item) => item.center > 30)
        .reduce((sum, item) => sum + item.count, 0) /
        totalDeliveredOrders) *
      100
    : 0
  const upTo7DaysShare = totalDeliveredOrders
    ? (histogramWithCenter
        .filter((item) => item.center <= 7)
        .reduce((sum, item) => sum + item.count, 0) /
        totalDeliveredOrders) *
      100
    : 0
  const from7To14DaysShare = totalDeliveredOrders
    ? (histogramWithCenter
        .filter((item) => item.center > 7 && item.center <= 14)
        .reduce((sum, item) => sum + item.count, 0) /
        totalDeliveredOrders) *
      100
    : 0
  const from14To30DaysShare = totalDeliveredOrders
    ? (histogramWithCenter
        .filter((item) => item.center > 14 && item.center <= 30)
        .reduce((sum, item) => sum + item.count, 0) /
        totalDeliveredOrders) *
      100
    : 0

  const slaRanges = [
    { label: "Ate 7 dias", share: upTo7DaysShare },
    { label: "7 a 14 dias", share: from7To14DaysShare },
    { label: "14 a 30 dias", share: from14To30DaysShare },
    { label: "Acima de 30 dias", share: over30DaysShare },
  ]
  const dominantSlaRange = [...slaRanges].sort((a, b) => b.share - a.share)[0]

  const dominantRange = [...deliveryStats.histogram].sort((a, b) => b.count - a.count)[0]
  const topRanges = [...deliveryStats.histogram]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((item) => ({
      ...item,
      share: totalDeliveredOrders ? (item.count / totalDeliveredOrders) * 100 : 0,
    }))

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

          <Card className="border-slate-900 bg-slate-900 text-white">
            <CardHeader>
              <CardDescription className="text-slate-200">Headline do bloco</CardDescription>
              <CardTitle className="text-2xl">
                Eficiência de entrega: {toSignedPercentage(deliveryEfficiencyPercentage)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-200">
              {deliveryEfficiencyPercentage >= 0
                ? "A operação está entregando mais rápido que o prazo prometido no recorte atual."
                : "A operação está entregando mais devagar que o prazo prometido no recorte atual."}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Card>
              <CardHeader>
                <CardDescription>Tempo médio de entrega</CardDescription>
                <CardTitle>{toDays(deliveryStats.avg_delivery_days)}</CardTitle>
                <CardDescription className="pt-1">
                  vs prazo prometido: {toSignedPercentage(deliveryEfficiencyPercentage)}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Prazo prometido médio</CardDescription>
                <CardTitle>{toDays(deliveryStats.avg_estimated_days)}</CardTitle>
                <CardDescription className="pt-1">
                  diferença real: {toSignedDays(scheduleGapDays)}
                </CardDescription>
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
                <CardDescription className="pt-1">
                  entrega no prazo: {toPercentage(onTimePercentage)}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Faixa de SLA dominante</CardDescription>
                <CardTitle>{dominantSlaRange ? dominantSlaRange.label : "N/A"}</CardTitle>
                <CardDescription className="pt-1">
                  participacao: {dominantSlaRange ? toPercentage(dominantSlaRange.share) : "0,0%"}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-10">
            <Card className="xl:col-span-6">
              <CardHeader>
                <CardTitle>Faixas de SLA de entrega</CardTitle>
                <CardDescription>Percentual de pedidos por janela operacional</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {slaRanges.map((range) => (
                  <div key={range.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm text-slate-700">
                      <span>{range.label}</span>
                      <span className="font-semibold text-slate-900">{toPercentage(range.share)}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-800"
                        style={{ width: `${Math.min(100, Math.max(0, range.share))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="xl:col-span-4">
              <CardHeader>
                <CardTitle>Concentração operacional</CardTitle>
                <CardDescription>Leitura rápida das faixas mais recorrentes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-900">Faixa dominante:</span>{" "}
                    {dominantRange ? dominantRange.label : "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Entregas em até 14 dias:</span>{" "}
                    {toPercentage(upTo14DaysShare)}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Entregas acima de 30 dias:</span>{" "}
                    {toPercentage(over30DaysShare)}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Variabilidade (CV):</span>{" "}
                    {toPercentage(variationCoefficient)}
                  </p>
                </div>

                <div className="space-y-3">
                  {topRanges.map((range) => (
                    <div key={range.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>{range.label}</span>
                        <span>{toPercentage(range.share)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-800"
                          style={{ width: `${Math.min(100, Math.max(0, range.share))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Visual de apoio — Histograma</CardTitle>
              <CardDescription>Distribuição detalhada de dias por faixa técnica</CardDescription>
            </CardHeader>
            <CardContent>
              <DeliveryTimeDistributionChart data={deliveryStats.histogram} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Insight executivo</CardTitle>
              <CardDescription>Síntese de desempenho logístico no recorte selecionado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p>
                {upTo14DaysShare >= 60
                  ? "A operação é eficiente, com a maior parte das entregas concluída em até 14 dias."
                  : "A distribuição de entrega é mais dispersa, com menor concentração em prazos curtos."}
              </p>
              <p>
                {deliveryEfficiencyPercentage >= 0
                  ? `O prazo real está ${toSignedPercentage(deliveryEfficiencyPercentage)} mais rápido que o prometido, sugerindo espaço para recalibrar a promessa de entrega.`
                  : `O prazo real está ${toSignedPercentage(deliveryEfficiencyPercentage)} mais lento que o prometido, indicando necessidade de ajuste operacional.`}
              </p>
              <p>
                {over30DaysShare >= 10
                  ? "Existe uma cauda relevante de entregas acima de 30 dias que pode impactar a experiência do cliente."
                  : "A cauda de entregas acima de 30 dias é residual no cenário atual."}
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
