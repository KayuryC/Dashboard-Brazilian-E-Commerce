"use client"

import { useEffect, useMemo, useState } from "react"
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet"

import { SalesByStatePoint } from "@/lib/types"

const BRAZIL_STATES_GEOJSON_URL =
  "https://raw.githubusercontent.com/codeforamerica/click_that_hood/main/public/data/brazil-states.geojson"

type GeoJsonData = {
  type: "FeatureCollection"
  features: Array<{
    properties?: Record<string, unknown>
    geometry?: unknown
  }>
}

type SalesByStateMapProps = {
  data: SalesByStatePoint[]
}

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value)
}

function getColorScale(value: number, max: number): string {
  if (max <= 0) return "#e2e8f0"

  const ratio = value / max
  if (ratio > 0.8) return "#0f172a"
  if (ratio > 0.6) return "#1e3a8a"
  if (ratio > 0.4) return "#2563eb"
  if (ratio > 0.2) return "#60a5fa"
  if (ratio > 0.05) return "#bfdbfe"
  return "#e2e8f0"
}

export function SalesByStateMap({ data }: SalesByStateMapProps) {
  const [geoData, setGeoData] = useState<GeoJsonData | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadGeoData() {
      const response = await fetch(BRAZIL_STATES_GEOJSON_URL)
      if (!response.ok) {
        throw new Error("Failed to load Brazil states GeoJSON")
      }

      const json = (await response.json()) as GeoJsonData
      if (isMounted) {
        setGeoData(json)
      }
    }

    loadGeoData().catch(() => {
      if (isMounted) {
        setGeoData(null)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  const stateMetricsByUf = useMemo(() => {
    return new Map(data.map((point) => [point.customer_state.toUpperCase(), point]))
  }, [data])

  const maxRevenue = useMemo(() => {
    return data.reduce((acc, point) => Math.max(acc, point.revenue), 0)
  }, [data])

  if (!geoData) {
    return (
      <div className="flex h-[460px] items-center justify-center rounded-lg border bg-slate-100 text-sm text-slate-600">
        Carregando mapa do Brasil...
      </div>
    )
  }

  return (
    <div className="relative h-[460px] overflow-hidden rounded-lg border">
      <MapContainer
        center={[-14.235, -51.9253]}
        zoom={4}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <GeoJSON
          data={geoData as never}
          style={(feature) => {
            const uf = String(feature?.properties?.sigla ?? "").toUpperCase()
            const revenue = stateMetricsByUf.get(uf)?.revenue ?? 0

            return {
              fillColor: getColorScale(revenue, maxRevenue),
              weight: 1,
              opacity: 1,
              color: "#334155",
              fillOpacity: 0.78,
            }
          }}
          onEachFeature={(feature, layer) => {
            const uf = String(feature?.properties?.sigla ?? "").toUpperCase()
            const stateName = String(feature?.properties?.name ?? (uf || "Estado"))
            const point = stateMetricsByUf.get(uf)

            const revenue = point?.revenue ?? 0
            const orders = point?.orders ?? 0

            layer.bindTooltip(
              `<strong>${stateName} (${uf})</strong><br/>Receita: ${toCurrency(revenue)}<br/>Pedidos: ${orders.toLocaleString("pt-BR")}`,
              { sticky: true }
            )
          }}
        />
      </MapContainer>
    </div>
  )
}
