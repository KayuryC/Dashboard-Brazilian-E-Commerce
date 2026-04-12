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


class OrderValueDescriptiveStats(BaseModel):
    mean_value: float
    median_value: float
    std_dev_value: float
    min_value: float
    max_value: float
    histogram: list[DescriptiveHistogramBin]


class DeliveryHistogramBin(BaseModel):
    label: str
    min_days: float
    max_days: float
    count: int


class DeliveryTimeAnalysis(BaseModel):
    avg_delivery_days: float
    avg_estimated_days: float
    std_delivery_days: float
    late_delivery_percentage: float
    histogram: list[DeliveryHistogramBin]
