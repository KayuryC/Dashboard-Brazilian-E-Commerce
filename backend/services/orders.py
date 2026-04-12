from pathlib import Path

import pandas as pd

from services.preprocessing import get_consolidated_dataset


def get_orders_by_status(data_dir: Path) -> pd.DataFrame:
    df = get_consolidated_dataset(data_dir)
    order_level = df.drop_duplicates(subset=["order_id"])

    return (
        order_level.groupby("order_status", dropna=False, as_index=False)
        .agg(orders=("order_id", "nunique"))
        .sort_values("orders", ascending=False)
    )
