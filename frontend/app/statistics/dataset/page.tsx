import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDatasetStudy } from "@/services/api"

export const dynamic = "force-dynamic"

function toNumber(value: number) {
  return value.toLocaleString("pt-BR")
}

function toPercentage(value: number) {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

export default async function StatisticsDatasetStudyPage() {
  const datasetStudy = await getDatasetStudy()
  const topColumnsByNulls = datasetStudy.consolidated_columns_profile.slice(0, 20)

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="stats-page-shell">
        <section className="stats-page-header">
          <h1 className="stats-page-title">Estatística e Probabilidade</h1>
          <p className="stats-page-subtitle">
            Estudo do dataset: estrutura das tabelas, volume de linhas, tipos de dados e cobertura de preenchimento
          </p>
        </section>

        <section className="stats-block-shell">
          <div className="stats-block-header">
            <h2 className="stats-block-title">Perfil estrutural do dataset</h2>
            <p className="stats-block-subtitle">
              Visão técnica consolidada para validar qualidade dos dados antes das análises
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">Linhas brutas (CSV)</CardDescription>
                <CardTitle className="stats-kpi-value">{toNumber(datasetStudy.raw_total_rows)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">Linhas pós-merge</CardDescription>
                <CardTitle className="stats-kpi-value">{toNumber(datasetStudy.consolidated_rows)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">Colunas pós-merge</CardDescription>
                <CardTitle className="stats-kpi-value">{toNumber(datasetStudy.consolidated_columns)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">Pedidos únicos</CardDescription>
                <CardTitle className="stats-kpi-value">{toNumber(datasetStudy.consolidated_unique_orders)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">Clientes únicos</CardDescription>
                <CardTitle className="stats-kpi-value">{toNumber(datasetStudy.consolidated_unique_customers)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="stats-kpi-card">
              <CardHeader>
                <CardDescription className="stats-kpi-label">Células nulas</CardDescription>
                <CardTitle className="stats-kpi-value">{toNumber(datasetStudy.consolidated_missing_cells)}</CardTitle>
                <CardDescription className="stats-kpi-helper">
                  {toPercentage(datasetStudy.consolidated_missing_percentage)} do total de células
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="stats-panel-card">
              <CardHeader>
                <CardTitle className="stats-chart-title">Tabelas brutas carregadas</CardTitle>
                <CardDescription className="stats-chart-subtitle">
                  Arquivos CSV de origem utilizados na consolidação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-2 py-2">Dataset</th>
                        <th className="px-2 py-2">Arquivo</th>
                        <th className="px-2 py-2">Linhas</th>
                        <th className="px-2 py-2">Colunas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datasetStudy.raw_tables.map((table) => (
                        <tr key={table.dataset_key} className="border-b border-slate-100">
                          <td className="px-2 py-2 font-medium text-slate-900">{table.dataset_key}</td>
                          <td className="px-2 py-2 text-slate-600">{table.file_name}</td>
                          <td className="px-2 py-2 text-slate-700">{toNumber(table.rows)}</td>
                          <td className="px-2 py-2 text-slate-700">{toNumber(table.columns)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="stats-panel-card">
              <CardHeader>
                <CardTitle className="stats-chart-title">Resumo técnico do consolidado</CardTitle>
                <CardDescription className="stats-chart-subtitle">
                  Dimensão final do dataset analítico e custo de memória
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <p className="text-slate-700">
                  <span className="font-semibold text-slate-900">Tabelas de origem:</span>{" "}
                  {toNumber(datasetStudy.raw_tables.length)}
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold text-slate-900">Colunas somadas dos CSVs:</span>{" "}
                  {toNumber(datasetStudy.raw_total_columns)}
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold text-slate-900">Memória estimada:</span>{" "}
                  {datasetStudy.consolidated_memory_mb.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  MB
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold text-slate-900">Granularidade final:</span>{" "}
                  nível de item de pedido após merge entre pedidos e itens.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="stats-panel-card">
            <CardHeader>
              <CardTitle className="stats-chart-title">Colunas com maior incidência de nulos</CardTitle>
              <CardDescription className="stats-chart-subtitle">
                Top 20 colunas ordenadas por percentual de nulos no dataset consolidado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-2 py-2">Coluna</th>
                      <th className="px-2 py-2">Tipo</th>
                      <th className="px-2 py-2">Preenchidos</th>
                      <th className="px-2 py-2">Nulos</th>
                      <th className="px-2 py-2">% Nulos</th>
                      <th className="px-2 py-2">Valores únicos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topColumnsByNulls.map((column) => (
                      <tr key={column.column_name} className="border-b border-slate-100">
                        <td className="px-2 py-2 font-medium text-slate-900">{column.column_name}</td>
                        <td className="px-2 py-2 text-slate-600">{column.dtype}</td>
                        <td className="px-2 py-2 text-slate-700">{toNumber(column.non_null_count)}</td>
                        <td className="px-2 py-2 text-slate-700">{toNumber(column.null_count)}</td>
                        <td className="px-2 py-2 text-slate-700">{toPercentage(column.null_percentage)}</td>
                        <td className="px-2 py-2 text-slate-700">{toNumber(column.unique_count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
