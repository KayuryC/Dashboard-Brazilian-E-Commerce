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
  getDeliveryRiskAnalysis,
  getSalesByCity,
  getSalesByState,
} from "@/services/api"

type StatisticsProbabilityPageProps = {
  searchParams?: StatisticsSearchParams | Promise<StatisticsSearchParams>
}

function toPercentage(value: number) {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

function toSignedPoints(value: number) {
  const absValue = Math.abs(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  if (value > 0) return `+${absValue} p.p.`
  if (value < 0) return `-${absValue} p.p.`
  return `${absValue} p.p.`
}

function ChartSkeleton({ height = 320 }: { height?: number }) {
  return (
    <div
      className="w-full animate-pulse rounded-lg border border-slate-200 bg-slate-100"
      style={{ height }}
    />
  )
}

const DeliveryRiskProbabilityBars = dynamic(
  () =>
    import("@/components/charts/delivery-risk-probability-bars").then(
      (mod) => mod.DeliveryRiskProbabilityBars,
    ),
  { loading: () => <ChartSkeleton height={360} /> },
)

export default async function StatisticsProbabilityPage({
  searchParams,
}: StatisticsProbabilityPageProps) {
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

  const [riskStats, riskBaseline, salesByStateComparison, cityOptionsData] = await Promise.all([
    getDeliveryRiskAnalysis(activeFilters),
    getDeliveryRiskAnalysis(dateScopeFilters),
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

  const eventDeltaByKey = new Map(
    riskStats.event_probabilities.map((event) => {
      const baseline = riskBaseline.event_probabilities.find((item) => item.event_key === event.event_key)
      return [event.event_key, event.probability - (baseline?.probability ?? 0)]
    }),
  )

  const comparisonRows = riskStats.event_probabilities.map((event) => {
    const baseline = riskBaseline.event_probabilities.find((item) => item.event_key === event.event_key)
    const delta = event.probability - (baseline?.probability ?? 0)
    const isRiskInverse =
      event.event_key === "late_delivery" || event.event_key === "delivery_over_30_days"
    const isGoodDelta = isRiskInverse ? delta <= 0 : delta >= 0

    return {
      ...event,
      baseline: baseline?.probability ?? 0,
      delta,
      isGoodDelta,
    }
  })

  const lateProbability = riskStats.probability_late_delivery
  const upTo7Probability = riskStats.probability_delivery_up_to_7_days
  const upTo14Probability = riskStats.probability_delivery_up_to_14_days
  const over30Probability = riskStats.probability_delivery_over_30_days
  const baselineLate = riskBaseline.probability_late_delivery
  const baselineOver30 = riskBaseline.probability_delivery_over_30_days

  const stabilityLabel =
    lateProbability <= 10 && over30Probability <= 5
      ? "Estabilidade operacional alta"
      : lateProbability <= 15 && over30Probability <= 10
        ? "Estabilidade operacional moderada"
        : "Estabilidade operacional sob risco"

  const lateDelta = eventDeltaByKey.get("late_delivery") ?? 0
  const over30Delta = eventDeltaByKey.get("delivery_over_30_days") ?? 0

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto grid w-full max-w-[1560px] gap-8">
        <section>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Estatistica e Probabilidade</h1>
          <p className="text-slate-600">Bloco 4 — Probabilidade e risco operacional</p>
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
            <h2 className="text-xl font-semibold text-slate-900">Probabilidade de eventos de entrega</h2>
            <p className="text-sm text-slate-600">
              Leitura de risco operacional com comparativo contra referencia nacional
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
                    <span className="font-semibold text-slate-900">Participacao:</span>{" "}
                    {toPercentage(selectedStateShare)}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-slate-700">
                    <span className="font-semibold text-slate-900">Ranking:</span> {selectedStateRank}º de{" "}
                    {executiveContext.rankingTotal}
                  </span>
                </>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader>
                <CardDescription>Probabilidade de atraso</CardDescription>
                <CardTitle>{toPercentage(lateProbability)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Entrega ate 7 dias</CardDescription>
                <CardTitle>{toPercentage(upTo7Probability)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Entrega ate 14 dias</CardDescription>
                <CardTitle>{toPercentage(upTo14Probability)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Entrega acima de 30 dias</CardDescription>
                <CardTitle>{toPercentage(over30Probability)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-12">
            <Card className="xl:col-span-8">
              <CardHeader>
                <CardTitle>Eventos de risco por probabilidade</CardTitle>
                <CardDescription>
                  Visual principal · Quanto maior o valor, maior a chance do evento no recorte atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DeliveryRiskProbabilityBars data={riskStats.event_probabilities} />
              </CardContent>
            </Card>

            <Card className="xl:col-span-4">
              <CardHeader>
                <CardTitle>Comparacao com Brasil</CardTitle>
                <CardDescription>Mesmo periodo selecionado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {comparisonRows.map((row) => (
                  <div key={row.event_key} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <p className="font-semibold text-slate-900">{row.label}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.isGoodDelta ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {toSignedPoints(row.delta)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Recorte {toPercentage(row.probability)} · Brasil {toPercentage(row.baseline)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Insight executivo</CardTitle>
              <CardDescription>Leitura de estabilidade e risco operacional</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p>
                {stabilityLabel}: o recorte atual apresenta atraso em {toPercentage(lateProbability)} e
                entregas acima de 30 dias em {toPercentage(over30Probability)}.
              </p>
              <p>
                Em comparacao ao Brasil no mesmo periodo, o risco de atraso esta{" "}
                {lateDelta <= 0 ? "abaixo" : "acima"} da referencia ({toSignedPoints(lateDelta)}), e a cauda
                longa de entregas esta {over30Delta <= 0 ? "abaixo" : "acima"} ({toSignedPoints(over30Delta)}).
              </p>
              <p>
                {upTo14Probability >= 80
                  ? "A maior parte da operacao segue em janela curta de entrega (ate 14 dias), indicando boa previsibilidade."
                  : "A probabilidade de entrega em ate 14 dias esta abaixo do ideal, sugerindo oportunidade de ajuste logistico."}
              </p>
              <p className="text-slate-600">
                Baseline nacional: atraso {toPercentage(baselineLate)} · entregas acima de 30 dias{" "}
                {toPercentage(baselineOver30)} · amostra analisada {riskStats.total_delivered_orders.toLocaleString("pt-BR")} pedidos.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
