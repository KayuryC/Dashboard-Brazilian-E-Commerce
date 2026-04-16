from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query

from app.config import RAW_DATA_DIR
from schemas.dashboard import (
    DatasetColumnProfile,
    DatasetDateRange,
    DatasetRawTableProfile,
    DatasetStudyResponse,
    DeliveryHistogramBin,
    DeliveryRiskAnalysis,
    DeliveryRiskCdfPoint,
    DeliveryRiskEventProbability,
    DeliveryTimeAnalysis,
    DeliveryMonthlyTrendPoint,
    DescriptiveHistogramBin,
    HealthResponse,
    HypothesisTestResult,
    ConfidenceIntervalResult,
    LinearRegressionModelResult,
    ModelingSummaryResponse,
    ModelingTrainTestValidationResult,
    PracticalRecommendation,
    RevenueForecastResult,
    OrdersByStatusPoint,
    OrderValueDescriptiveStats,
    OverviewMetrics,
    SalesByCategoryPoint,
    SalesByCityPoint,
    SalesByStatePoint,
    SalesMonthlyPoint,
    RelationshipsAnalysisResponse,
    RelationshipBoxplotGroup,
    RelationshipCorrelationHeatmapCell,
    RelationshipCorrelationMetrics,
    RelationshipScatterPoint,
    RelationshipStateBehaviorPoint,
    StatisticsSummaryResponse,
    TicketRangeDistributionPoint,
)
from services.dataset_study import get_dataset_study
from services.delivery import get_delivery_risk_analysis, get_delivery_time_analysis
from services.descriptive import get_order_value_descriptive_stats
from services.filters import DashboardFilters, get_dataset_date_range
from services.modeling import get_modeling_summary
from services.orders import get_orders_by_status
from services.overview import build_overview_metrics
from services.relationships import get_relationships_analysis
from services.sales import (
    get_sales_by_category,
    get_sales_by_city,
    get_sales_by_state,
    get_sales_monthly,
)
from services.summary import get_statistics_summary

router = APIRouter(prefix="/api/v1", tags=["dashboard"])


def _build_dashboard_filters(
    state: str | None = Query(default=None),
    city: str | None = Query(default=None),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
) -> DashboardFilters:
    min_date, max_date = get_dataset_date_range(RAW_DATA_DIR)

    if start_date is not None and end_date is not None and start_date > end_date:
        raise HTTPException(status_code=422, detail="start_date cannot be greater than end_date")

    if min_date is not None:
        if start_date is not None and start_date < min_date:
            raise HTTPException(status_code=422, detail=f"start_date must be on or after {min_date.isoformat()}")
        if end_date is not None and end_date < min_date:
            raise HTTPException(status_code=422, detail=f"end_date must be on or after {min_date.isoformat()}")

    if max_date is not None:
        if start_date is not None and start_date > max_date:
            raise HTTPException(status_code=422, detail=f"start_date must be on or before {max_date.isoformat()}")
        if end_date is not None and end_date > max_date:
            raise HTTPException(status_code=422, detail=f"end_date must be on or before {max_date.isoformat()}")

    return DashboardFilters(
        state=state,
        city=city,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/filters/date-range", response_model=DatasetDateRange)
def filters_date_range() -> DatasetDateRange:
    min_date, max_date = get_dataset_date_range(RAW_DATA_DIR)
    return DatasetDateRange(min_date=min_date, max_date=max_date)


@router.get("/metrics/overview", response_model=OverviewMetrics)
def metrics_overview(
    filters: DashboardFilters = Depends(_build_dashboard_filters),
) -> OverviewMetrics:
    return build_overview_metrics(RAW_DATA_DIR, filters)


@router.get("/statistics/summary", response_model=StatisticsSummaryResponse)
def statistics_summary(
    filters: DashboardFilters = Depends(_build_dashboard_filters),
    top_n: int = Query(default=10, ge=1, le=50),
) -> StatisticsSummaryResponse:
    summary = get_statistics_summary(RAW_DATA_DIR, filters=filters, top_n=top_n)
    return StatisticsSummaryResponse(**summary)


@router.get(
    "/statistics/dataset-study",
    response_model=DatasetStudyResponse,
)
def statistics_dataset_study() -> DatasetStudyResponse:
    profile = get_dataset_study(RAW_DATA_DIR)
    return DatasetStudyResponse(
        raw_tables=[DatasetRawTableProfile(**item) for item in profile["raw_tables"]],
        raw_total_rows=profile["raw_total_rows"],
        raw_total_columns=profile["raw_total_columns"],
        consolidated_rows=profile["consolidated_rows"],
        consolidated_columns=profile["consolidated_columns"],
        consolidated_unique_orders=profile["consolidated_unique_orders"],
        consolidated_unique_customers=profile["consolidated_unique_customers"],
        consolidated_missing_cells=profile["consolidated_missing_cells"],
        consolidated_missing_percentage=profile["consolidated_missing_percentage"],
        consolidated_memory_mb=profile["consolidated_memory_mb"],
        consolidated_columns_profile=[
            DatasetColumnProfile(**item) for item in profile["consolidated_columns_profile"]
        ],
    )


@router.get(
    "/modeling/summary",
    response_model=ModelingSummaryResponse,
)
def modeling_summary(
    filters: DashboardFilters = Depends(_build_dashboard_filters),
    forecast_horizon_months: int = Query(default=3, ge=1, le=12),
) -> ModelingSummaryResponse:
    summary = get_modeling_summary(
        RAW_DATA_DIR,
        filters=filters,
        forecast_horizon_months=forecast_horizon_months,
    )
    return ModelingSummaryResponse(
        linear_regression=LinearRegressionModelResult(**summary["linear_regression"]),
        revenue_forecast=RevenueForecastResult(**summary["revenue_forecast"]),
        train_test_validation=ModelingTrainTestValidationResult(**summary["train_test_validation"]),
        hypothesis_tests=[HypothesisTestResult(**item) for item in summary["hypothesis_tests"]],
        confidence_intervals=[ConfidenceIntervalResult(**item) for item in summary["confidence_intervals"]],
        practical_recommendations=[
            PracticalRecommendation(**item) for item in summary["practical_recommendations"]
        ],
        study_limitations=[str(item) for item in summary["study_limitations"]],
    )


@router.get("/orders/by-status", response_model=list[OrdersByStatusPoint])
def orders_by_status(
    filters: DashboardFilters = Depends(_build_dashboard_filters),
) -> list[OrdersByStatusPoint]:
    dataframe = get_orders_by_status(RAW_DATA_DIR, filters)
    return [OrdersByStatusPoint(**record) for record in dataframe.to_dict(orient="records")]


@router.get("/sales/monthly", response_model=list[SalesMonthlyPoint])
def sales_monthly(
    filters: DashboardFilters = Depends(_build_dashboard_filters),
) -> list[SalesMonthlyPoint]:
    dataframe = get_sales_monthly(RAW_DATA_DIR, filters)
    return [SalesMonthlyPoint(**record) for record in dataframe.to_dict(orient="records")]


@router.get("/sales/by-state", response_model=list[SalesByStatePoint])
def sales_by_state(
    filters: DashboardFilters = Depends(_build_dashboard_filters),
) -> list[SalesByStatePoint]:
    dataframe = get_sales_by_state(RAW_DATA_DIR, filters)
    return [SalesByStatePoint(**record) for record in dataframe.to_dict(orient="records")]


@router.get("/sales/by-city", response_model=list[SalesByCityPoint])
def sales_by_city(
    filters: DashboardFilters = Depends(_build_dashboard_filters),
) -> list[SalesByCityPoint]:
    dataframe = get_sales_by_city(RAW_DATA_DIR, filters)
    return [SalesByCityPoint(**record) for record in dataframe.to_dict(orient="records")]


@router.get("/sales/by-category", response_model=list[SalesByCategoryPoint])
def sales_by_category(
    filters: DashboardFilters = Depends(_build_dashboard_filters),
) -> list[SalesByCategoryPoint]:
    dataframe = get_sales_by_category(RAW_DATA_DIR, filters)
    return [SalesByCategoryPoint(**record) for record in dataframe.to_dict(orient="records")]


@router.get(
    "/statistics/descriptive/order-values",
    response_model=OrderValueDescriptiveStats,
)
def statistics_descriptive_order_values(
    filters: DashboardFilters = Depends(_build_dashboard_filters),
) -> OrderValueDescriptiveStats:
    stats = get_order_value_descriptive_stats(RAW_DATA_DIR, filters=filters)
    return OrderValueDescriptiveStats(
        mean_value=stats["mean_value"],
        median_value=stats["median_value"],
        std_dev_value=stats["std_dev_value"],
        min_value=stats["min_value"],
        q1_value=stats["q1_value"],
        q3_value=stats["q3_value"],
        iqr_value=stats["iqr_value"],
        max_value=stats["max_value"],
        histogram=[DescriptiveHistogramBin(**item) for item in stats["histogram"]],
        ticket_range_distribution=[TicketRangeDistributionPoint(**item) for item in stats["ticket_range_distribution"]],
    )


@router.get(
    "/statistics/descriptive/delivery-time",
    response_model=DeliveryTimeAnalysis,
)
def statistics_descriptive_delivery_time(
    filters: DashboardFilters = Depends(_build_dashboard_filters),
) -> DeliveryTimeAnalysis:
    stats = get_delivery_time_analysis(RAW_DATA_DIR, filters=filters)
    return DeliveryTimeAnalysis(
        avg_delivery_days=stats["avg_delivery_days"],
        avg_estimated_days=stats["avg_estimated_days"],
        std_delivery_days=stats["std_delivery_days"],
        late_delivery_percentage=stats["late_delivery_percentage"],
        histogram=[DeliveryHistogramBin(**item) for item in stats["histogram"]],
        monthly_trend=[DeliveryMonthlyTrendPoint(**item) for item in stats["monthly_trend"]],
    )


@router.get(
    "/statistics/probability/delivery-risk",
    response_model=DeliveryRiskAnalysis,
)
def statistics_probability_delivery_risk(
    filters: DashboardFilters = Depends(_build_dashboard_filters),
) -> DeliveryRiskAnalysis:
    stats = get_delivery_risk_analysis(RAW_DATA_DIR, filters=filters)
    return DeliveryRiskAnalysis(
        probability_late_delivery=stats["probability_late_delivery"],
        probability_delivery_up_to_7_days=stats["probability_delivery_up_to_7_days"],
        probability_delivery_up_to_14_days=stats["probability_delivery_up_to_14_days"],
        probability_delivery_over_30_days=stats["probability_delivery_over_30_days"],
        total_delivered_orders=stats["total_delivered_orders"],
        event_probabilities=[DeliveryRiskEventProbability(**item) for item in stats["event_probabilities"]],
        cdf=[DeliveryRiskCdfPoint(**item) for item in stats["cdf"]],
    )


@router.get(
    "/statistics/relationships",
    response_model=RelationshipsAnalysisResponse,
)
def statistics_relationships(
    filters: DashboardFilters = Depends(_build_dashboard_filters),
) -> RelationshipsAnalysisResponse:
    stats = get_relationships_analysis(RAW_DATA_DIR, filters=filters)
    return RelationshipsAnalysisResponse(
        correlations=RelationshipCorrelationMetrics(**stats["correlations"]),
        scatter=[RelationshipScatterPoint(**item) for item in stats["scatter"]],
        review_score_by_delivery_status=[
            RelationshipBoxplotGroup(**item) for item in stats["review_score_by_delivery_status"]
        ],
        top_states_behavior=[RelationshipStateBehaviorPoint(**item) for item in stats["top_states_behavior"]],
        correlation_matrix=[RelationshipCorrelationHeatmapCell(**item) for item in stats["correlation_matrix"]],
    )
