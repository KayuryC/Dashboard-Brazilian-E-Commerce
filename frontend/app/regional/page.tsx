import { SalesByStateMapDynamic } from "@/components/maps/sales-by-state-map-dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSalesByState } from "@/services/api"

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export default async function RegionalPage() {
  const salesByState = await getSalesByState()

  const topState = salesByState[0]
  const totalRevenue = salesByState.reduce((acc, item) => acc + item.revenue, 0)

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto grid max-w-6xl gap-6">
        <section>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Módulo Regional</h1>
          <p className="text-slate-600">Distribuição geográfica da receita e concentração por estado</p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Estados cobertos</CardDescription>
              <CardTitle>{salesByState.length}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Receita nacional</CardDescription>
              <CardTitle>{toCurrency(totalRevenue)}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Estado líder</CardDescription>
              <CardTitle>{topState ? `${topState.customer_state} (${toCurrency(topState.revenue)})` : "-"}</CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Receita por estado</CardTitle>
              <CardDescription>Mapa coroplético com intensidade por receita</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesByStateMapDynamic data={salesByState} />
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Ranking regional</CardTitle>
              <CardDescription>Top 10 estados por receita</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {salesByState.slice(0, 10).map((state) => (
                <div
                  key={state.customer_state}
                  className="grid grid-cols-[72px_1fr_auto] items-center gap-3 rounded-lg bg-slate-50 px-3 py-2"
                >
                  <span className="text-sm font-semibold text-slate-900">{state.customer_state}</span>
                  <span className="text-sm text-slate-600">{state.orders.toLocaleString("pt-BR")} pedidos</span>
                  <span className="text-sm font-semibold text-slate-900">{toCurrency(state.revenue)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
