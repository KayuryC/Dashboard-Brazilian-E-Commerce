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
