from pathlib import Path

import pandas as pd

from services.preprocessing import get_consolidated_dataset


def get_review_score_distribution(data_dir: Path) -> pd.DataFrame:
    df = get_consolidated_dataset(data_dir)
    order_level = df.drop_duplicates(subset=["order_id"])

    return (
        order_level.groupby("review_score", dropna=False, as_index=False)
        .agg(orders=("order_id", "nunique"))
        .sort_values("review_score")
    )


def get_reviews_by_delivery_delay(data_dir: Path) -> pd.DataFrame:
    df = get_consolidated_dataset(data_dir)
    order_level = df.drop_duplicates(subset=["order_id"])

    delayed = order_level[order_level["is_late"].notna()].copy()
    delayed["is_late"] = delayed["is_late"].astype(bool)

    return (
        delayed.groupby("is_late", as_index=False)
        .agg(avg_review_score=("review_score", "mean"), orders=("order_id", "nunique"))
        .sort_values("is_late")
    )
