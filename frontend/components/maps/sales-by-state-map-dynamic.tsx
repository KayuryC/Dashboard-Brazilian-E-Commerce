"use client"

import dynamic from "next/dynamic"

import { SalesByStatePoint } from "@/lib/types"

const SalesByStateMap = dynamic(
  () => import("@/components/maps/sales-by-state-map").then((mod) => mod.SalesByStateMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[460px] items-center justify-center rounded-lg border bg-slate-100 text-sm text-slate-600">
        Carregando mapa...
      </div>
    ),
  }
)

type SalesByStateMapDynamicProps = {
  data: SalesByStatePoint[]
}

export function SalesByStateMapDynamic({ data }: SalesByStateMapDynamicProps) {
  return <SalesByStateMap data={data} />
}
