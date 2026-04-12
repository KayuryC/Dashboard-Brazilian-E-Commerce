import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ModelingPage() {
  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto grid max-w-4xl gap-6">
        <section>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Modelagem Estatística</h1>
          <p className="text-slate-600">
            Aplicação de regressão linear, testes de hipótese e intervalos de confiança para validação de insights.
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Status do módulo</CardTitle>
            <CardDescription>Planejamento de implementação</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                Status: <span className="font-semibold">Em desenvolvimento</span>
              </p>
            </div>

            <ul className="grid gap-2 text-sm text-slate-700">
              <li>Regressão linear para previsão de indicadores operacionais</li>
              <li>Testes de hipótese para validação estatística de insights</li>
              <li>Intervalos de confiança para interpretação robusta dos resultados</li>
            </ul>

            <Link
              href="/"
              className="inline-flex w-fit rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Voltar para Home
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
