from pathlib import Path

import pandas as pd

from schemas.dashboard import OverviewMetrics
from services.filters import DashboardFilters, apply_dashboard_filters
from services.preprocessing import get_consolidated_dataset


def _build_status_breakdown(order_level: pd.DataFrame) -> dict[str, int]:
    if "order_status" not in order_level.columns:
        return {}

    status = order_level["order_status"].fillna("unknown").astype("string")
    return {
        str(key): int(value)
        for key, value in status.value_counts(dropna=False, sort=True).sort_values(ascending=False).items()
    }


def build_overview_metrics(
    data_dir: Path,
    filters: DashboardFilters | None = None,
) -> OverviewMetrics:
    consolidated_df = get_consolidated_dataset(data_dir)
    consolidated_df = apply_dashboard_filters(consolidated_df, filters)

    if consolidated_df.empty:
        return OverviewMetrics(
            total_orders=0,
            total_customers=0,
            total_revenue=0.0,
            average_ticket=0.0,
            average_review_score=0.0,
            late_delivery_percentage=0.0,
            delivered_orders=0,
            canceled_orders=0,
            status_breakdown={},
        )

    order_level = consolidated_df.drop_duplicates(subset=["order_id"])

    total_orders = int(order_level["order_id"].nunique())

    customer_col = (
        "customer_unique_id"
        if "customer_unique_id" in order_level.columns
        else "customer_id"
    )
    total_customers = int(order_level[customer_col].nunique()) if customer_col in order_level else 0

    payment_col = "order_payment_value" if "order_payment_value" in order_level.columns else "total_item_value"
    total_revenue = float(order_level[payment_col].fillna(0).sum()) if payment_col in order_level else 0.0
    average_ticket = float(total_revenue / total_orders) if total_orders else 0.0

    review_col = "review_score"
    average_review_score = (
        float(order_level[review_col].dropna().mean()) if review_col in order_level else 0.0
    )

    delivered_mask = (
        order_level["order_delivered_customer_date"].notna()
        if "order_delivered_customer_date" in order_level.columns
        else pd.Series(False, index=order_level.index)
    )
    if delivered_mask.any() and "is_late" in order_level.columns:
        late_delivery_percentage = float(
            order_level.loc[delivered_mask, "is_late"].fillna(False).mean() * 100
        )
    else:
        late_delivery_percentage = 0.0

    status_breakdown = _build_status_breakdown(order_level)
    if "order_status" in order_level.columns:
        delivered_orders = int((order_level["order_status"] == "delivered").sum())
        canceled_orders = int(order_level["order_status"].isin(["canceled", "cancelled"]).sum())
    else:
        delivered_orders = 0
        canceled_orders = 0

    return OverviewMetrics(
        total_orders=total_orders,
        total_customers=total_customers,
        total_revenue=round(total_revenue, 2),
        average_ticket=round(average_ticket, 2),
        average_review_score=round(average_review_score, 2),
        late_delivery_percentage=round(late_delivery_percentage, 2),
        delivered_orders=delivered_orders,
        canceled_orders=canceled_orders,
        status_breakdown=status_breakdown,
    )
