from functools import lru_cache
from pathlib import Path

import pandas as pd

from services.data_loader import REQUIRED_DATASETS, load_raw_datasets
from services.preprocessing import get_consolidated_dataset


def _infer_dtype_label(series: pd.Series) -> str:
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    if pd.api.types.is_bool_dtype(series):
        return "boolean"
    if pd.api.types.is_integer_dtype(series):
        return "integer"
    if pd.api.types.is_float_dtype(series):
        return "float"
    if pd.api.types.is_string_dtype(series):
        return "string"
    if isinstance(series.dtype, pd.CategoricalDtype):
        return "category"
    return str(series.dtype)


def _build_column_profile(dataframe: pd.DataFrame) -> list[dict[str, object]]:
    total_rows = int(len(dataframe))
    if total_rows == 0:
        return []

    profile_rows: list[dict[str, object]] = []

    for column in dataframe.columns:
        series = dataframe[column]
        null_count = int(series.isna().sum())
        non_null_count = total_rows - null_count
        null_percentage = round((null_count / total_rows) * 100, 2)

        if null_count == total_rows:
            unique_count = 0
        else:
            unique_count = int(series.nunique(dropna=True))

        profile_rows.append(
            {
                "column_name": str(column),
                "dtype": _infer_dtype_label(series),
                "non_null_count": non_null_count,
                "null_count": null_count,
                "null_percentage": null_percentage,
                "unique_count": unique_count,
            }
        )

    return sorted(
        profile_rows,
        key=lambda row: (-float(row["null_percentage"]), str(row["column_name"])),
    )


@lru_cache(maxsize=2)
def _get_cached_dataset_study(data_dir_as_string: str) -> dict[str, object]:
    data_dir = Path(data_dir_as_string)
    raw_datasets = load_raw_datasets(data_dir)
    consolidated = get_consolidated_dataset(data_dir)

    raw_tables: list[dict[str, object]] = []
    for dataset_key, file_name in REQUIRED_DATASETS.items():
        table = raw_datasets.get(dataset_key, pd.DataFrame())
        raw_tables.append(
            {
                "dataset_key": dataset_key,
                "file_name": file_name,
                "rows": int(table.shape[0]),
                "columns": int(table.shape[1]),
            }
        )

    raw_total_rows = int(sum(item["rows"] for item in raw_tables))
    raw_total_columns = int(sum(item["columns"] for item in raw_tables))

    consolidated_rows = int(consolidated.shape[0])
    consolidated_columns = int(consolidated.shape[1])
    consolidated_missing_cells = int(consolidated.isna().sum().sum())
    total_cells = consolidated_rows * consolidated_columns
    consolidated_missing_percentage = round(
        (consolidated_missing_cells / total_cells) * 100, 2
    ) if total_cells > 0 else 0.0

    consolidated_unique_orders = (
        int(consolidated["order_id"].nunique(dropna=True))
        if "order_id" in consolidated.columns
        else 0
    )
    consolidated_unique_customers = (
        int(consolidated["customer_id"].nunique(dropna=True))
        if "customer_id" in consolidated.columns
        else 0
    )
    consolidated_memory_mb = round(
        float(consolidated.memory_usage(deep=True).sum()) / (1024 ** 2),
        2,
    )

    return {
        "raw_tables": raw_tables,
        "raw_total_rows": raw_total_rows,
        "raw_total_columns": raw_total_columns,
        "consolidated_rows": consolidated_rows,
        "consolidated_columns": consolidated_columns,
        "consolidated_unique_orders": consolidated_unique_orders,
        "consolidated_unique_customers": consolidated_unique_customers,
        "consolidated_missing_cells": consolidated_missing_cells,
        "consolidated_missing_percentage": consolidated_missing_percentage,
        "consolidated_memory_mb": consolidated_memory_mb,
        "consolidated_columns_profile": _build_column_profile(consolidated),
    }


def get_dataset_study(data_dir: Path, refresh: bool = False) -> dict[str, object]:
    if refresh:
        _get_cached_dataset_study.cache_clear()

    return _get_cached_dataset_study(str(data_dir))
