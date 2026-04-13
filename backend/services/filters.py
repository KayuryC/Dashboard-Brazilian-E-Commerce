from dataclasses import dataclass
from datetime import date
import re
import unicodedata

import pandas as pd


def _collapse_spaces(value: str) -> str:
    return " ".join(value.split())


def normalize_state_text(value: object) -> str | None:
    if value is None or pd.isna(value):
        return None

    text_value = str(value)
    cleaned = _collapse_spaces(text_value.strip()).upper()
    return cleaned or None


def normalize_city_text(value: object) -> str | None:
    if value is None or pd.isna(value):
        return None

    text_value = str(value)
    cleaned = _collapse_spaces(text_value.strip())
    if not cleaned:
        return None

    decomposed = unicodedata.normalize("NFKD", cleaned)
    without_accents = "".join(char for char in decomposed if not unicodedata.combining(char))
    letters_numbers_only = re.sub(r"[^0-9A-Za-z]+", " ", without_accents)
    normalized = _collapse_spaces(letters_numbers_only).casefold()
    return normalized or None


def normalize_city_label(value: object) -> str:
    if value is None or pd.isna(value):
        return "Unknown"

    text_value = str(value)
    cleaned = _collapse_spaces(text_value.strip())
    if not cleaned:
        return "Unknown"

    return cleaned.title()


@dataclass(frozen=True)
class DashboardFilters:
    state: str | None = None
    city: str | None = None
    start_date: date | None = None
    end_date: date | None = None

    def normalized_state(self) -> str | None:
        return normalize_state_text(self.state)

    def normalized_city(self) -> str | None:
        return normalize_city_text(self.city)


def apply_dashboard_filters(
    dataframe: pd.DataFrame,
    filters: DashboardFilters | None,
) -> pd.DataFrame:
    if filters is None or dataframe.empty:
        return dataframe

    filtered = dataframe

    if "order_purchase_timestamp" in filtered.columns:
        if filters.start_date is not None:
            start_ts = pd.Timestamp(filters.start_date)
            filtered = filtered[filtered["order_purchase_timestamp"] >= start_ts]

        if filters.end_date is not None:
            end_ts_exclusive = pd.Timestamp(filters.end_date) + pd.Timedelta(days=1)
            filtered = filtered[filtered["order_purchase_timestamp"] < end_ts_exclusive]

    state = filters.normalized_state()
    if state and "customer_state" in filtered.columns:
        state_series = filtered["customer_state"].fillna("").astype(str).map(normalize_state_text)
        filtered = filtered[state_series == state]

    city = filters.normalized_city()
    if city and "customer_city" in filtered.columns:
        city_series = filtered["customer_city"].fillna("").astype(str).map(normalize_city_text)
        filtered = filtered[city_series == city]

    return filtered
