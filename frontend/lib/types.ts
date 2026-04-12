export type OverviewMetrics = {
  total_orders: number
  delivered_orders: number
  canceled_orders: number
  total_revenue: number
  average_ticket: number
  status_breakdown: Record<string, number>
}
