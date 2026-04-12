from pathlib import Path

import pandas as pd

from services.preprocessing import get_consolidated_dataset


def get_orders_by_status(data_dir: Path) -> pd.DataFrame:
    df = get_consolidated_dataset(data_dir)
    order_level = df.drop_duplicates(subset=["order_id"])

    result = (
        order_level.groupby("order_status", dropna=False, as_index=False)
        .agg(orders=("order_id", "nunique"))
        .sort_values("orders", ascending=False)
    )
    result["order_status"] = result["order_status"].fillna("unknown").astype(str)
    result["orders"] = result["orders"].fillna(0).astype(int)
    return result
