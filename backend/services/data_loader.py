from pathlib import Path

import pandas as pd

REQUIRED_DATASETS: dict[str, str] = {
    "orders": "olist_orders_dataset.csv",
    "order_items": "olist_order_items_dataset.csv",
    "customers": "olist_customers_dataset.csv",
    "products": "olist_products_dataset.csv",
    "reviews": "olist_order_reviews_dataset.csv",
    "payments": "olist_order_payments_dataset.csv",
    "category_translation": "product_category_name_translation.csv",
}

ID_COLUMNS_BY_DATASET: dict[str, list[str]] = {
    "orders": ["order_id", "customer_id"],
    "order_items": ["order_id", "product_id", "seller_id"],
    "customers": ["customer_id", "customer_unique_id", "customer_zip_code_prefix"],
    "products": ["product_id", "product_category_name"],
    "reviews": ["review_id", "order_id"],
    "payments": ["order_id", "payment_type"],
    "category_translation": ["product_category_name", "product_category_name_english"],
}

NUMERIC_COLUMNS_BY_DATASET: dict[str, list[str]] = {
    "order_items": ["order_item_id", "price", "freight_value"],
    "products": [
        "product_name_lenght",
        "product_description_lenght",
        "product_photos_qty",
        "product_weight_g",
        "product_length_cm",
        "product_height_cm",
        "product_width_cm",
    ],
    "reviews": ["review_score"],
    "payments": ["payment_sequential", "payment_installments", "payment_value"],
}

RawDatasets = dict[str, pd.DataFrame]


def _load_csv(file_path: Path, dtype_columns: list[str]) -> pd.DataFrame:
    if not file_path.exists():
        raise FileNotFoundError(f"Required dataset was not found: {file_path}")

    dtype_map = {column: "string" for column in dtype_columns}
    return pd.read_csv(file_path, dtype=dtype_map)


def load_raw_datasets(data_dir: Path) -> RawDatasets:
    datasets: RawDatasets = {}

    for dataset_key, filename in REQUIRED_DATASETS.items():
        datasets[dataset_key] = _load_csv(
            file_path=data_dir / filename,
            dtype_columns=ID_COLUMNS_BY_DATASET.get(dataset_key, []),
        )

    return datasets


def standardize_base_types(datasets: RawDatasets) -> RawDatasets:
    standardized: RawDatasets = {}

    for dataset_key, dataframe in datasets.items():
        df = dataframe.copy()

        for column in ID_COLUMNS_BY_DATASET.get(dataset_key, []):
            if column in df.columns:
                df[column] = df[column].astype("string").str.strip()

        for column in NUMERIC_COLUMNS_BY_DATASET.get(dataset_key, []):
            if column in df.columns:
                df[column] = pd.to_numeric(df[column], errors="coerce")

        standardized[dataset_key] = df

    return standardized
