"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Clock3, Home, Layers3, Menu, X } from "lucide-react"
import { type ComponentType, useMemo, useState } from "react"

import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  description: string
  icon: ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Home",
    description: "Resumo e navegação dos módulos",
    icon: Home,
  },
  {
    href: "/statistics",
    label: "Estatística e Probabilidade",
    description: "Dashboard analítico completo",
    icon: BarChart3,
  },
  {
    href: "/modeling",
    label: "Modelagem Estatística",
    description: "Módulo em desenvolvimento",
    icon: Clock3,
  },
]

const statisticsNavItems: NavItem[] = [
  {
    href: "/",
    label: "Home (Principal)",
    description: "Voltar para a porta de entrada",
    icon: Home,
  },
  {
    href: "/statistics",
    label: "Visão geral",
    description: "Insights introdutórios do módulo",
    icon: Layers3,
  },
  {
    href: "/statistics/bloco-1",
    label: "Bloco 1 — Estatística Descritiva",
    description: "Distribuição de valores de pedidos",
    icon: BarChart3,
  },
  {
    href: "/statistics/bloco-2",
    label: "Bloco 2 — Tempo de Entrega",
    description: "Médias, atraso e distribuição de dias",
    icon: Clock3,
  },
]

const titleByPath: Record<string, string> = {
  "/": "Home",
  "/statistics": "Estatística e Probabilidade",
  "/modeling": "Modelagem Estatística",
}

export function HamburgerMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const inStatisticsModule = pathname === "/statistics" || pathname.startsWith("/statistics/")

  const currentTitle = useMemo(() => (inStatisticsModule ? "Estatística e Probabilidade" : titleByPath[pathname] ?? "Dashboard"), [inStatisticsModule, pathname])
  const menuItems = inStatisticsModule ? statisticsNavItems : navItems

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 md:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setOpen((state) => !state)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-800 transition hover:bg-slate-50"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Dashboard Giras</p>
            <p className="truncate text-sm font-semibold text-slate-900">{currentTitle}</p>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 top-16 z-30 bg-slate-950/35 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed left-0 top-16 z-50 h-[calc(100dvh-4rem)] w-[340px] max-w-[90vw] border-r border-t border-slate-200 bg-white p-4 shadow-2xl transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Navegação</p>
            <h2 className="text-lg font-semibold text-slate-900">{inStatisticsModule ? "Seções" : "Módulos"}</h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="grid gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-xl border p-3 transition",
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <div className="mb-1 flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-semibold">{item.label}</span>
                </div>
                <p className={cn("text-xs", isActive ? "text-slate-200" : "text-slate-600")}>{item.description}</p>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
