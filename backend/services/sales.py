from pathlib import Path

import pandas as pd

from services.filters import (
    DashboardFilters,
    apply_dashboard_filters,
    normalize_city_label,
    normalize_city_text,
    normalize_state_text,
)
from services.preprocessing import get_consolidated_dataset


def get_sales_monthly(
    data_dir: Path,
    filters: DashboardFilters | None = None,
) -> pd.DataFrame:
    df = get_consolidated_dataset(data_dir)
    df = apply_dashboard_filters(df, filters)
    order_level = df.drop_duplicates(subset=["order_id"])
    revenue_column = "order_payment_value" if "order_payment_value" in order_level.columns else "total_item_value"

    result = (
        order_level.groupby("purchase_year_month", dropna=False, as_index=False)
        .agg(revenue=(revenue_column, "sum"), orders=("order_id", "nunique"))
        .sort_values("purchase_year_month")
    )
    result["purchase_year_month"] = result["purchase_year_month"].fillna("unknown").astype(str)
    result["revenue"] = result["revenue"].fillna(0).astype(float).round(2)
    result["orders"] = result["orders"].fillna(0).astype(int)
    return result


def get_sales_by_state(
    data_dir: Path,
    filters: DashboardFilters | None = None,
) -> pd.DataFrame:
    df = get_consolidated_dataset(data_dir)
    df = apply_dashboard_filters(df, filters)
    order_level = df.drop_duplicates(subset=["order_id"]).copy()
    order_level["customer_state"] = (
        order_level["customer_state"].fillna("unknown").astype(str).map(normalize_state_text).fillna("unknown")
    )
    revenue_column = "order_payment_value" if "order_payment_value" in order_level.columns else "total_item_value"

    result = (
        order_level.groupby("customer_state", dropna=False, as_index=False)
        .agg(revenue=(revenue_column, "sum"), orders=("order_id", "nunique"))
        .sort_values("revenue", ascending=False)
    )
    result["customer_state"] = result["customer_state"].fillna("unknown").astype(str).str.upper()
    result["revenue"] = result["revenue"].fillna(0).astype(float).round(2)
    result["orders"] = result["orders"].fillna(0).astype(int)
    return result


def get_sales_by_city(
    data_dir: Path,
    filters: DashboardFilters | None = None,
) -> pd.DataFrame:
    df = get_consolidated_dataset(data_dir)
    df = apply_dashboard_filters(df, filters)
    order_level = df.drop_duplicates(subset=["order_id"]).copy()
    revenue_column = "order_payment_value" if "order_payment_value" in order_level.columns else "total_item_value"

    order_level["customer_city_label"] = order_level["customer_city"].map(normalize_city_label)
    order_level["customer_city_key"] = order_level["customer_city"].map(normalize_city_text)
    order_level = order_level[order_level["customer_city_key"].notna()]

    city_labels = (
        order_level.groupby("customer_city_key", dropna=False)["customer_city_label"]
        .agg(lambda series: series.mode().iat[0] if not series.mode().empty else series.iloc[0])
        .rename("customer_city")
        .reset_index()
    )

    city_metrics = (
        order_level.groupby("customer_city_key", dropna=False, as_index=False)
        .agg(revenue=(revenue_column, "sum"), orders=("order_id", "nunique"))
        .sort_values("revenue", ascending=False)
    )

    result = city_metrics.merge(city_labels, on="customer_city_key", how="left")
    result = result.drop(columns=["customer_city_key"]).sort_values("revenue", ascending=False)
    result["customer_city"] = (
        result["customer_city"].fillna("Unknown").astype(str).str.strip().str.title()
    )
    result["revenue"] = result["revenue"].fillna(0).astype(float).round(2)
    result["orders"] = result["orders"].fillna(0).astype(int)
    return result


def get_sales_by_category(
    data_dir: Path,
    filters: DashboardFilters | None = None,
) -> pd.DataFrame:
    df = get_consolidated_dataset(data_dir)
    df = apply_dashboard_filters(df, filters)

    result = (
        df.groupby("product_category_name_english", dropna=False, as_index=False)
        .agg(revenue=("total_item_value", "sum"), items=("order_item_id", "count"))
        .sort_values("revenue", ascending=False)
    )
    result["product_category_name_english"] = (
        result["product_category_name_english"].fillna("unknown").astype(str)
    )
    result["revenue"] = result["revenue"].fillna(0).astype(float).round(2)
    result["items"] = result["items"].fillna(0).astype(int)
    return result
