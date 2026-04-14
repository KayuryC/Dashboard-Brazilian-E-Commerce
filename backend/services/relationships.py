from pathlib import Path

import pandas as pd

from services.filters import DashboardFilters, apply_dashboard_filters
from services.preprocessing import get_consolidated_dataset

MAX_SCATTER_POINTS = 2500
CORRELATION_VARIABLES: list[tuple[str, str]] = [
    ("order_value", "Valor do pedido"),
    ("delivery_time_days", "Tempo de entrega"),
    ("delay_days", "Atraso (dias)"),
    ("review_score", "Nota de avaliacao"),
]


def _safe_round(value: float) -> float:
    return round(float(value), 4)


def _build_scatter_points(order_level: pd.DataFrame, value_column: str) -> list[dict[str, float]]:
    if value_column not in order_level.columns or "delivery_time_days" not in order_level.columns:
        return []

    scatter_df = order_level[[value_column, "delivery_time_days"]].copy()
    scatter_df[value_column] = pd.to_numeric(scatter_df[value_column], errors="coerce")
    scatter_df["delivery_time_days"] = pd.to_numeric(scatter_df["delivery_time_days"], errors="coerce")
    scatter_df = scatter_df.dropna()
    scatter_df = scatter_df[(scatter_df[value_column] >= 0) & (scatter_df["delivery_time_days"] >= 0)]

    if scatter_df.empty:
        return []

    if len(scatter_df) > MAX_SCATTER_POINTS:
        scatter_df = scatter_df.sample(n=MAX_SCATTER_POINTS, random_state=42)

    scatter_df = scatter_df.rename(columns={value_column: "order_value"})
    scatter_df["order_value"] = scatter_df["order_value"].round(2)
    scatter_df["delivery_time_days"] = scatter_df["delivery_time_days"].round(2)

    return scatter_df.to_dict(orient="records")


def _calculate_correlation(left: pd.Series, right: pd.Series) -> float:
    correlation = left.corr(right)
    if correlation is None or pd.isna(correlation):
        return 0.0
    return _safe_round(correlation)


def _build_boxplot_metrics(series: pd.Series, group_label: str) -> dict[str, object]:
    clean_series = pd.to_numeric(series, errors="coerce").dropna()
    if clean_series.empty:
        return {
            "group": group_label,
            "count": 0,
            "min_value": 0.0,
            "q1_value": 0.0,
            "median_value": 0.0,
            "q3_value": 0.0,
            "max_value": 0.0,
            "mean_value": 0.0,
        }

    return {
        "group": group_label,
        "count": int(clean_series.shape[0]),
        "min_value": round(float(clean_series.min()), 2),
        "q1_value": round(float(clean_series.quantile(0.25)), 2),
        "median_value": round(float(clean_series.median()), 2),
        "q3_value": round(float(clean_series.quantile(0.75)), 2),
        "max_value": round(float(clean_series.max()), 2),
        "mean_value": round(float(clean_series.mean()), 2),
    }


def _build_review_score_boxplot(order_level: pd.DataFrame) -> list[dict[str, object]]:
    if "review_score" not in order_level.columns or "is_late" not in order_level.columns:
        return []

    review_df = order_level[["review_score", "is_late"]].copy()
    review_df["review_score"] = pd.to_numeric(review_df["review_score"], errors="coerce")
    review_df = review_df.dropna(subset=["review_score", "is_late"])

    if review_df.empty:
        return []

    on_time_series = review_df.loc[review_df["is_late"] == False, "review_score"]  # noqa: E712
    late_series = review_df.loc[review_df["is_late"] == True, "review_score"]  # noqa: E712

    return [
        _build_boxplot_metrics(on_time_series, "No prazo"),
        _build_boxplot_metrics(late_series, "Atrasado"),
    ]


def _build_state_behavior(order_level: pd.DataFrame, value_column: str, top_n: int = 10) -> list[dict[str, object]]:
    required_columns = {"customer_state", "order_id", value_column, "delivery_time_days", "review_score", "is_late"}
    if not required_columns.issubset(set(order_level.columns)):
        return []

    state_df = order_level[list(required_columns)].copy()
    state_df["customer_state"] = state_df["customer_state"].fillna("").astype(str).str.upper().str.strip()
    state_df = state_df[state_df["customer_state"].str.fullmatch(r"[A-Z]{2}")]

    if state_df.empty:
        return []

    state_df[value_column] = pd.to_numeric(state_df[value_column], errors="coerce")
    state_df["delivery_time_days"] = pd.to_numeric(state_df["delivery_time_days"], errors="coerce")
    state_df["review_score"] = pd.to_numeric(state_df["review_score"], errors="coerce")

    grouped = (
        state_df.groupby("customer_state", as_index=False)
        .agg(
            orders=("order_id", "nunique"),
            avg_order_value=(value_column, "mean"),
            avg_delivery_days=("delivery_time_days", "mean"),
            avg_review_score=("review_score", "mean"),
            late_delivery_percentage=("is_late", "mean"),
        )
        .sort_values(["orders", "avg_order_value"], ascending=[False, False])
        .head(max(1, int(top_n)))
    )

    grouped["avg_order_value"] = grouped["avg_order_value"].fillna(0).round(2)
    grouped["avg_delivery_days"] = grouped["avg_delivery_days"].fillna(0).round(2)
    grouped["avg_review_score"] = grouped["avg_review_score"].fillna(0).round(2)
    grouped["late_delivery_percentage"] = (grouped["late_delivery_percentage"].fillna(0) * 100).round(2)
    grouped["orders"] = grouped["orders"].fillna(0).astype(int)

    return grouped.to_dict(orient="records")


def _build_correlation_matrix(order_level: pd.DataFrame, value_column: str) -> list[dict[str, object]]:
    correlation_df = pd.DataFrame(
        {
            "order_value": pd.to_numeric(order_level.get(value_column), errors="coerce"),
            "delivery_time_days": pd.to_numeric(order_level.get("delivery_time_days"), errors="coerce"),
            "delay_days": pd.to_numeric(order_level.get("delay_days"), errors="coerce"),
            "review_score": pd.to_numeric(order_level.get("review_score"), errors="coerce"),
        }
    )

    if correlation_df.empty:
        return []

    matrix = correlation_df.corr(numeric_only=True)
    if matrix.empty:
        return []

    cells: list[dict[str, object]] = []
    for x_key, x_label in CORRELATION_VARIABLES:
        for y_key, y_label in CORRELATION_VARIABLES:
            raw_value = matrix.loc[x_key, y_key] if x_key in matrix.index and y_key in matrix.columns else 0.0
            correlation = 0.0 if pd.isna(raw_value) else _safe_round(float(raw_value))
            cells.append(
                {
                    "x_key": x_key,
                    "y_key": y_key,
                    "x_label": x_label,
                    "y_label": y_label,
                    "correlation": correlation,
                }
            )

    return cells


def get_relationships_analysis(
    data_dir: Path,
    filters: DashboardFilters | None = None,
    top_states: int = 10,
) -> dict[str, object]:
    dataframe = get_consolidated_dataset(data_dir)
    dataframe = apply_dashboard_filters(dataframe, filters)

    if dataframe.empty:
        return {
            "correlations": {
                "value_delivery_correlation": 0.0,
                "delay_review_correlation": 0.0,
                "value_delivery_sample_size": 0,
                "delay_review_sample_size": 0,
            },
            "scatter": [],
            "review_score_by_delivery_status": [],
            "top_states_behavior": [],
            "correlation_matrix": [],
        }

    order_level = dataframe.drop_duplicates(subset=["order_id"]).copy()
    value_column = "order_payment_value" if "order_payment_value" in order_level.columns else "total_item_value"

    value_delivery_df = order_level[[value_column, "delivery_time_days"]].copy()
    value_delivery_df[value_column] = pd.to_numeric(value_delivery_df[value_column], errors="coerce")
    value_delivery_df["delivery_time_days"] = pd.to_numeric(value_delivery_df["delivery_time_days"], errors="coerce")
    value_delivery_df = value_delivery_df.dropna()

    delay_review_df = order_level[["delay_days", "review_score"]].copy()
    delay_review_df["delay_days"] = pd.to_numeric(delay_review_df["delay_days"], errors="coerce")
    delay_review_df["review_score"] = pd.to_numeric(delay_review_df["review_score"], errors="coerce")
    delay_review_df = delay_review_df.dropna()

    value_delivery_correlation = (
        _calculate_correlation(value_delivery_df[value_column], value_delivery_df["delivery_time_days"])
        if not value_delivery_df.empty
        else 0.0
    )
    delay_review_correlation = (
        _calculate_correlation(delay_review_df["delay_days"], delay_review_df["review_score"])
        if not delay_review_df.empty
        else 0.0
    )

    return {
        "correlations": {
            "value_delivery_correlation": value_delivery_correlation,
            "delay_review_correlation": delay_review_correlation,
            "value_delivery_sample_size": int(value_delivery_df.shape[0]),
            "delay_review_sample_size": int(delay_review_df.shape[0]),
        },
        "scatter": _build_scatter_points(order_level, value_column),
        "review_score_by_delivery_status": _build_review_score_boxplot(order_level),
        "top_states_behavior": _build_state_behavior(order_level, value_column, top_n=top_states),
        "correlation_matrix": _build_correlation_matrix(order_level, value_column),
    }
