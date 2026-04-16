import dynamic from "next/dynamic"

import { StatisticsGlobalFilters } from "@/components/filters/statistics-global-filters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  buildActiveDashboardFilters,
  buildDateScopeFilters,
  buildStatisticsContextLabel,
  clampStatisticsFiltersToDateBounds,
  parseStatisticsFilters,
  type StatisticsSearchParams,
} from "@/lib/statistics-filters"
import { getDatasetDateRange, getModelingSummary, getSalesByCity, getSalesByState } from "@/services/api"

type ModelingPageProps = {
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

const ModelingCoefficientsChart = dynamic(
  () => import("@/components/charts/modeling-coefficients-chart").then((mod) => mod.ModelingCoefficientsChart),
  { loading: () => <ChartSkeleton height={340} /> },
)

const ModelingRevenueForecastChart = dynamic(
  () => import("@/components/charts/modeling-revenue-forecast-chart").then((mod) => mod.ModelingRevenueForecastChart),
  { loading: () => <ChartSkeleton height={360} /> },
)

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function toPct(value: number, digits = 1) {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`
}

function toNum(value: number, digits = 4) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })
}

function toSigned(value: number, digits = 1) {
  const base = Math.abs(value).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
  if (value > 0) return `+${base}`
  if (value < 0) return `-${base}`
  return base
}

function qualityBadgeClass(label: string) {
  if (label === "Boa") return "border-emerald-200 bg-emerald-50 text-emerald-800"
  if (label === "Moderada") return "border-amber-200 bg-amber-50 text-amber-800"
  if (label === "Fraca") return "border-orange-200 bg-orange-50 text-orange-800"
  if (label === "Muito fraca" || label === "Baixa confiabilidade") return "border-rose-200 bg-rose-50 text-rose-800"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function recommendationPriorityClass(priority: string) {
  if (priority === "Alta") return "border-rose-200 bg-rose-50 text-rose-900"
  if (priority === "Media") return "border-amber-200 bg-amber-50 text-amber-900"
  return "border-slate-200 bg-slate-50 text-slate-900"
}

function forecastHeadline(slope: number): string {
  if (slope > 0) return "A serie indica crescimento medio mensal de receita."
  if (slope < 0) return "A serie indica reducao media mensal de receita."
  return "A serie esta estavel no periodo analisado."
}

function modelDecisionByContext(qualityLabel: string, stabilityLabel: string): string {
  if (qualityLabel === "Boa" && stabilityLabel === "Estavel") {
    return "Pode apoiar previsoes agregadas e cenarios operacionais com confianca moderada."
  }
  if (qualityLabel === "Moderada" && (stabilityLabel === "Estavel" || stabilityLabel === "Estabilidade moderada")) {
    return "Use para direcionamento tatico e combine com analise de negocio por categoria/estado."
  }
  if (qualityLabel === "Fraca" || stabilityLabel === "Estabilidade moderada") {
    return "Use como diagnostico de tendencia; evite previsao individual de pedido."
  }
  if (qualityLabel === "Muito fraca" || stabilityLabel === "Baixa confiabilidade" || stabilityLabel === "Overfitting") {
    return "Priorize leitura estrategica e amplie variaveis antes de tomar decisao baseada em previsao pontual."
  }
  return "Sem recorte suficiente para decisao com este modelo."
}

export default async function ModelingPage({ searchParams }: ModelingPageProps) {
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

  const [modelingSummary, salesByState, cityOptionsData] = await Promise.all([
    getModelingSummary(activeFilters, 3),
    getSalesByState(dateScopeFilters),
    selectedFilters.state
      ? getSalesByCity({
          ...dateScopeFilters,
          state: selectedFilters.state,
        })
      : Promise.resolve([]),
  ])

  const stateOptions = salesByState
    .map((item) => item.customer_state)
    .filter((value, index, array) => /^[A-Z]{2}$/.test(value) && array.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b, "pt-BR"))

  const cityOptions = cityOptionsData
    .map((item) => item.customer_city)
    .filter((value, index, array) => value && array.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b, "pt-BR"))

  const contextLabel = buildStatisticsContextLabel(selectedFilters)
  const regression = modelingSummary.linear_regression
  const forecast = modelingSummary.revenue_forecast
  const validation = modelingSummary.train_test_validation
  const hypothesisTests = modelingSummary.hypothesis_tests
  const confidenceIntervals = modelingSummary.confidence_intervals
  const practicalRecommendations = modelingSummary.practical_recommendations
  const studyLimitations = modelingSummary.study_limitations

  const r2Pct = regression.r2 * 100
  const adjustedR2Pct = regression.adjusted_r2 * 100
  const hasRegressionData = regression.sample_size > 0
  const hypothesisMain = hypothesisTests[0]
  const predictionSamples = regression.prediction_samples.slice(0, 6)

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="stats-page-shell">
        <section className="stats-page-header">
          <h1 className="stats-page-title">Modelagem Estatistica</h1>
          <p className="stats-page-subtitle">
            Modulo que transforma dados em evidencia para decisao: regressao linear, previsao de receita,
            validacao fora da amostra e inferencia estatistica.
          </p>
        </section>

        <Card className="border-slate-200 bg-slate-50/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">Como ler este modulo</CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Cada bloco responde uma pergunta diferente para fechar o ciclo: explicar, projetar, validar e decidir.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="font-semibold text-slate-900">Bloco 1 - Explicacao</p>
              <p className="text-slate-700">Quais variaveis ajudam a explicar o valor do pedido.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="font-semibold text-slate-900">Bloco 2 - Projecao</p>
              <p className="text-slate-700">Como a receita tende a evoluir no curto prazo.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="font-semibold text-slate-900">Bloco 3 - Confiabilidade</p>
              <p className="text-slate-700">Se o modelo continua util quando sai do treino.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="font-semibold text-slate-900">Bloco 4 - Decisao</p>
              <p className="text-slate-700">Acoes praticas sustentadas por teste e intervalo de confianca.</p>
            </div>
          </CardContent>
        </Card>

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
          <div className="stats-block-header gap-3">
            <h2 className="stats-block-title">Bloco 1 - Regressao linear do valor do pedido</h2>
            <p className="stats-block-subtitle">
              Pergunta de negocio: o que realmente influencia o valor final do pedido no recorte selecionado?
            </p>
            <div className="stats-context-chip-row">
              <span className="stats-context-chip">{contextLabel}</span>
              <span className={`stats-context-chip border ${qualityBadgeClass(regression.quality_label)}`}>
                Qualidade do modelo: {regression.quality_label}
              </span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="stats-panel-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">Pergunta</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-slate-700">
                O modelo consegue explicar o valor dos pedidos com as variaveis operacionais atuais?
              </CardContent>
            </Card>
            <Card className="stats-panel-card md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">Evidencia principal</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-slate-700">
                {regression.executive_reading}
              </CardContent>
            </Card>
          </div>

          <Card className="stats-insight-shell border-slate-300/90">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900">Decisao recomendada</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-slate-700">
              {modelDecisionByContext(regression.quality_label, validation.stability_label)}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">Variacao explicada (R2)</CardDescription>
                <CardTitle className="stats-kpi-value">{toPct(r2Pct, 1)}</CardTitle>
                <CardDescription className="stats-kpi-helper">R2 ajustado: {toPct(adjustedR2Pct, 1)}</CardDescription>
              </CardHeader>
            </Card>

            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">Erro medio absoluto (MAE)</CardDescription>
                <CardTitle className="stats-kpi-value">{toCurrency(regression.mae)}</CardTitle>
                <CardDescription className="stats-kpi-helper">{toPct(regression.mae_percent_of_mean, 1)} do ticket medio</CardDescription>
              </CardHeader>
            </Card>

            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">Erro penalizado (RMSE)</CardDescription>
                <CardTitle className="stats-kpi-value">{toCurrency(regression.rmse)}</CardTitle>
                <CardDescription className="stats-kpi-helper">{toPct(regression.rmse_percent_of_mean, 1)} do ticket medio</CardDescription>
              </CardHeader>
            </Card>

            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">Ganho vs baseline (MAE)</CardDescription>
                <CardTitle className="stats-kpi-value">{toSigned(regression.mae_gain_vs_baseline, 1)}%</CardTitle>
                <CardDescription className="stats-kpi-helper">Baseline MAE: {toCurrency(regression.baseline_mae)}</CardDescription>
              </CardHeader>
            </Card>

            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">Base modelada</CardDescription>
                <CardTitle className="stats-kpi-value">{regression.sample_size.toLocaleString("pt-BR")}</CardTitle>
                <CardDescription className="stats-kpi-helper">Ticket medio: {toCurrency(regression.target_mean)}</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-12">
            <Card className="stats-panel-card xl:col-span-7">
              <CardHeader>
                <CardTitle className="stats-chart-title">Coeficientes do modelo</CardTitle>
                <CardDescription className="stats-chart-subtitle">
                  Barras positivas aumentam o valor previsto; negativas reduzem.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ModelingCoefficientsChart data={regression.coefficients.filter((item) => item.feature_key !== "intercept")} />
              </CardContent>
            </Card>

            <div className="grid gap-4 xl:col-span-5">
              <Card className="stats-panel-card">
                <CardHeader>
                  <CardTitle className="stats-chart-title">Como interpretar R2, MAE e RMSE</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm text-slate-700">
                  <p><span className="font-semibold text-slate-900">R2 ({toPct(r2Pct, 1)}):</span> percentual do comportamento do valor de pedido capturado pelo modelo.</p>
                  <p><span className="font-semibold text-slate-900">MAE ({toCurrency(regression.mae)}):</span> erro medio em reais, facilita leitura operacional do desvio esperado.</p>
                  <p><span className="font-semibold text-slate-900">RMSE ({toCurrency(regression.rmse)}):</span> penaliza erros grandes; quando muito acima do MAE, ha casos extremos relevantes.</p>
                </CardContent>
              </Card>

              <Card className="stats-panel-card">
                <CardHeader>
                  <CardTitle className="stats-chart-title">Amostra de previsoes (real vs previsto)</CardTitle>
                  <CardDescription className="stats-chart-subtitle">
                    Residual positivo = subestimacao; residual negativo = superestimacao.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {hasRegressionData ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-2 py-2">Real</th>
                            <th className="px-2 py-2">Previsto</th>
                            <th className="px-2 py-2">Residual</th>
                          </tr>
                        </thead>
                        <tbody>
                          {predictionSamples.map((row, index) => (
                            <tr key={`pred-${index}`} className="border-b border-slate-100">
                              <td className="px-2 py-2 text-slate-800">{toCurrency(row.actual_value)}</td>
                              <td className="px-2 py-2 text-slate-700">{toCurrency(row.predicted_value)}</td>
                              <td
                                className={`px-2 py-2 ${
                                  row.residual > 0 ? "text-emerald-700" : row.residual < 0 ? "text-rose-700" : "text-slate-700"
                                }`}
                              >
                                {row.residual > 0 ? "+" : ""}
                                {toCurrency(row.residual)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">Sem amostra suficiente para previsoes no recorte atual.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="stats-block-shell">
          <div className="stats-block-header gap-3">
            <h2 className="stats-block-title">Bloco 2 - Previsao de receita</h2>
            <p className="stats-block-subtitle">
              Pergunta de negocio: a receita tende a crescer, ficar estavel ou desacelerar no curto prazo?
            </p>
          </div>

          <Card className="stats-insight-shell border-slate-300/90">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900">Leitura executiva da tendencia</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-slate-700">
              {forecastHeadline(forecast.slope)} Crescimento mensal estimado: {toCurrency(forecast.slope)}.
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">Meses modelados</CardDescription>
                <CardTitle className="stats-kpi-value">{forecast.sample_size.toLocaleString("pt-BR")}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">Ajuste da tendencia (R2)</CardDescription>
                <CardTitle className="stats-kpi-value">{toPct(forecast.r2 * 100, 1)}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">Crescimento mensal estimado</CardDescription>
                <CardTitle className="stats-kpi-value">{toCurrency(forecast.slope)}</CardTitle>
                <CardDescription className="stats-kpi-helper">variacao media por mes</CardDescription>
              </CardHeader>
            </Card>

            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">Erro da tendencia (MAE)</CardDescription>
                <CardTitle className="stats-kpi-value">{toCurrency(forecast.mae)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-12">
            <Card className="stats-panel-card xl:col-span-8">
              <CardHeader>
                <CardTitle className="stats-chart-title">Receita real vs receita prevista</CardTitle>
                <CardDescription className="stats-chart-subtitle">
                  Linha escura = historico observado. Linha azul tracejada = projecao linear para frente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ModelingRevenueForecastChart data={forecast.series} />
              </CardContent>
            </Card>

            <Card className="stats-panel-card xl:col-span-4">
              <CardHeader>
                <CardTitle className="stats-chart-title">Uso pratico da previsao</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">Leitura:</span> este bloco mostra direcao de receita,
                  nao substitui meta comercial detalhada por categoria.
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Acao:</span> ajustar capacidade de estoque e operacao
                  conforme inclinacao mensal projetada.
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Risco:</span> se o R2 for baixo, trate a linha como
                  sinal de tendencia e nao como previsao exata de cada mes.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="stats-block-shell">
          <div className="stats-block-header gap-3">
            <h2 className="stats-block-title">Bloco 3 - Validacao fora da amostra</h2>
            <p className="stats-block-subtitle">
              Pergunta de negocio: o desempenho se mantem quando o modelo encontra dados que nao viu no treino?
            </p>
            <div className="stats-context-chip-row">
              <span className="stats-context-chip">Treino: {validation.train_size.toLocaleString("pt-BR")} pedidos</span>
              <span className="stats-context-chip">Teste: {validation.test_size.toLocaleString("pt-BR")} pedidos</span>
              <span className={`stats-context-chip border ${qualityBadgeClass(validation.stability_label)}`}>
                Estabilidade: {validation.stability_label}
              </span>
            </div>
          </div>

          <Card className="stats-insight-shell border-slate-300/90">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900">Resposta direta do bloco</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-slate-700">{validation.interpretation}</CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">R2 treino</CardDescription>
                <CardTitle className="stats-kpi-value">{toPct(validation.r2_train * 100, 1)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">R2 teste</CardDescription>
                <CardTitle className="stats-kpi-value">{toPct(validation.r2_test * 100, 1)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">MAE treino</CardDescription>
                <CardTitle className="stats-kpi-value">{toCurrency(validation.mae_train)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">MAE teste</CardDescription>
                <CardTitle className="stats-kpi-value">{toCurrency(validation.mae_test)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">Gap de generalizacao</CardDescription>
                <CardTitle className="stats-kpi-value">{toNum(validation.generalization_gap, 3)}</CardTitle>
                <CardDescription className="stats-kpi-helper">R2 treino - R2 teste</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section className="stats-block-shell">
          <div className="stats-block-header gap-3">
            <h2 className="stats-block-title">Bloco 4 - Inferencia e decisoes praticas</h2>
            <p className="stats-block-subtitle">
              Pergunta de negocio: quais conclusoes sao estatisticamente confiaveis para orientar acao?
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-12">
            <Card className="stats-panel-card xl:col-span-7">
              <CardHeader>
                <CardTitle className="stats-chart-title">Teste principal de hipotese</CardTitle>
                <CardDescription className="stats-chart-subtitle">
                  p-valor {'<'} 0,05 indica evidencia de diferenca real entre os grupos comparados.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {hypothesisTests.length === 0 ? (
                  <p className="text-sm text-slate-600">Sem dados suficientes para testes no recorte atual.</p>
                ) : (
                  hypothesisTests.map((test, index) => (
                    <div key={`test-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                      <p className="font-semibold text-slate-900">{test.test_name}</p>
                      <div className="mt-2 grid gap-2 md:grid-cols-2 text-slate-700">
                        <p>{test.group_a_label}: <span className="font-medium text-slate-900">{toNum(test.group_a_mean, 3)}</span></p>
                        <p>{test.group_b_label}: <span className="font-medium text-slate-900">{toNum(test.group_b_mean, 3)}</span></p>
                        <p>Diferenca media: <span className="font-medium text-slate-900">{toNum(test.mean_difference, 3)}</span></p>
                        <p>p-valor: <span className="font-medium text-slate-900">{toNum(test.p_value, 6)}</span></p>
                      </div>
                      <p className="mt-2 text-slate-700">IC 95%: [{toNum(test.ci_lower, 3)}, {toNum(test.ci_upper, 3)}]</p>
                      <p className="mt-2 text-slate-800">{test.interpretation}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="stats-panel-card xl:col-span-5">
              <CardHeader>
                <CardTitle className="stats-chart-title">Intervalos de confianca (95%)</CardTitle>
                <CardDescription className="stats-chart-subtitle">
                  Faixa esperada das metricas para evitar leitura baseada em ponto unico.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {confidenceIntervals.length === 0 ? (
                  <p className="text-sm text-slate-600">Sem dados suficientes para intervalos no recorte atual.</p>
                ) : (
                  confidenceIntervals.map((interval) => (
                    <div key={interval.metric_key} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                      <p className="font-semibold text-slate-900">{interval.metric_label}</p>
                      <p className="text-slate-700">Estimativa: {toNum(interval.point_estimate, 3)}</p>
                      <p className="text-slate-700">IC 95%: [{toNum(interval.ci_lower, 3)}, {toNum(interval.ci_upper, 3)}]</p>
                      <p className="text-slate-600">n = {interval.sample_size.toLocaleString("pt-BR")}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="stats-panel-card">
            <CardHeader>
              <CardTitle className="stats-chart-title">Decisoes recomendadas com evidencia</CardTitle>
              <CardDescription className="stats-chart-subtitle">
                Traducao direta de estatistica para acao operacional priorizada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {practicalRecommendations.length === 0 ? (
                <p className="text-sm text-slate-600">Sem recomendacoes disponiveis para o recorte atual.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {practicalRecommendations.map((item, index) => (
                    <div
                      key={`rec-${index}`}
                      className={`rounded-xl border p-4 text-sm ${recommendationPriorityClass(item.priority)}`}
                    >
                      <p className="font-semibold">
                        [{item.priority}] {item.title}
                      </p>
                      <p className="mt-2 leading-relaxed">{item.recommendation}</p>
                      <p className="mt-2 text-slate-700">
                        <span className="font-medium text-slate-900">Evidencia:</span> {item.evidence}
                      </p>
                      <p className="mt-1 text-slate-700">
                        <span className="font-medium text-slate-900">Impacto esperado:</span> {item.expected_impact}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="stats-panel-card">
            <CardHeader>
              <CardTitle className="stats-chart-title">Limitacoes do estudo</CardTitle>
              <CardDescription className="stats-chart-subtitle">
                Pontos que precisam ser mencionados na apresentacao academica e na tomada de decisao.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-slate-700">
              {studyLimitations.length === 0 ? (
                <p>Sem limitacoes registradas para o recorte atual.</p>
              ) : (
                studyLimitations.map((item, index) => <p key={`lim-${index}`}>- {item}</p>)
              )}
            </CardContent>
          </Card>

          {hypothesisMain ? (
            <Card className="stats-insight-shell border-slate-300/90">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">Sintese final do modulo</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-slate-700">
                Com base no recorte atual, a diferenca media observada no teste principal foi de
                <span className="font-semibold text-slate-900"> {toNum(hypothesisMain.mean_difference, 3)}</span>
                , com p-valor
                <span className="font-semibold text-slate-900"> {toNum(hypothesisMain.p_value, 6)}</span>.
                A recomendacao e combinar essa evidencia com os limites de confianca e com a estabilidade do modelo
                para priorizar acoes operacionais de curto prazo.
              </CardContent>
            </Card>
          ) : null}
        </section>
      </div>
    </main>
  )
}
