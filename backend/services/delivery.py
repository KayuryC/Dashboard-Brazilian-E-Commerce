from pathlib import Path

import numpy as np
import pandas as pd

from services.preprocessing import get_consolidated_dataset


def get_delivery_performance(data_dir: Path) -> pd.DataFrame:
    df = get_consolidated_dataset(data_dir)
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


def get_delivery_time_analysis(data_dir: Path, bins: int = 10) -> dict[str, object]:
    dataframe = get_consolidated_dataset(data_dir)

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
