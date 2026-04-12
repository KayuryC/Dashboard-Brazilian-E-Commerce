from functools import lru_cache
from pathlib import Path

import pandas as pd

from services.data_loader import RawDatasets, load_raw_datasets, standardize_base_types

ORDER_DATETIME_COLUMNS = [
    "order_purchase_timestamp",
    "order_approved_at",
    "order_delivered_carrier_date",
    "order_delivered_customer_date",
    "order_estimated_delivery_date",
]

ORDER_ITEM_DATETIME_COLUMNS = ["shipping_limit_date"]
REVIEW_DATETIME_COLUMNS = ["review_creation_date", "review_answer_timestamp"]

SECONDS_PER_DAY = 60 * 60 * 24


def _to_datetime(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    for column in columns:
        if column in df.columns:
            df[column] = pd.to_datetime(df[column], errors="coerce")
    return df


def _build_reviews_agg(reviews: pd.DataFrame) -> pd.DataFrame:
    if reviews.empty:
        return pd.DataFrame(columns=["order_id", "review_score", "review_count"])

    agg = (
        reviews.groupby("order_id", as_index=False)
        .agg(
            review_score=("review_score", "mean"),
            review_count=("review_id", "nunique"),
        )
        .reset_index(drop=True)
    )
    return agg


def _build_payments_agg(payments: pd.DataFrame) -> pd.DataFrame:
    if payments.empty:
        return pd.DataFrame(
            columns=[
                "order_id",
                "order_payment_value",
                "payment_installments_max",
                "payment_sequential_count",
                "payment_type_main",
            ]
        )

    payment_type_main = (
        payments.groupby("order_id")["payment_type"]
        .agg(lambda series: series.mode().iat[0] if not series.mode().empty else pd.NA)
        .rename("payment_type_main")
        .reset_index()
    )

    agg = (
        payments.groupby("order_id", as_index=False)
        .agg(
            order_payment_value=("payment_value", "sum"),
            payment_installments_max=("payment_installments", "max"),
            payment_sequential_count=("payment_sequential", "max"),
        )
        .merge(payment_type_main, on="order_id", how="left")
    )
    return agg


def _build_products_with_translation(
    products: pd.DataFrame,
    category_translation: pd.DataFrame,
) -> pd.DataFrame:
    products_with_translation = products.merge(
        category_translation,
        on="product_category_name",
        how="left",
    )

    if "product_category_name_english" not in products_with_translation.columns:
        products_with_translation["product_category_name_english"] = pd.NA

    products_with_translation["product_category_name_english"] = (
        products_with_translation["product_category_name_english"]
        .fillna(products_with_translation.get("product_category_name"))
        .fillna("unknown")
    )

    return products_with_translation


def _add_derived_columns(merged_df: pd.DataFrame) -> pd.DataFrame:
    df = merged_df.copy()

    df["price"] = pd.to_numeric(df.get("price"), errors="coerce").fillna(0)
    df["freight_value"] = pd.to_numeric(df.get("freight_value"), errors="coerce").fillna(0)

    df["total_item_value"] = df["price"] + df["freight_value"]

    purchase_ts = df.get("order_purchase_timestamp")
    delivered_ts = df.get("order_delivered_customer_date")
    estimated_ts = df.get("order_estimated_delivery_date")

    if purchase_ts is not None:
        df["purchase_year"] = purchase_ts.dt.year.astype("Int64")
        df["purchase_month"] = purchase_ts.dt.month.astype("Int64")
        purchase_period = purchase_ts.dt.to_period("M")
        df["purchase_year_month"] = purchase_period.astype("string")
    else:
        df["purchase_year"] = pd.Series(pd.NA, index=df.index, dtype="Int64")
        df["purchase_month"] = pd.Series(pd.NA, index=df.index, dtype="Int64")
        df["purchase_year_month"] = pd.Series(pd.NA, index=df.index, dtype="string")

    if purchase_ts is not None and delivered_ts is not None:
        df["delivery_time_days"] = (delivered_ts - purchase_ts).dt.total_seconds() / SECONDS_PER_DAY
    else:
        df["delivery_time_days"] = pd.NA

    if purchase_ts is not None and estimated_ts is not None:
        df["estimated_delivery_time_days"] = (
            (estimated_ts - purchase_ts).dt.total_seconds() / SECONDS_PER_DAY
        )
    else:
        df["estimated_delivery_time_days"] = pd.NA

    if delivered_ts is not None and estimated_ts is not None:
        df["delay_days"] = (delivered_ts - estimated_ts).dt.total_seconds() / SECONDS_PER_DAY
    else:
        df["delay_days"] = pd.NA

    df["is_late"] = pd.Series(pd.NA, index=df.index, dtype="boolean")
    if "order_delivered_customer_date" in df.columns:
        delivered_mask = df["order_delivered_customer_date"].notna()
        df.loc[delivered_mask, "is_late"] = df.loc[delivered_mask, "delay_days"] > 0

    return df


def build_consolidated_dataset(raw_datasets: RawDatasets) -> pd.DataFrame:
    datasets = standardize_base_types(raw_datasets)

    orders = _to_datetime(datasets["orders"], ORDER_DATETIME_COLUMNS)
    order_items = _to_datetime(datasets["order_items"], ORDER_ITEM_DATETIME_COLUMNS)
    customers = datasets["customers"]
    products = datasets["products"]
    reviews = _to_datetime(datasets["reviews"], REVIEW_DATETIME_COLUMNS)
    payments = datasets["payments"]
    category_translation = datasets["category_translation"]

    products_with_translation = _build_products_with_translation(products, category_translation)
    reviews_agg = _build_reviews_agg(reviews)
    payments_agg = _build_payments_agg(payments)

    merged_df = orders.merge(order_items, on="order_id", how="left")
    merged_df = merged_df.merge(customers, on="customer_id", how="left")
    merged_df = merged_df.merge(products_with_translation, on="product_id", how="left")
    merged_df = merged_df.merge(reviews_agg, on="order_id", how="left")
    merged_df = merged_df.merge(payments_agg, on="order_id", how="left")

    return _add_derived_columns(merged_df)


@lru_cache(maxsize=2)
def _get_cached_dataset(data_dir_as_string: str) -> pd.DataFrame:
    raw_datasets = load_raw_datasets(Path(data_dir_as_string))
    return build_consolidated_dataset(raw_datasets)


def get_consolidated_dataset(data_dir: Path, refresh: bool = False) -> pd.DataFrame:
    if refresh:
        _get_cached_dataset.cache_clear()

    return _get_cached_dataset(str(data_dir)).copy()
