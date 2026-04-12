from pathlib import Path

import pandas as pd

from services.preprocessing import get_consolidated_dataset


def get_sales_monthly(data_dir: Path) -> pd.DataFrame:
    df = get_consolidated_dataset(data_dir)
    order_level = df.drop_duplicates(subset=["order_id"])

    result = (
        order_level.groupby("purchase_year_month", dropna=False, as_index=False)
        .agg(revenue=("order_payment_value", "sum"), orders=("order_id", "nunique"))
        .sort_values("purchase_year_month")
    )
    return result


def get_sales_by_state(data_dir: Path) -> pd.DataFrame:
    df = get_consolidated_dataset(data_dir)
    order_level = df.drop_duplicates(subset=["order_id"])

    result = (
        order_level.groupby("customer_state", dropna=False, as_index=False)
        .agg(revenue=("order_payment_value", "sum"), orders=("order_id", "nunique"))
        .sort_values("revenue", ascending=False)
    )
    return result


def get_sales_by_category(data_dir: Path) -> pd.DataFrame:
    df = get_consolidated_dataset(data_dir)

    result = (
        df.groupby("product_category_name_english", dropna=False, as_index=False)
        .agg(revenue=("total_item_value", "sum"), items=("order_item_id", "count"))
        .sort_values("revenue", ascending=False)
    )
    return result
