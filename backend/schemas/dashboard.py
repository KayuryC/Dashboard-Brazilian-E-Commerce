from datetime import date

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(examples=["ok"])


class OverviewMetrics(BaseModel):
    total_orders: int
    total_customers: int
    total_revenue: float
    average_ticket: float
    average_review_score: float
    late_delivery_percentage: float
    delivered_orders: int
    canceled_orders: int
    status_breakdown: dict[str, int]


class OrdersByStatusPoint(BaseModel):
    status: str
    label: str
    value: int


class SalesMonthlyPoint(BaseModel):
    purchase_year_month: str
    revenue: float
    orders: int


class SalesByStatePoint(BaseModel):
    customer_state: str
    revenue: float
    orders: int


class SalesByCityPoint(BaseModel):
    customer_city: str
    revenue: float
    orders: int


class SalesByCategoryPoint(BaseModel):
    product_category_name_english: str
    revenue: float
    items: int


class DescriptiveHistogramBin(BaseModel):
    label: str
    min_value: float
    max_value: float
    count: int


class TicketRangeDistributionPoint(BaseModel):
    label: str
    min_value: float
    max_value: float | None
    orders_count: int
    orders_percentage: float
    revenue: float
    revenue_percentage: float


class OrderValueDescriptiveStats(BaseModel):
    mean_value: float
    median_value: float
    std_dev_value: float
    min_value: float
    q1_value: float
    q3_value: float
    iqr_value: float
    max_value: float
    histogram: list[DescriptiveHistogramBin]
    ticket_range_distribution: list[TicketRangeDistributionPoint]


class DeliveryHistogramBin(BaseModel):
    label: str
    min_days: float
    max_days: float
    count: int


class DeliveryMonthlyTrendPoint(BaseModel):
    purchase_year_month: str
    avg_delivery_days: float
    avg_estimated_days: float
    late_delivery_percentage: float
    delivered_orders: int


class DeliveryTimeAnalysis(BaseModel):
    avg_delivery_days: float
    avg_estimated_days: float
    std_delivery_days: float
    late_delivery_percentage: float
    histogram: list[DeliveryHistogramBin]
    monthly_trend: list[DeliveryMonthlyTrendPoint]


class DeliveryRiskEventProbability(BaseModel):
    event_key: str
    label: str
    probability: float
    count: int


class DeliveryRiskCdfPoint(BaseModel):
    days: float
    cumulative_probability: float


class DeliveryRiskAnalysis(BaseModel):
    probability_late_delivery: float
    probability_delivery_up_to_7_days: float
    probability_delivery_up_to_14_days: float
    probability_delivery_over_30_days: float
    total_delivered_orders: int
    event_probabilities: list[DeliveryRiskEventProbability]
    cdf: list[DeliveryRiskCdfPoint]


class DatasetDateRange(BaseModel):
    min_date: date | None
    max_date: date | None


class DatasetRawTableProfile(BaseModel):
    dataset_key: str
    file_name: str
    rows: int
    columns: int


class DatasetColumnProfile(BaseModel):
    column_name: str
    dtype: str
    non_null_count: int
    null_count: int
    null_percentage: float
    unique_count: int


class DatasetStudyResponse(BaseModel):
    raw_tables: list[DatasetRawTableProfile]
    raw_total_rows: int
    raw_total_columns: int
    consolidated_rows: int
    consolidated_columns: int
    consolidated_unique_orders: int
    consolidated_unique_customers: int
    consolidated_missing_cells: int
    consolidated_missing_percentage: float
    consolidated_memory_mb: float
    consolidated_columns_profile: list[DatasetColumnProfile]


class ModelingCoefficient(BaseModel):
    feature_key: str
    feature_label: str
    coefficient: float
    std_error: float
    ci_lower: float
    ci_upper: float


class ModelingPredictionSample(BaseModel):
    actual_value: float
    predicted_value: float
    residual: float


class LinearRegressionModelResult(BaseModel):
    target_label: str
    sample_size: int
    r2: float
    adjusted_r2: float
    rmse: float
    mae: float
    target_mean: float
    target_std: float
    baseline_rmse: float
    baseline_mae: float
    rmse_gain_vs_baseline: float
    mae_gain_vs_baseline: float
    rmse_percent_of_mean: float
    mae_percent_of_mean: float
    quality_label: str
    executive_reading: str
    coefficients: list[ModelingCoefficient]
    prediction_samples: list[ModelingPredictionSample]


class ModelingForecastPoint(BaseModel):
    period: str
    actual_value: float | None
    predicted_value: float
    is_future: bool


class RevenueForecastResult(BaseModel):
    sample_size: int
    r2: float
    rmse: float
    mae: float
    slope: float
    intercept: float
    horizon_months: int
    series: list[ModelingForecastPoint]


class ModelingTrainTestValidationResult(BaseModel):
    train_size: int
    test_size: int
    r2_train: float
    r2_test: float
    rmse_train: float
    rmse_test: float
    mae_train: float
    mae_test: float
    generalization_gap: float
    stability_label: str
    interpretation: str


class HypothesisTestResult(BaseModel):
    test_name: str
    metric_label: str
    group_a_label: str
    group_b_label: str
    group_a_mean: float
    group_b_mean: float
    mean_difference: float
    p_value: float
    z_score: float
    ci_lower: float
    ci_upper: float
    significance_level: float
    reject_null: bool
    interpretation: str


class ConfidenceIntervalResult(BaseModel):
    metric_key: str
    metric_label: str
    point_estimate: float
    ci_lower: float
    ci_upper: float
    confidence_level: float
    sample_size: int


class PracticalRecommendation(BaseModel):
    priority: str
    title: str
    recommendation: str
    evidence: str
    expected_impact: str


class ModelingSummaryResponse(BaseModel):
    linear_regression: LinearRegressionModelResult
    revenue_forecast: RevenueForecastResult
    train_test_validation: ModelingTrainTestValidationResult
    hypothesis_tests: list[HypothesisTestResult]
    confidence_intervals: list[ConfidenceIntervalResult]
    practical_recommendations: list[PracticalRecommendation]
    study_limitations: list[str]


class StatisticsSummaryResponse(BaseModel):
    overview: OverviewMetrics
    orders_by_status: list[OrdersByStatusPoint]
    sales_monthly: list[SalesMonthlyPoint]
    sales_by_state: list[SalesByStatePoint]
    sales_by_category: list[SalesByCategoryPoint]
    top_cities_by_revenue: list[SalesByCityPoint]
    top_city_by_orders: SalesByCityPoint | None = None


class RelationshipCorrelationMetrics(BaseModel):
    value_delivery_correlation: float
    delay_review_correlation: float
    value_delivery_sample_size: int
    delay_review_sample_size: int


class RelationshipScatterPoint(BaseModel):
    order_value: float
    delivery_time_days: float


class RelationshipBoxplotGroup(BaseModel):
    group: str
    count: int
    min_value: float
    q1_value: float
    median_value: float
    q3_value: float
    max_value: float
    mean_value: float


class RelationshipStateBehaviorPoint(BaseModel):
    customer_state: str
    orders: int
    avg_order_value: float
    avg_delivery_days: float
    avg_review_score: float
    late_delivery_percentage: float


class RelationshipCorrelationHeatmapCell(BaseModel):
    x_key: str
    y_key: str
    x_label: str
    y_label: str
    correlation: float


class RelationshipsAnalysisResponse(BaseModel):
    correlations: RelationshipCorrelationMetrics
    scatter: list[RelationshipScatterPoint]
    review_score_by_delivery_status: list[RelationshipBoxplotGroup]
    top_states_behavior: list[RelationshipStateBehaviorPoint]
    correlation_matrix: list[RelationshipCorrelationHeatmapCell]
