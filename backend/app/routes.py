from fastapi import APIRouter

from app.config import RAW_DATA_DIR
from schemas.dashboard import HealthResponse, OverviewMetrics
from services.analytics import build_overview_metrics

router = APIRouter(prefix="/api/v1", tags=["dashboard"])


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/metrics/overview", response_model=OverviewMetrics)
def metrics_overview() -> OverviewMetrics:
    return build_overview_metrics(RAW_DATA_DIR)
