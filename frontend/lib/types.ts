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

export type SalesByCityPoint = {
  customer_city: string
  revenue: number
  orders: number
}

export type OrdersByStatusPoint = {
  status: string
  label: string
  value: number
}

export type SalesMonthlyPoint = {
  purchase_year_month: string
  revenue: number
  orders: number
}

export type SalesByCategoryPoint = {
  product_category_name_english: string
  revenue: number
  items: number
}

export type DescriptiveHistogramBin = {
  label: string
  min_value: number
  max_value: number
  count: number
}

export type TicketRangeDistributionPoint = {
  label: string
  min_value: number
  max_value: number | null
  orders_count: number
  orders_percentage: number
  revenue: number
  revenue_percentage: number
}

export type OrderValueDescriptiveStats = {
  mean_value: number
  median_value: number
  std_dev_value: number
  min_value: number
  q1_value: number
  q3_value: number
  iqr_value: number
  max_value: number
  histogram: DescriptiveHistogramBin[]
  ticket_range_distribution: TicketRangeDistributionPoint[]
}

export type DeliveryHistogramBin = {
  label: string
  min_days: number
  max_days: number
  count: number
}

export type DeliveryTimeAnalysis = {
  avg_delivery_days: number
  avg_estimated_days: number
  std_delivery_days: number
  late_delivery_percentage: number
  histogram: DeliveryHistogramBin[]
  monthly_trend: DeliveryMonthlyTrendPoint[]
}

export type DeliveryMonthlyTrendPoint = {
  purchase_year_month: string
  avg_delivery_days: number
  avg_estimated_days: number
  late_delivery_percentage: number
  delivered_orders: number
}

export type DeliveryRiskEventProbability = {
  event_key: string
  label: string
  probability: number
  count: number
}

export type DeliveryRiskCdfPoint = {
  days: number
  cumulative_probability: number
}

export type DeliveryRiskAnalysis = {
  probability_late_delivery: number
  probability_delivery_up_to_7_days: number
  probability_delivery_up_to_14_days: number
  probability_delivery_over_30_days: number
  total_delivered_orders: number
  event_probabilities: DeliveryRiskEventProbability[]
  cdf: DeliveryRiskCdfPoint[]
}

export type DatasetDateRange = {
  min_date: string | null
  max_date: string | null
}

export type StatisticsSummaryResponse = {
  overview: OverviewMetrics
  orders_by_status: OrdersByStatusPoint[]
  sales_monthly: SalesMonthlyPoint[]
  sales_by_state: SalesByStatePoint[]
  sales_by_category: SalesByCategoryPoint[]
  top_cities_by_revenue: SalesByCityPoint[]
  top_city_by_orders: SalesByCityPoint | null
}

export type RelationshipCorrelationMetrics = {
  value_delivery_correlation: number
  delay_review_correlation: number
  value_delivery_sample_size: number
  delay_review_sample_size: number
}

export type RelationshipScatterPoint = {
  order_value: number
  delivery_time_days: number
}

export type RelationshipBoxplotGroup = {
  group: string
  count: number
  min_value: number
  q1_value: number
  median_value: number
  q3_value: number
  max_value: number
  mean_value: number
}

export type RelationshipStateBehaviorPoint = {
  customer_state: string
  orders: number
  avg_order_value: number
  avg_delivery_days: number
  avg_review_score: number
  late_delivery_percentage: number
}

export type RelationshipsAnalysisResponse = {
  correlations: RelationshipCorrelationMetrics
  scatter: RelationshipScatterPoint[]
  review_score_by_delivery_status: RelationshipBoxplotGroup[]
  top_states_behavior: RelationshipStateBehaviorPoint[]
  correlation_matrix: RelationshipCorrelationHeatmapCell[]
}

export type RelationshipCorrelationHeatmapCell = {
  x_key: string
  y_key: string
  x_label: string
  y_label: string
  correlation: number
}
