import { StatisticsGlobalFilters } from "@/components/filters/statistics-global-filters"
import { OrderValueHistogram } from "@/components/charts/order-value-histogram"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  buildActiveDashboardFilters,
  buildDateScopeFilters,
  buildStatisticsContextLabel,
  parseStatisticsFilters,
  type StatisticsSearchParams,
} from "@/lib/statistics-filters"
import { getOrderValueDescriptiveStats, getSalesByCity, getSalesByState } from "@/services/api"

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function normalizeGeoName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

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
  const selectedFilters = parseStatisticsFilters(resolvedSearchParams)
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

  const totalBrazilRevenue = salesByStateComparison.reduce((sum, item) => sum + item.revenue, 0)
  const selectedStateComparison = selectedFilters.state
    ? salesByStateComparison.find((item) => item.customer_state.toUpperCase() === selectedFilters.state)
    : undefined
  const selectedStateShare =
    selectedStateComparison && totalBrazilRevenue > 0
      ? (selectedStateComparison.revenue / totalBrazilRevenue) * 100
      : 0
  const selectedStateRank = selectedStateComparison
    ? salesByStateComparison.findIndex((item) => item.customer_state.toUpperCase() === selectedFilters.state) + 1
    : 0

  const selectedCityComparison = selectedFilters.city
    ? cityOptionsData.find(
        (item) =>
          normalizeGeoName(item.customer_city) === normalizeGeoName(selectedFilters.city)
      )
    : undefined
  const totalStateRevenue = cityOptionsData.reduce((sum, item) => sum + item.revenue, 0)
  const selectedCityShareInState =
    selectedCityComparison && totalStateRevenue > 0
      ? (selectedCityComparison.revenue / totalStateRevenue) * 100
      : 0
  const selectedCityRankInState = selectedCityComparison
    ? cityOptionsData.findIndex(
        (item) =>
          normalizeGeoName(item.customer_city) === normalizeGeoName(selectedCityComparison.customer_city)
      ) + 1
    : 0

  const contextLabel = buildStatisticsContextLabel(selectedFilters)

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
          stateOptions={stateOptions}
          cityOptions={cityOptions}
        />

        <section className="grid gap-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Distribuição de valores de pedidos</h2>
            <p className="text-sm text-slate-600">
              Medidas descritivas para leitura de concentração, dispersão e extremos
            </p>
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-medium text-slate-900">Contexto atual:</span> {contextLabel}
            </p>
          </div>

          {selectedFilters.state && selectedStateComparison ? (
            <Card>
              <CardHeader>
                <CardTitle>Contexto comparativo do recorte</CardTitle>
                <CardDescription>Filtro aplicado + posicionamento relativo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                <p>
                  {selectedFilters.state} representa{" "}
                  <span className="font-semibold text-slate-900">{toPercentage(selectedStateShare)}</span> da
                  receita nacional no período e está em{" "}
                  <span className="font-semibold text-slate-900">{selectedStateRank}º</span> no ranking.
                </p>
                {selectedFilters.city && selectedCityComparison ? (
                  <p>
                    {selectedCityComparison.customer_city} concentra{" "}
                    <span className="font-semibold text-slate-900">
                      {toPercentage(selectedCityShareInState)}
                    </span>{" "}
                    da receita de {selectedFilters.state} e está em{" "}
                    <span className="font-semibold text-slate-900">{selectedCityRankInState}º</span> no ranking
                    estadual.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

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
              <CardTitle>Histograma</CardTitle>
              <CardDescription>Concentração de pedidos por faixa de valor</CardDescription>
            </CardHeader>
            <CardContent>
              <OrderValueHistogram data={orderValueStats.histogram} />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
