from fastapi import APIRouter

from app.config import RAW_DATA_DIR
from schemas.dashboard import (
    DeliveryHistogramBin,
    DeliveryTimeAnalysis,
    DescriptiveHistogramBin,
    HealthResponse,
    OrdersByStatusPoint,
    OrderValueDescriptiveStats,
    OverviewMetrics,
    SalesByCategoryPoint,
    SalesByCityPoint,
    SalesByStatePoint,
    SalesMonthlyPoint,
)
from services.delivery import get_delivery_time_analysis
from services.descriptive import get_order_value_descriptive_stats
from services.orders import get_orders_by_status
from services.overview import build_overview_metrics
from services.sales import (
    get_sales_by_category,
    get_sales_by_city,
    get_sales_by_state,
    get_sales_monthly,
)

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


@router.get("/sales/by-city", response_model=list[SalesByCityPoint])
def sales_by_city() -> list[SalesByCityPoint]:
    dataframe = get_sales_by_city(RAW_DATA_DIR)
    return [SalesByCityPoint(**record) for record in dataframe.to_dict(orient="records")]


@router.get("/sales/by-category", response_model=list[SalesByCategoryPoint])
def sales_by_category() -> list[SalesByCategoryPoint]:
    dataframe = get_sales_by_category(RAW_DATA_DIR)
    return [SalesByCategoryPoint(**record) for record in dataframe.to_dict(orient="records")]


@router.get(
    "/statistics/descriptive/order-values",
    response_model=OrderValueDescriptiveStats,
)
def statistics_descriptive_order_values() -> OrderValueDescriptiveStats:
    stats = get_order_value_descriptive_stats(RAW_DATA_DIR)
    return OrderValueDescriptiveStats(
        mean_value=stats["mean_value"],
        median_value=stats["median_value"],
        std_dev_value=stats["std_dev_value"],
        min_value=stats["min_value"],
        max_value=stats["max_value"],
        histogram=[DescriptiveHistogramBin(**item) for item in stats["histogram"]],
    )


@router.get(
    "/statistics/descriptive/delivery-time",
    response_model=DeliveryTimeAnalysis,
)
def statistics_descriptive_delivery_time() -> DeliveryTimeAnalysis:
    stats = get_delivery_time_analysis(RAW_DATA_DIR)
    return DeliveryTimeAnalysis(
        avg_delivery_days=stats["avg_delivery_days"],
        avg_estimated_days=stats["avg_estimated_days"],
        std_delivery_days=stats["std_delivery_days"],
        late_delivery_percentage=stats["late_delivery_percentage"],
        histogram=[DeliveryHistogramBin(**item) for item in stats["histogram"]],
    )
