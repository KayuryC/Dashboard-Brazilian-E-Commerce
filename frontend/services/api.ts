import { OverviewMetrics } from "@/lib/types"

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
