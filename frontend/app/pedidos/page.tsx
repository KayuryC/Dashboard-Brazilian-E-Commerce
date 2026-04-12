import { OrdersByStatusChart } from "@/components/charts/orders-by-status"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getOrdersByStatus, getOverviewMetrics } from "@/services/api"

export default async function PedidosPage() {
  const [metrics, ordersByStatus] = await Promise.all([getOverviewMetrics(), getOrdersByStatus()])

  const chartData = ordersByStatus.map((item) => ({
    name: item.order_status,
    value: item.orders,
  }))

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto grid max-w-6xl gap-6">
        <section>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Módulo de Pedidos</h1>
          <p className="text-slate-600">Distribuição de status e visão operacional do funil de pedidos</p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Total de pedidos</CardDescription>
              <CardTitle>{metrics.total_orders.toLocaleString("pt-BR")}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Pedidos entregues</CardDescription>
              <CardTitle>{metrics.delivered_orders.toLocaleString("pt-BR")}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Pedidos cancelados</CardDescription>
              <CardTitle>{metrics.canceled_orders.toLocaleString("pt-BR")}</CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Pedidos por status</CardTitle>
              <CardDescription>Participação de cada status no volume total</CardDescription>
            </CardHeader>
            <CardContent>
              <OrdersByStatusChart data={chartData} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Detalhamento por status</CardTitle>
              <CardDescription>Contagem absoluta por categoria de status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {ordersByStatus.map((item) => (
                <div key={item.order_status} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                  <span className="text-sm font-medium text-slate-700">{item.order_status}</span>
                  <span className="text-sm font-semibold text-slate-900">{item.orders.toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
