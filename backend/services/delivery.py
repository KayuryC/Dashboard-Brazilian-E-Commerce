from pathlib import Path

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
