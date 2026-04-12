import { SalesCategoryChart } from "@/components/charts/sales-category-chart"
import { SalesMonthlyChart } from "@/components/charts/sales-monthly-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSalesByCategory, getSalesMonthly } from "@/services/api"

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export default async function VendasPage() {
  const [salesMonthly, salesByCategory] = await Promise.all([getSalesMonthly(), getSalesByCategory()])

  const totalRevenue = salesMonthly.reduce((acc, item) => acc + item.revenue, 0)
  const topCategory = salesByCategory[0]

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto grid max-w-6xl gap-6">
        <section>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Módulo de Vendas</h1>
          <p className="text-slate-600">Evolução temporal da receita e categorias com maior contribuição</p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Receita consolidada</CardDescription>
              <CardTitle>{toCurrency(totalRevenue)}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Períodos mensais</CardDescription>
              <CardTitle>{salesMonthly.length}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Categoria líder</CardDescription>
              <CardTitle className="text-lg">{topCategory?.product_category_name_english ?? "-"}</CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Receita por mês</CardTitle>
              <CardDescription>Trajetória temporal do faturamento</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesMonthlyChart data={salesMonthly} />
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Top categorias por receita</CardTitle>
              <CardDescription>Ranking das 10 categorias com maior faturamento</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesCategoryChart data={salesByCategory} />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
