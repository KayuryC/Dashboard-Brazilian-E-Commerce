import { DeliveryTimeDistributionChart } from "@/components/charts/delivery-time-distribution-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDeliveryTimeAnalysis } from "@/services/api"

function toDays(value: number) {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} dias`
}

function toPercentage(value: number) {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

export default async function StatisticsDeliveryPage() {
  const deliveryStats = await getDeliveryTimeAnalysis()

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto grid w-full max-w-[1560px] gap-8">
        <section>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Estatística e Probabilidade</h1>
          <p className="text-slate-600">Bloco 2 — Tempo de Entrega: análise de entrega</p>
        </section>

        <section className="grid gap-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Análise de entrega</h2>
            <p className="text-sm text-slate-600">Tempo médio real, estimado, variação e percentual de atraso</p>
          </div>

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
