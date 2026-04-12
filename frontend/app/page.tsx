import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getOverviewMetrics } from "@/services/api"

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export default async function HomePage() {
  const metrics = await getOverviewMetrics()

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto grid w-full max-w-[1420px] gap-8">
        <section>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Giras</h1>
          <p className="text-slate-600">
            Análise de dados e modelagem estatística aplicada ao e-commerce brasileiro
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <Card className="min-h-[320px] justify-between border-slate-200 shadow-sm">
            <CardHeader className="space-y-3">
              <CardTitle className="text-2xl text-slate-900">Estatística e Probabilidade</CardTitle>
              <CardDescription className="text-sm leading-relaxed text-slate-600">
                Análise exploratória dos dados do e-commerce, incluindo KPIs, distribuição de pedidos e insights
                operacionais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-600">
                  Pedidos: <span className="font-semibold text-slate-900">{metrics.total_orders.toLocaleString("pt-BR")}</span>
                </p>
                <p className="text-sm text-slate-600">
                  Receita: <span className="font-semibold text-slate-900">{toCurrency(metrics.total_revenue)}</span>
                </p>
                <p className="text-sm text-slate-600">
                  Ticket médio: <span className="font-semibold text-slate-900">{toCurrency(metrics.average_ticket)}</span>
                </p>
              </div>

              <Link
                href="/statistics"
                className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Ver análise
              </Link>
            </CardContent>
          </Card>

          <Card className="min-h-[320px] justify-between border-slate-200 shadow-sm">
            <CardHeader className="space-y-3">
              <CardTitle className="text-2xl text-slate-900">Modelagem Estatística</CardTitle>
              <CardDescription className="text-sm leading-relaxed text-slate-600">
                Aplicação de regressão linear, testes de hipótese e intervalos de confiança para validação de
                insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                  Status: <span className="font-semibold">Em desenvolvimento</span>
                </p>
              </div>

              <Link
                href="/modeling"
                className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Em breve
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
