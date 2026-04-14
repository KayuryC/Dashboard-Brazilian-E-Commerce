from pathlib import Path

import pandas as pd

from schemas.dashboard import OverviewMetrics
from services.filters import (
    DashboardFilters,
    apply_dashboard_filters,
    normalize_city_label,
    normalize_city_text,
    normalize_state_text,
)
from services.orders import STATUS_TRANSLATION
from services.preprocessing import get_consolidated_dataset


def _build_status_breakdown(order_level: pd.DataFrame) -> dict[str, int]:
    if "order_status" not in order_level.columns:
        return {}

    status = order_level["order_status"].fillna("unknown").astype("string")
    return {
        str(key): int(value)
        for key, value in status.value_counts(dropna=False, sort=True).sort_values(ascending=False).items()
    }


def _build_overview_metrics(order_level: pd.DataFrame) -> OverviewMetrics:
    if order_level.empty:
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

    total_orders = int(order_level["order_id"].nunique())

    customer_col = "customer_unique_id" if "customer_unique_id" in order_level.columns else "customer_id"
    total_customers = int(order_level[customer_col].nunique()) if customer_col in order_level.columns else 0

    payment_col = "order_payment_value" if "order_payment_value" in order_level.columns else "total_item_value"
    total_revenue = float(order_level[payment_col].fillna(0).sum()) if payment_col in order_level.columns else 0.0
    average_ticket = float(total_revenue / total_orders) if total_orders else 0.0

    review_col = "review_score"
    average_review_score = (
        float(order_level[review_col].dropna().mean()) if review_col in order_level.columns else 0.0
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


def _build_orders_by_status(order_level: pd.DataFrame) -> list[dict[str, object]]:
    if order_level.empty or "order_status" not in order_level.columns:
        return []

    result = (
        order_level.groupby("order_status", dropna=False, as_index=False)
        .agg(value=("order_id", "nunique"))
        .sort_values("value", ascending=False)
    )
    result["status"] = result["order_status"].fillna("unknown").astype(str).str.strip().str.lower()
    result["value"] = result["value"].fillna(0).astype(int)
    result["label"] = result["status"].map(lambda status: STATUS_TRANSLATION.get(status, status))

    return result[["status", "label", "value"]].to_dict(orient="records")


def _build_sales_monthly(order_level: pd.DataFrame) -> list[dict[str, object]]:
    if order_level.empty:
        return []

    revenue_column = "order_payment_value" if "order_payment_value" in order_level.columns else "total_item_value"

    result = (
        order_level.groupby("purchase_year_month", dropna=False, as_index=False)
        .agg(revenue=(revenue_column, "sum"), orders=("order_id", "nunique"))
        .sort_values("purchase_year_month")
    )
    result["purchase_year_month"] = result["purchase_year_month"].fillna("unknown").astype(str)
    result["revenue"] = result["revenue"].fillna(0).astype(float).round(2)
    result["orders"] = result["orders"].fillna(0).astype(int)

    return result.to_dict(orient="records")


def _build_sales_by_state(order_level: pd.DataFrame) -> list[dict[str, object]]:
    if order_level.empty:
        return []

    revenue_column = "order_payment_value" if "order_payment_value" in order_level.columns else "total_item_value"
    normalized = order_level.copy()
    normalized["customer_state"] = (
        normalized["customer_state"].fillna("unknown").astype(str).map(normalize_state_text).fillna("unknown")
    )

    result = (
        normalized.groupby("customer_state", dropna=False, as_index=False)
        .agg(revenue=(revenue_column, "sum"), orders=("order_id", "nunique"))
        .sort_values("revenue", ascending=False)
    )
    result["customer_state"] = result["customer_state"].fillna("unknown").astype(str).str.upper()
    result["revenue"] = result["revenue"].fillna(0).astype(float).round(2)
    result["orders"] = result["orders"].fillna(0).astype(int)

    return result.to_dict(orient="records")


def _build_sales_by_category(dataframe: pd.DataFrame) -> list[dict[str, object]]:
    if dataframe.empty:
        return []

    result = (
        dataframe.groupby("product_category_name_english", dropna=False, as_index=False)
        .agg(revenue=("total_item_value", "sum"), items=("order_item_id", "count"))
        .sort_values("revenue", ascending=False)
    )
    result["product_category_name_english"] = (
        result["product_category_name_english"].fillna("unknown").astype(str)
    )
    result["revenue"] = result["revenue"].fillna(0).astype(float).round(2)
    result["items"] = result["items"].fillna(0).astype(int)

    return result.to_dict(orient="records")


def _build_city_metrics(order_level: pd.DataFrame) -> pd.DataFrame:
    if order_level.empty:
        return pd.DataFrame(columns=["customer_city", "revenue", "orders"])

    revenue_column = "order_payment_value" if "order_payment_value" in order_level.columns else "total_item_value"
    normalized = order_level.copy()
    normalized["customer_city_label"] = normalized["customer_city"].map(normalize_city_label)
    normalized["customer_city_key"] = normalized["customer_city"].map(normalize_city_text)
    normalized = normalized[normalized["customer_city_key"].notna()]

    if normalized.empty:
        return pd.DataFrame(columns=["customer_city", "revenue", "orders"])

    city_labels = (
        normalized.groupby("customer_city_key", dropna=False)["customer_city_label"]
        .agg(lambda series: series.mode().iat[0] if not series.mode().empty else series.iloc[0])
        .rename("customer_city")
        .reset_index()
    )

    city_metrics = (
        normalized.groupby("customer_city_key", dropna=False, as_index=False)
        .agg(revenue=(revenue_column, "sum"), orders=("order_id", "nunique"))
    )

    result = city_metrics.merge(city_labels, on="customer_city_key", how="left")
    result = result.drop(columns=["customer_city_key"])
    result["customer_city"] = result["customer_city"].fillna("Unknown").astype(str).str.strip().str.title()
    result["revenue"] = result["revenue"].fillna(0).astype(float).round(2)
    result["orders"] = result["orders"].fillna(0).astype(int)

    return result


def get_statistics_summary(
    data_dir: Path,
    filters: DashboardFilters | None = None,
    top_n: int = 10,
) -> dict[str, object]:
    top_n = max(1, int(top_n))

    dataframe = get_consolidated_dataset(data_dir)
    dataframe = apply_dashboard_filters(dataframe, filters)

    order_level = dataframe.drop_duplicates(subset=["order_id"]) if not dataframe.empty else dataframe

    overview = _build_overview_metrics(order_level)
    orders_by_status = _build_orders_by_status(order_level)
    sales_monthly = _build_sales_monthly(order_level)
    sales_by_state = _build_sales_by_state(order_level)
    sales_by_category = _build_sales_by_category(dataframe)

    city_metrics = _build_city_metrics(order_level)
    top_cities_by_revenue = (
        city_metrics.sort_values(["revenue", "orders"], ascending=[False, False])
        .head(top_n)
        .to_dict(orient="records")
    )
    top_city_by_orders_df = city_metrics.sort_values(["orders", "revenue"], ascending=[False, False]).head(1)
    top_city_by_orders = (
        top_city_by_orders_df.to_dict(orient="records")[0] if not top_city_by_orders_df.empty else None
    )

    return {
        "overview": overview,
        "orders_by_status": orders_by_status,
        "sales_monthly": sales_monthly,
        "sales_by_state": sales_by_state,
        "sales_by_category": sales_by_category,
        "top_cities_by_revenue": top_cities_by_revenue,
        "top_city_by_orders": top_city_by_orders,
    }
