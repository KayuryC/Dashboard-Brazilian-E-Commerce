import { OrderValueHistogram } from "@/components/charts/order-value-histogram"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getOrderValueDescriptiveStats } from "@/services/api"

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export default async function StatisticsDescriptivePage() {
  const orderValueStats = await getOrderValueDescriptiveStats()

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto grid w-full max-w-[1560px] gap-8">
        <section>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Estatística e Probabilidade</h1>
          <p className="text-slate-600">
            Bloco 1 — Estatística Descritiva: distribuição de valores de pedidos
          </p>
        </section>

        <section className="grid gap-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Distribuição de valores de pedidos</h2>
            <p className="text-sm text-slate-600">
              Medidas descritivas para leitura de concentração, dispersão e extremos
            </p>
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
