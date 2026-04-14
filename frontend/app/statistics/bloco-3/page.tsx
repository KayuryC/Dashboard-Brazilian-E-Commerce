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
  getRelationshipsAnalysis,
  getSalesByCity,
  getSalesByState,
} from "@/services/api"

type StatisticsRelationshipsPageProps = {
  searchParams?: StatisticsSearchParams | Promise<StatisticsSearchParams>
}

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function toDays(value: number) {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} dias`
}

function toSignedNumber(value: number, decimals = 2) {
  const absValue = Math.abs(value).toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  if (value > 0) return `+${absValue}`
  if (value < 0) return `-${absValue}`
  return absValue
}

function correlationStrengthLabel(correlation: number): string {
  const absolute = Math.abs(correlation)
  if (absolute < 0.1) return "muito fraca"
  if (absolute < 0.3) return "fraca"
  if (absolute < 0.5) return "moderada"
  if (absolute < 0.7) return "forte"
  return "muito forte"
}

function correlationDirectionLabel(correlation: number): string {
  if (correlation > 0.05) return "positiva"
  if (correlation < -0.05) return "negativa"
  return "praticamente nula"
}

function ChartSkeleton({ height = 320 }: { height?: number }) {
  return (
    <div
      className="w-full animate-pulse rounded-lg border border-slate-200 bg-slate-100"
      style={{ height }}
    />
  )
}

const ValueDeliveryScatter = dynamic(
  () => import("@/components/charts/value-delivery-scatter").then((mod) => mod.ValueDeliveryScatter),
  { loading: () => <ChartSkeleton height={360} /> },
)

const ReviewScoreBoxplotGroups = dynamic(
  () =>
    import("@/components/charts/review-score-boxplot-groups").then(
      (mod) => mod.ReviewScoreBoxplotGroups,
    ),
  { loading: () => <ChartSkeleton height={320} /> },
)

const CorrelationHeatmap = dynamic(
  () => import("@/components/charts/correlation-heatmap").then((mod) => mod.CorrelationHeatmap),
  { loading: () => <ChartSkeleton height={320} /> },
)

export default async function StatisticsRelationshipsPage({
  searchParams,
}: StatisticsRelationshipsPageProps) {
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

  const [relationships, salesByStateComparison, cityOptionsData] = await Promise.all([
    getRelationshipsAnalysis(activeFilters),
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

  const valueDeliveryCorrelation = relationships.correlations.value_delivery_correlation
  const delayReviewCorrelation = relationships.correlations.delay_review_correlation

  const onTimeGroup = relationships.review_score_by_delivery_status.find((item) => item.group === "No prazo")
  const lateGroup = relationships.review_score_by_delivery_status.find((item) => item.group === "Atrasado")
  const reviewGap = (onTimeGroup?.mean_value ?? 0) - (lateGroup?.mean_value ?? 0)

  const topStateBehavior = relationships.top_states_behavior[0]

  const valueDeliveryCorrelationAbs = Math.abs(valueDeliveryCorrelation)
  const delayReviewCorrelationAbs = Math.abs(delayReviewCorrelation)

  const valueDeliveryInterpretation =
    valueDeliveryCorrelationAbs < 0.1
      ? "Não há evidência de relação linear forte entre valor e tempo de entrega."
      : `A relação é ${correlationStrengthLabel(valueDeliveryCorrelation)} e ${correlationDirectionLabel(valueDeliveryCorrelation)} no recorte atual.`

  const delayReviewInterpretation =
    delayReviewCorrelationAbs < 0.1
      ? "A relação linear entre atraso e nota é residual neste recorte."
      : `A relação é ${correlationStrengthLabel(delayReviewCorrelation)} e ${correlationDirectionLabel(delayReviewCorrelation)}.`

  const topStateInsight = topStateBehavior
    ? `${topStateBehavior.customer_state}: ticket medio ${toCurrency(topStateBehavior.avg_order_value)}, entrega media ${toDays(topStateBehavior.avg_delivery_days)} e atraso de ${topStateBehavior.late_delivery_percentage.toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}%.`
    : "Sem dados suficientes para comportamento por estado no recorte."

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="stats-page-shell">
        <section className="stats-page-header">
          <h1 className="stats-page-title">Estatística e Probabilidade</h1>
          <p className="stats-page-subtitle">Bloco 3 — Relação entre variáveis</p>
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
            <h2 className="stats-block-title">Como as variáveis se influenciam</h2>
            <p className="stats-block-subtitle">
              Relação entre valor, tempo de entrega, atraso e avaliação do cliente
            </p>
            <div className="stats-context-chip-row">
              <span className="stats-context-chip">
                <span className="stats-context-chip-label">Analisando:</span> {executiveContext.analysisLabel}
              </span>
              <span className="stats-context-chip">
                <span className="stats-context-chip-label">Período:</span> {executiveContext.periodLabel}
              </span>
              {selectedStateComparison ? (
                <>
                  <span className="stats-context-chip">
                    <span className="stats-context-chip-label">Participação:</span>{" "}
                    {selectedStateShare.toLocaleString("pt-BR", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                    %
                  </span>
                  <span className="stats-context-chip">
                    <span className="stats-context-chip-label">Ranking:</span> {selectedStateRank}º de{" "}
                    {executiveContext.rankingTotal}
                  </span>
                </>
              ) : (
                <span className="stats-context-chip">
                  <span className="stats-context-chip-label">Participação:</span> 100,0% (Brasil)
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-12">
            <Card className="stats-panel-card xl:col-span-8">
              <CardHeader>
                <CardTitle className="stats-chart-title">Scatter plot — Valor do pedido x Tempo de entrega</CardTitle>
                <CardDescription className="stats-chart-subtitle">
                  Visual principal do bloco · X: valor do pedido · Y: tempo de entrega (dias)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ValueDeliveryScatter data={relationships.scatter} />
              </CardContent>
            </Card>

            <Card className="stats-panel-card xl:col-span-4">
              <CardHeader>
                <CardTitle className="stats-chart-title">Leitura de correlacao</CardTitle>
                <CardDescription className="stats-chart-subtitle">KPIs conectados ao scatter principal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Correlacao valor x tempo</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">r {toSignedNumber(valueDeliveryCorrelation, 3)}</p>
                    <p className="mt-1 text-xs text-slate-600">{valueDeliveryInterpretation}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Correlacao atraso x nota</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">r {toSignedNumber(delayReviewCorrelation, 3)}</p>
                    <p className="mt-1 text-xs text-slate-600">{delayReviewInterpretation}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Amostra valor x tempo</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {relationships.correlations.value_delivery_sample_size.toLocaleString("pt-BR")} pedidos
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Impacto medio do atraso na nota</p>
                    <p className="mt-1 font-semibold text-slate-900">{toSignedNumber(-reviewGap, 2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-12">
            <Card className="stats-panel-card xl:col-span-7">
              <CardHeader>
                <CardTitle className="stats-chart-title">Boxplot por grupo de atraso</CardTitle>
                <CardDescription className="stats-chart-subtitle">Visual de apoio · Distribuicao de nota em pedidos no prazo vs atrasado</CardDescription>
              </CardHeader>
              <CardContent>
                <ReviewScoreBoxplotGroups data={relationships.review_score_by_delivery_status} />
              </CardContent>
            </Card>

            <Card className="stats-panel-card xl:col-span-5">
              <CardHeader>
                <CardTitle className="stats-chart-title">Heatmap de correlação</CardTitle>
                <CardDescription className="stats-chart-subtitle">
                  Intensidade e direção das relações entre variáveis do recorte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <CorrelationHeatmap data={relationships.correlation_matrix} />
                <p className="text-xs text-slate-500">
                  Azul indica correlação positiva e vermelho indica correlação negativa.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="stats-insight-shell">
            <CardHeader>
              <CardTitle className="stats-chart-title">Insight executivo</CardTitle>
              <CardDescription className="stats-chart-subtitle">Leitura de negocio para tomada de decisao</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p>
                {valueDeliveryCorrelation > 0.15
                  ? "Pedidos de maior valor tendem a levar mais tempo para entrega, sinalizando maior complexidade logistica em pedidos premium."
                  : valueDeliveryCorrelation < -0.15
                    ? "Pedidos de maior valor nao mostram aumento de prazo; no recorte atual, o tempo de entrega nao cresce com o ticket."
                    : "A relacao entre valor do pedido e tempo de entrega e baixa, com pouca influencia direta entre as variaveis."}
              </p>
              <p>
                {delayReviewCorrelation < -0.15
                  ? "Pedidos com maior atraso tendem a receber notas menores, indicando impacto direto na satisfacao do cliente."
                  : delayReviewCorrelation > 0.15
                    ? "No recorte atual, atraso e nota mostram relacao positiva inesperada; vale investigar perfil especifico de pedidos."
                    : "A relacao entre atraso e nota e fraca, sugerindo que outros fatores tambem influenciam a avaliacao."}
              </p>
              <p>{topStateInsight}</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
