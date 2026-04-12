from pathlib import Path

import pandas as pd

from schemas.dashboard import OverviewMetrics

ORDERS_FILE = "olist_orders_dataset.csv"
PAYMENTS_FILE = "olist_order_payments_dataset.csv"


def _load_csv_safe(file_path: Path) -> pd.DataFrame:
    if not file_path.exists():
        return pd.DataFrame()
    return pd.read_csv(file_path)


def build_overview_metrics(data_dir: Path) -> OverviewMetrics:
    orders = _load_csv_safe(data_dir / ORDERS_FILE)
    payments = _load_csv_safe(data_dir / PAYMENTS_FILE)

    total_orders = int(len(orders))

    if "order_status" in orders.columns:
        status_series = orders["order_status"].fillna("unknown").astype(str)
        status_breakdown = (
            status_series.value_counts(dropna=False).sort_values(ascending=False).to_dict()
        )
    else:
        status_series = pd.Series([], dtype="object")
        status_breakdown = {}

    delivered_orders = int((status_series == "delivered").sum())
    canceled_orders = int(status_series.isin(["canceled", "cancelled"]).sum())

    if "payment_value" in payments.columns:
        total_revenue = float(payments["payment_value"].fillna(0).sum())
    else:
        total_revenue = 0.0

    average_ticket = float(total_revenue / total_orders) if total_orders else 0.0

    return OverviewMetrics(
        total_orders=total_orders,
        delivered_orders=delivered_orders,
        canceled_orders=canceled_orders,
        total_revenue=round(total_revenue, 2),
        average_ticket=round(average_ticket, 2),
        status_breakdown=status_breakdown,
    )
