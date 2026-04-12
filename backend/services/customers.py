from pathlib import Path

import pandas as pd

from services.preprocessing import get_consolidated_dataset


def get_customers_by_state(data_dir: Path) -> pd.DataFrame:
    df = get_consolidated_dataset(data_dir)
    order_level = df.drop_duplicates(subset=["order_id"])

    return (
        order_level.groupby("customer_state", dropna=False, as_index=False)
        .agg(customers=("customer_unique_id", "nunique"), orders=("order_id", "nunique"))
        .sort_values("customers", ascending=False)
    )
