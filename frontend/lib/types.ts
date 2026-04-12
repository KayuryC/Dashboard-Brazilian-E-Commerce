export type OverviewMetrics = {
  total_orders: number
  total_customers: number
  total_revenue: number
  average_ticket: number
  average_review_score: number
  late_delivery_percentage: number
  delivered_orders: number
  canceled_orders: number
  status_breakdown: Record<string, number>
}

export type SalesByStatePoint = {
  customer_state: string
  revenue: number
  orders: number
}
