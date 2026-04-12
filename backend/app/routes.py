from fastapi import APIRouter

from app.config import RAW_DATA_DIR
from schemas.dashboard import (
    HealthResponse,
    OrdersByStatusPoint,
    OverviewMetrics,
    SalesByCategoryPoint,
    SalesByStatePoint,
    SalesMonthlyPoint,
)
from services.orders import get_orders_by_status
from services.overview import build_overview_metrics
from services.sales import get_sales_by_category, get_sales_by_state, get_sales_monthly

router = APIRouter(prefix="/api/v1", tags=["dashboard"])


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/metrics/overview", response_model=OverviewMetrics)
def metrics_overview() -> OverviewMetrics:
    return build_overview_metrics(RAW_DATA_DIR)


@router.get("/orders/by-status", response_model=list[OrdersByStatusPoint])
def orders_by_status() -> list[OrdersByStatusPoint]:
    dataframe = get_orders_by_status(RAW_DATA_DIR)
    return [OrdersByStatusPoint(**record) for record in dataframe.to_dict(orient="records")]


@router.get("/sales/monthly", response_model=list[SalesMonthlyPoint])
def sales_monthly() -> list[SalesMonthlyPoint]:
    dataframe = get_sales_monthly(RAW_DATA_DIR)
    return [SalesMonthlyPoint(**record) for record in dataframe.to_dict(orient="records")]


@router.get("/sales/by-state", response_model=list[SalesByStatePoint])
def sales_by_state() -> list[SalesByStatePoint]:
    dataframe = get_sales_by_state(RAW_DATA_DIR)
    return [SalesByStatePoint(**record) for record in dataframe.to_dict(orient="records")]


@router.get("/sales/by-category", response_model=list[SalesByCategoryPoint])
def sales_by_category() -> list[SalesByCategoryPoint]:
    dataframe = get_sales_by_category(RAW_DATA_DIR)
    return [SalesByCategoryPoint(**record) for record in dataframe.to_dict(orient="records")]
