import {
  DeliveryTimeAnalysis,
  OrderValueDescriptiveStats,
  OrdersByStatusPoint,
  OverviewMetrics,
  SalesByCategoryPoint,
  SalesByCityPoint,
  SalesByStatePoint,
  SalesMonthlyPoint,
} from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  const res = await fetch(`${API_BASE_URL}/api/v1/metrics/overview`, {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error("Failed to fetch overview metrics")
  }

  return res.json()
}

export async function getSalesByState(): Promise<SalesByStatePoint[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/sales/by-state`, {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error("Failed to fetch sales by state")
  }

  return res.json()
}

export async function getSalesByCity(): Promise<SalesByCityPoint[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/sales/by-city`, {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error("Failed to fetch sales by city")
  }

  return res.json()
}

export async function getOrdersByStatus(): Promise<OrdersByStatusPoint[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/orders/by-status`, {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error("Failed to fetch orders by status")
  }

  return res.json()
}

export async function getSalesMonthly(): Promise<SalesMonthlyPoint[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/sales/monthly`, {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error("Failed to fetch monthly sales")
  }

  return res.json()
}

export async function getSalesByCategory(): Promise<SalesByCategoryPoint[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/sales/by-category`, {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error("Failed to fetch sales by category")
  }

  return res.json()
}

export async function getOrderValueDescriptiveStats(): Promise<OrderValueDescriptiveStats> {
  const res = await fetch(`${API_BASE_URL}/api/v1/statistics/descriptive/order-values`, {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error("Failed to fetch order value descriptive stats")
  }

  return res.json()
}

export async function getDeliveryTimeAnalysis(): Promise<DeliveryTimeAnalysis> {
  const res = await fetch(`${API_BASE_URL}/api/v1/statistics/descriptive/delivery-time`, {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error("Failed to fetch delivery time analysis")
  }

  return res.json()
}
