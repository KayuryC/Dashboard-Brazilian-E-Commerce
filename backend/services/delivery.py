from pathlib import Path

import numpy as np
import pandas as pd

from services.filters import DashboardFilters, apply_dashboard_filters
from services.preprocessing import get_consolidated_dataset


def get_delivery_performance(
    data_dir: Path,
    filters: DashboardFilters | None = None,
) -> pd.DataFrame:
    df = get_consolidated_dataset(data_dir)
    df = apply_dashboard_filters(df, filters)
    order_level = df.drop_duplicates(subset=["order_id"])

    return (
        order_level.groupby("customer_state", dropna=False, as_index=False)
        .agg(
            avg_delivery_days=("delivery_time_days", "mean"),
            avg_estimated_days=("estimated_delivery_time_days", "mean"),
            avg_delay_days=("delay_days", "mean"),
            late_rate=("is_late", "mean"),
            orders=("order_id", "nunique"),
        )
        .sort_values("avg_delay_days", ascending=False)
    )


def _safe_round(value: float) -> float:
    return round(float(value), 2)


def _build_empty_delivery_risk_response() -> dict[str, object]:
    return {
        "probability_late_delivery": 0.0,
        "probability_delivery_up_to_7_days": 0.0,
        "probability_delivery_up_to_14_days": 0.0,
        "probability_delivery_over_30_days": 0.0,
        "total_delivered_orders": 0,
        "event_probabilities": [],
        "cdf": [],
    }


def get_delivery_risk_analysis(
    data_dir: Path,
    filters: DashboardFilters | None = None,
    cdf_points: int = 24,
) -> dict[str, object]:
    dataframe = get_consolidated_dataset(data_dir)
    dataframe = apply_dashboard_filters(dataframe, filters)

    if dataframe.empty:
        return _build_empty_delivery_risk_response()

    order_level = dataframe.drop_duplicates(subset=["order_id"])
    if "order_delivered_customer_date" not in order_level.columns:
        return _build_empty_delivery_risk_response()

    delivered_orders = order_level[order_level["order_delivered_customer_date"].notna()].copy()
    if delivered_orders.empty:
        return _build_empty_delivery_risk_response()

    delivered_orders["delivery_time_days"] = pd.to_numeric(
        delivered_orders.get("delivery_time_days"),
        errors="coerce",
    )
    delivered_orders = delivered_orders.dropna(subset=["delivery_time_days"])
    delivered_orders = delivered_orders[delivered_orders["delivery_time_days"] >= 0]

    if delivered_orders.empty:
        return _build_empty_delivery_risk_response()

    if "is_late" in delivered_orders.columns:
        late_series = delivered_orders["is_late"].fillna(False).astype(bool)
    else:
        late_series = pd.Series(False, index=delivered_orders.index)

    total_delivered_orders = int(delivered_orders.shape[0])
    delivery_days = delivered_orders["delivery_time_days"]

    probability_late_delivery = _safe_round(late_series.mean() * 100)
    probability_delivery_up_to_7_days = _safe_round((delivery_days <= 7).mean() * 100)
    probability_delivery_up_to_14_days = _safe_round((delivery_days <= 14).mean() * 100)
    probability_delivery_over_30_days = _safe_round((delivery_days > 30).mean() * 100)

    event_probabilities = [
        {
            "event_key": "late_delivery",
            "label": "Atraso",
            "probability": probability_late_delivery,
            "count": int(late_series.sum()),
        },
        {
            "event_key": "delivery_up_to_7_days",
            "label": "Entrega ate 7 dias",
            "probability": probability_delivery_up_to_7_days,
            "count": int((delivery_days <= 7).sum()),
        },
        {
            "event_key": "delivery_up_to_14_days",
            "label": "Entrega ate 14 dias",
            "probability": probability_delivery_up_to_14_days,
            "count": int((delivery_days <= 14).sum()),
        },
        {
            "event_key": "delivery_over_30_days",
            "label": "Entrega acima de 30 dias",
            "probability": probability_delivery_over_30_days,
            "count": int((delivery_days > 30).sum()),
        },
    ]

    thresholds = np.linspace(
        float(delivery_days.min()),
        float(delivery_days.max()),
        num=max(8, int(cdf_points)),
    )
    cdf = [
        {
            "days": _safe_round(float(threshold)),
            "cumulative_probability": _safe_round(float((delivery_days <= threshold).mean() * 100)),
        }
        for threshold in thresholds
    ]

    return {
        "probability_late_delivery": probability_late_delivery,
        "probability_delivery_up_to_7_days": probability_delivery_up_to_7_days,
        "probability_delivery_up_to_14_days": probability_delivery_up_to_14_days,
        "probability_delivery_over_30_days": probability_delivery_over_30_days,
        "total_delivered_orders": total_delivered_orders,
        "event_probabilities": event_probabilities,
        "cdf": cdf,
    }


def get_delivery_time_analysis(
    data_dir: Path,
    bins: int = 10,
    filters: DashboardFilters | None = None,
) -> dict[str, object]:
    dataframe = get_consolidated_dataset(data_dir)
    dataframe = apply_dashboard_filters(dataframe, filters)

    if dataframe.empty:
        return {
            "avg_delivery_days": 0.0,
            "avg_estimated_days": 0.0,
            "std_delivery_days": 0.0,
            "late_delivery_percentage": 0.0,
            "histogram": [],
        }

    order_level = dataframe.drop_duplicates(subset=["order_id"])
    if "order_delivered_customer_date" not in order_level.columns:
        return {
            "avg_delivery_days": 0.0,
            "avg_estimated_days": 0.0,
            "std_delivery_days": 0.0,
            "late_delivery_percentage": 0.0,
            "histogram": [],
        }

    delivered_orders = order_level[order_level["order_delivered_customer_date"].notna()].copy()

    if delivered_orders.empty:
        return {
            "avg_delivery_days": 0.0,
            "avg_estimated_days": 0.0,
            "std_delivery_days": 0.0,
            "late_delivery_percentage": 0.0,
            "histogram": [],
        }

    delivery_days = pd.to_numeric(delivered_orders["delivery_time_days"], errors="coerce").dropna()
    estimated_days = pd.to_numeric(delivered_orders["estimated_delivery_time_days"], errors="coerce").dropna()

    if delivery_days.empty:
        return {
            "avg_delivery_days": 0.0,
            "avg_estimated_days": _safe_round(estimated_days.mean()) if not estimated_days.empty else 0.0,
            "std_delivery_days": 0.0,
            "late_delivery_percentage": 0.0,
            "histogram": [],
        }

    avg_delivery_days = _safe_round(delivery_days.mean())
    avg_estimated_days = _safe_round(estimated_days.mean()) if not estimated_days.empty else 0.0
    std_delivery_days = _safe_round(delivery_days.std(ddof=0))

    if "is_late" in delivered_orders.columns:
        late_delivery_percentage = _safe_round(delivered_orders["is_late"].fillna(False).mean() * 100)
    else:
        late_delivery_percentage = 0.0

    histogram_bins = max(5, min(20, int(bins)))
    counts, edges = np.histogram(delivery_days.to_numpy(), bins=histogram_bins)

    histogram: list[dict[str, object]] = []
    for index, count in enumerate(counts):
        start = _safe_round(edges[index])
        end = _safe_round(edges[index + 1])
        histogram.append(
            {
                "label": f"{start:.1f} - {end:.1f}",
                "min_days": start,
                "max_days": end,
                "count": int(count),
            }
        )

    return {
        "avg_delivery_days": avg_delivery_days,
        "avg_estimated_days": avg_estimated_days,
        "std_delivery_days": std_delivery_days,
        "late_delivery_percentage": late_delivery_percentage,
        "histogram": histogram,
    }
