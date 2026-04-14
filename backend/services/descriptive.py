from pathlib import Path

import numpy as np
import pandas as pd

from services.filters import DashboardFilters, apply_dashboard_filters
from services.preprocessing import get_consolidated_dataset


def _safe_round(value: float) -> float:
    return round(float(value), 2)


def _build_ticket_range_distribution(order_values: pd.Series) -> list[dict[str, object]]:
    band_definitions = [
        {"label": "R$ 0 a R$ 100", "min_value": 0.0, "max_value": 100.0},
        {"label": "R$ 100 a R$ 300", "min_value": 100.0, "max_value": 300.0},
        {"label": "R$ 300 a R$ 1.000", "min_value": 300.0, "max_value": 1000.0},
        {"label": "R$ 1.000+", "min_value": 1000.0, "max_value": None},
    ]

    total_orders = int(order_values.shape[0])
    total_revenue = float(order_values.sum())
    distribution: list[dict[str, object]] = []

    for index, band in enumerate(band_definitions):
        band_min = float(band["min_value"])
        band_max = band["max_value"]

        if band_max is None:
            mask = order_values >= band_min
        elif index == 0:
            mask = (order_values >= band_min) & (order_values <= float(band_max))
        else:
            mask = (order_values > band_min) & (order_values <= float(band_max))

        band_values = order_values[mask]
        orders_count = int(band_values.shape[0])
        band_revenue = float(band_values.sum())

        distribution.append(
            {
                "label": str(band["label"]),
                "min_value": band_min,
                "max_value": float(band_max) if band_max is not None else None,
                "orders_count": orders_count,
                "orders_percentage": _safe_round((orders_count / total_orders) * 100) if total_orders else 0.0,
                "revenue": _safe_round(band_revenue),
                "revenue_percentage": _safe_round((band_revenue / total_revenue) * 100) if total_revenue else 0.0,
            }
        )

    return distribution


def get_order_value_descriptive_stats(
    data_dir: Path,
    bins: int = 10,
    filters: DashboardFilters | None = None,
) -> dict[str, object]:
    dataframe = get_consolidated_dataset(data_dir)
    dataframe = apply_dashboard_filters(dataframe, filters)

    if dataframe.empty:
        return {
            "mean_value": 0.0,
            "median_value": 0.0,
            "std_dev_value": 0.0,
            "min_value": 0.0,
            "q1_value": 0.0,
            "q3_value": 0.0,
            "iqr_value": 0.0,
            "max_value": 0.0,
            "histogram": [],
            "ticket_range_distribution": [],
        }

    order_level = dataframe.drop_duplicates(subset=["order_id"])
    value_column = "order_payment_value" if "order_payment_value" in order_level.columns else "total_item_value"

    order_values = pd.to_numeric(order_level[value_column], errors="coerce").dropna()

    if order_values.empty:
        return {
            "mean_value": 0.0,
            "median_value": 0.0,
            "std_dev_value": 0.0,
            "min_value": 0.0,
            "q1_value": 0.0,
            "q3_value": 0.0,
            "iqr_value": 0.0,
            "max_value": 0.0,
            "histogram": [],
            "ticket_range_distribution": [],
        }

    mean_value = _safe_round(order_values.mean())
    median_value = _safe_round(order_values.median())
    std_dev_value = _safe_round(order_values.std(ddof=0))
    min_value = _safe_round(order_values.min())
    q1_value = _safe_round(order_values.quantile(0.25))
    q3_value = _safe_round(order_values.quantile(0.75))
    iqr_value = _safe_round(q3_value - q1_value)
    max_value = _safe_round(order_values.max())

    histogram: list[dict[str, object]] = []
    histogram_bins = max(5, min(20, int(bins)))

    counts, edges = np.histogram(order_values.to_numpy(), bins=histogram_bins)
    for index, count in enumerate(counts):
        start = _safe_round(edges[index])
        end = _safe_round(edges[index + 1])
        histogram.append(
            {
                "label": f"{start:.0f}-{end:.0f}",
                "min_value": start,
                "max_value": end,
                "count": int(count),
            }
        )

    ticket_range_distribution = _build_ticket_range_distribution(order_values)

    return {
        "mean_value": mean_value,
        "median_value": median_value,
        "std_dev_value": std_dev_value,
        "min_value": min_value,
        "q1_value": q1_value,
        "q3_value": q3_value,
        "iqr_value": iqr_value,
        "max_value": max_value,
        "histogram": histogram,
        "ticket_range_distribution": ticket_range_distribution,
    }
