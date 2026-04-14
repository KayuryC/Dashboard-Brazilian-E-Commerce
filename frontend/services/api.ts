import {
  DatasetDateRange,
  DeliveryTimeAnalysis,
  OrderValueDescriptiveStats,
  OrdersByStatusPoint,
  OverviewMetrics,
  SalesByCategoryPoint,
  SalesByCityPoint,
  SalesByStatePoint,
  SalesMonthlyPoint,
  StatisticsSummaryResponse,
} from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const REVALIDATE_SECONDS = 300

export type DashboardFiltersParams = {
  state?: string
  city?: string
  startDate?: string
  endDate?: string
}

function buildFilteredUrl(path: string, filters?: DashboardFiltersParams): string {
  const url = new URL(path, API_BASE_URL)
  const params = url.searchParams

  if (filters?.state) {
    params.set("state", filters.state)
  }
  if (filters?.city) {
    params.set("city", filters.city)
  }
  if (filters?.startDate) {
    params.set("start_date", filters.startDate)
  }
  if (filters?.endDate) {
    params.set("end_date", filters.endDate)
  }

  url.search = params.toString()
  return url.toString()
}

export async function getOverviewMetrics(filters?: DashboardFiltersParams): Promise<OverviewMetrics> {
  const res = await fetch(buildFilteredUrl("/api/v1/metrics/overview", filters), {
    next: { revalidate: REVALIDATE_SECONDS },
  })

  if (!res.ok) {
    throw new Error("Failed to fetch overview metrics")
  }

  return res.json()
}

export async function getDatasetDateRange(): Promise<DatasetDateRange> {
  const res = await fetch(`${API_BASE_URL}/api/v1/filters/date-range`, {
    next: { revalidate: REVALIDATE_SECONDS },
  })

  if (!res.ok) {
    throw new Error("Failed to fetch dataset date range")
  }

  return res.json()
}

export async function getStatisticsSummary(
  filters?: DashboardFiltersParams,
  topN = 10,
): Promise<StatisticsSummaryResponse> {
  const res = await fetch(buildFilteredUrl(`/api/v1/statistics/summary?top_n=${topN}`, filters), {
    next: { revalidate: REVALIDATE_SECONDS },
  })

  if (!res.ok) {
    throw new Error("Failed to fetch statistics summary")
  }

  return res.json()
}

export async function getSalesByState(filters?: DashboardFiltersParams): Promise<SalesByStatePoint[]> {
  const res = await fetch(buildFilteredUrl("/api/v1/sales/by-state", filters), {
    next: { revalidate: REVALIDATE_SECONDS },
  })

  if (!res.ok) {
    throw new Error("Failed to fetch sales by state")
  }

  return res.json()
}

export async function getSalesByCity(filters?: DashboardFiltersParams): Promise<SalesByCityPoint[]> {
  const res = await fetch(buildFilteredUrl("/api/v1/sales/by-city", filters), {
    next: { revalidate: REVALIDATE_SECONDS },
  })

  if (!res.ok) {
    throw new Error("Failed to fetch sales by city")
  }

  return res.json()
}

export async function getOrdersByStatus(filters?: DashboardFiltersParams): Promise<OrdersByStatusPoint[]> {
  const res = await fetch(buildFilteredUrl("/api/v1/orders/by-status", filters), {
    next: { revalidate: REVALIDATE_SECONDS },
  })

  if (!res.ok) {
    throw new Error("Failed to fetch orders by status")
  }

  return res.json()
}

export async function getSalesMonthly(filters?: DashboardFiltersParams): Promise<SalesMonthlyPoint[]> {
  const res = await fetch(buildFilteredUrl("/api/v1/sales/monthly", filters), {
    next: { revalidate: REVALIDATE_SECONDS },
  })

  if (!res.ok) {
    throw new Error("Failed to fetch monthly sales")
  }

  return res.json()
}

export async function getSalesByCategory(filters?: DashboardFiltersParams): Promise<SalesByCategoryPoint[]> {
  const res = await fetch(buildFilteredUrl("/api/v1/sales/by-category", filters), {
    next: { revalidate: REVALIDATE_SECONDS },
  })

  if (!res.ok) {
    throw new Error("Failed to fetch sales by category")
  }

  return res.json()
}

export async function getOrderValueDescriptiveStats(filters?: DashboardFiltersParams): Promise<OrderValueDescriptiveStats> {
  const res = await fetch(buildFilteredUrl("/api/v1/statistics/descriptive/order-values", filters), {
    next: { revalidate: REVALIDATE_SECONDS },
  })

  if (!res.ok) {
    throw new Error("Failed to fetch order value descriptive stats")
  }

  return res.json()
}

export async function getDeliveryTimeAnalysis(filters?: DashboardFiltersParams): Promise<DeliveryTimeAnalysis> {
  const res = await fetch(buildFilteredUrl("/api/v1/statistics/descriptive/delivery-time", filters), {
    next: { revalidate: REVALIDATE_SECONDS },
  })

  if (!res.ok) {
    throw new Error("Failed to fetch delivery time analysis")
  }

  return res.json()
}
