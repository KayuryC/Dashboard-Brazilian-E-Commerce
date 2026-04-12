import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getOverviewMetrics } from "@/services/api"

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function toPercentage(value: number) {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

export default async function HomePage() {
  const metrics = await getOverviewMetrics()

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto grid max-w-6xl gap-6">
        <section>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Giras</h1>
          <p className="text-slate-600">Porta de entrada com leitura executiva e acesso aos módulos de análise</p>
        </section>

        <section className="grid gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Visão Executiva</h2>
            <p className="text-sm text-slate-600">
              Como está o e-commerce no geral? Leitura rápida dos principais indicadores.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Card>
              <CardHeader>
                <CardDescription>Total de pedidos</CardDescription>
                <CardTitle>{metrics.total_orders.toLocaleString("pt-BR")}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Receita total</CardDescription>
                <CardTitle>{toCurrency(metrics.total_revenue)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Ticket médio</CardDescription>
                <CardTitle>{toCurrency(metrics.average_ticket)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Percentual de atraso</CardDescription>
                <CardTitle>{toPercentage(metrics.late_delivery_percentage)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Nota média de avaliação</CardDescription>
                <CardTitle>{metrics.average_review_score.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

          <Card>
            <CardHeader>
              <CardDescription>Total de clientes</CardDescription>
              <CardTitle>{metrics.total_customers.toLocaleString("pt-BR")}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Status distintos</CardDescription>
              <CardTitle>{Object.keys(metrics.status_breakdown).length}</CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section className="grid gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Módulos Principais</h2>
            <p className="text-sm text-slate-600">Acesse as análises detalhadas em páginas separadas</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos</CardTitle>
                <CardDescription>Status de pedidos e distribuição do funil operacional</CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href="/pedidos"
                  className="inline-flex rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Abrir módulo
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vendas</CardTitle>
                <CardDescription>Evolução mensal e análise de receita por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href="/vendas"
                  className="inline-flex rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Abrir módulo
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regional</CardTitle>
                <CardDescription>Mapa de receita por estado e ranking regional</CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href="/regional"
                  className="inline-flex rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Abrir módulo
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  )
}
