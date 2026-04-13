from pathlib import Path

import pandas as pd

from services.filters import DashboardFilters, apply_dashboard_filters
from services.preprocessing import get_consolidated_dataset

STATUS_TRANSLATION: dict[str, str] = {
    "delivered": "Entregue",
    "shipped": "Enviado",
    "canceled": "Cancelado",
    "cancelled": "Cancelado",
    "unavailable": "Indisponivel",
    "invoiced": "Faturado",
    "processing": "Em processamento",
    "created": "Criado",
    "approved": "Aprovado",
    "unknown": "Nao informado",
}


def get_orders_by_status(
    data_dir: Path,
    filters: DashboardFilters | None = None,
) -> pd.DataFrame:
    df = get_consolidated_dataset(data_dir)
    df = apply_dashboard_filters(df, filters)
    order_level = df.drop_duplicates(subset=["order_id"])

    result = (
        order_level.groupby("order_status", dropna=False, as_index=False)
        .agg(value=("order_id", "nunique"))
        .sort_values("value", ascending=False)
    )
    result["status"] = result["order_status"].fillna("unknown").astype(str).str.strip().str.lower()
    result["value"] = result["value"].fillna(0).astype(int)
    result["label"] = result["status"].map(lambda status: STATUS_TRANSLATION.get(status, status))

    return result[["status", "label", "value"]]
