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


class SalesByCategoryPoint(BaseModel):
    product_category_name_english: str
    revenue: float
    items: int
