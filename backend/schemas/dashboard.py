from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(examples=["ok"])


class OverviewMetrics(BaseModel):
    total_orders: int
    delivered_orders: int
    canceled_orders: int
    total_revenue: float
    average_ticket: float
    status_breakdown: dict[str, int]
