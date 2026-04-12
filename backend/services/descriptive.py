from pathlib import Path

import numpy as np
import pandas as pd

from services.preprocessing import get_consolidated_dataset


def _safe_round(value: float) -> float:
    return round(float(value), 2)


def get_order_value_descriptive_stats(data_dir: Path, bins: int = 10) -> dict[str, object]:
    dataframe = get_consolidated_dataset(data_dir)

    if dataframe.empty:
        return {
            "mean_value": 0.0,
            "median_value": 0.0,
            "std_dev_value": 0.0,
            "min_value": 0.0,
            "max_value": 0.0,
            "histogram": [],
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
            "max_value": 0.0,
            "histogram": [],
        }

    mean_value = _safe_round(order_values.mean())
    median_value = _safe_round(order_values.median())
    std_dev_value = _safe_round(order_values.std(ddof=0))
    min_value = _safe_round(order_values.min())
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

    return {
        "mean_value": mean_value,
        "median_value": median_value,
        "std_dev_value": std_dev_value,
        "min_value": min_value,
        "max_value": max_value,
        "histogram": histogram,
    }
