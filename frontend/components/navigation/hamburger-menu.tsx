"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Home, Map, Menu, ShoppingBag, X } from "lucide-react"
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
    description: "Visão executiva do e-commerce",
    icon: Home,
  },
  {
    href: "/pedidos",
    label: "Pedidos",
    description: "Status e distribuição de pedidos",
    icon: ShoppingBag,
  },
  {
    href: "/vendas",
    label: "Vendas",
    description: "Evolução temporal e categorias",
    icon: BarChart3,
  },
  {
    href: "/regional",
    label: "Regional",
    description: "Mapa e ranking por estado",
    icon: Map,
  },
]

const titleByPath: Record<string, string> = {
  "/": "Home",
  "/pedidos": "Pedidos",
  "/vendas": "Vendas",
  "/regional": "Regional",
}

export function HamburgerMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const currentTitle = useMemo(() => titleByPath[pathname] ?? "Dashboard", [pathname])

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-6">
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
          "fixed inset-0 z-30 bg-slate-950/35 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 border-r border-slate-200 bg-white p-4 transition-transform",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Navegação</p>
            <h2 className="text-lg font-semibold text-slate-900">Módulos</h2>
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
          {navItems.map((item) => {
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
