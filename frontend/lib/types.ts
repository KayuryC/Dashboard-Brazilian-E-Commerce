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

export type DatasetRawTableProfile = {
  dataset_key: string
  file_name: string
  rows: number
  columns: number
}

export type DatasetColumnProfile = {
  column_name: string
  dtype: string
  non_null_count: number
  null_count: number
  null_percentage: number
  unique_count: number
}

export type DatasetStudyResponse = {
  raw_tables: DatasetRawTableProfile[]
  raw_total_rows: number
  raw_total_columns: number
  consolidated_rows: number
  consolidated_columns: number
  consolidated_unique_orders: number
  consolidated_unique_customers: number
  consolidated_missing_cells: number
  consolidated_missing_percentage: number
  consolidated_memory_mb: number
  consolidated_columns_profile: DatasetColumnProfile[]
}

export type ModelingCoefficient = {
  feature_key: string
  feature_label: string
  coefficient: number
  std_error: number
  ci_lower: number
  ci_upper: number
}

export type ModelingPredictionSample = {
  actual_value: number
  predicted_value: number
  residual: number
}

export type LinearRegressionModelResult = {
  target_label: string
  sample_size: number
  r2: number
  adjusted_r2: number
  rmse: number
  mae: number
  target_mean: number
  target_std: number
  baseline_rmse: number
  baseline_mae: number
  rmse_gain_vs_baseline: number
  mae_gain_vs_baseline: number
  rmse_percent_of_mean: number
  mae_percent_of_mean: number
  quality_label: string
  executive_reading: string
  coefficients: ModelingCoefficient[]
  prediction_samples: ModelingPredictionSample[]
}

export type ModelingForecastPoint = {
  period: string
  actual_value: number | null
  predicted_value: number
  is_future: boolean
}

export type RevenueForecastResult = {
  sample_size: number
  r2: number
  rmse: number
  mae: number
  slope: number
  intercept: number
  horizon_months: number
  series: ModelingForecastPoint[]
}

export type ModelingTrainTestValidationResult = {
  train_size: number
  test_size: number
  r2_train: number
  r2_test: number
  rmse_train: number
  rmse_test: number
  mae_train: number
  mae_test: number
  generalization_gap: number
  stability_label: string
  interpretation: string
}

export type HypothesisTestResult = {
  test_name: string
  metric_label: string
  group_a_label: string
  group_b_label: string
  group_a_mean: number
  group_b_mean: number
  mean_difference: number
  p_value: number
  z_score: number
  ci_lower: number
  ci_upper: number
  significance_level: number
  reject_null: boolean
  interpretation: string
}

export type ConfidenceIntervalResult = {
  metric_key: string
  metric_label: string
  point_estimate: number
  ci_lower: number
  ci_upper: number
  confidence_level: number
  sample_size: number
}

export type PracticalRecommendation = {
  priority: string
  title: string
  recommendation: string
  evidence: string
  expected_impact: string
}

export type ModelingSummaryResponse = {
  linear_regression: LinearRegressionModelResult
  revenue_forecast: RevenueForecastResult
  train_test_validation: ModelingTrainTestValidationResult
  hypothesis_tests: HypothesisTestResult[]
  confidence_intervals: ConfidenceIntervalResult[]
  practical_recommendations: PracticalRecommendation[]
  study_limitations: string[]
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
