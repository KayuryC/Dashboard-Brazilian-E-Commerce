from __future__ import annotations

from dataclasses import dataclass
from math import erfc, sqrt
from pathlib import Path

import numpy as np
import pandas as pd

from services.filters import DashboardFilters, apply_dashboard_filters
from services.preprocessing import get_consolidated_dataset

Z_95 = 1.96
SIGNIFICANCE_LEVEL = 0.05


@dataclass(frozen=True)
class _RegressionInputs:
    design_matrix: np.ndarray
    target: np.ndarray
    feature_keys: list[str]
    feature_labels: list[str]


def _safe_round(value: float, digits: int = 4) -> float:
    return round(float(value), digits)


def _format_p_value(value: float) -> float:
    if value < 0:
        return 0.0
    if value > 1:
        return 1.0
    return _safe_round(value, 6)


def _empty_summary(horizon_months: int) -> dict[str, object]:
    return {
        "linear_regression": {
            "target_label": "Valor total do pedido (R$)",
            "sample_size": 0,
            "r2": 0.0,
            "adjusted_r2": 0.0,
            "rmse": 0.0,
            "mae": 0.0,
            "target_mean": 0.0,
            "target_std": 0.0,
            "baseline_rmse": 0.0,
            "baseline_mae": 0.0,
            "rmse_gain_vs_baseline": 0.0,
            "mae_gain_vs_baseline": 0.0,
            "rmse_percent_of_mean": 0.0,
            "mae_percent_of_mean": 0.0,
            "quality_label": "Sem dados",
            "executive_reading": "Nao ha dados suficientes para avaliar o modelo no recorte atual.",
            "coefficients": [],
            "prediction_samples": [],
        },
        "revenue_forecast": {
            "sample_size": 0,
            "r2": 0.0,
            "rmse": 0.0,
            "mae": 0.0,
            "slope": 0.0,
            "intercept": 0.0,
            "horizon_months": horizon_months,
            "series": [],
        },
        "train_test_validation": {
            "train_size": 0,
            "test_size": 0,
            "r2_train": 0.0,
            "r2_test": 0.0,
            "rmse_train": 0.0,
            "rmse_test": 0.0,
            "mae_train": 0.0,
            "mae_test": 0.0,
            "generalization_gap": 0.0,
            "stability_label": "Sem dados",
            "interpretation": "Nao ha dados suficientes para validar o modelo fora da amostra.",
        },
        "hypothesis_tests": [],
        "confidence_intervals": [],
        "practical_recommendations": [],
        "study_limitations": [],
    }


def _build_regression_inputs(order_level: pd.DataFrame, target_column: str) -> _RegressionInputs | None:
    if target_column not in order_level.columns:
        return None

    model_df = pd.DataFrame(
        {
            "target": pd.to_numeric(order_level[target_column], errors="coerce"),
            "delivery_time_days": pd.to_numeric(order_level.get("delivery_time_days"), errors="coerce"),
            "estimated_delivery_time_days": pd.to_numeric(
                order_level.get("estimated_delivery_time_days"),
                errors="coerce",
            ),
            "delay_days": pd.to_numeric(order_level.get("delay_days"), errors="coerce"),
            "review_score": pd.to_numeric(order_level.get("review_score"), errors="coerce"),
            "is_late_numeric": (
                order_level.get("is_late").fillna(False).astype(bool).astype(int)
                if "is_late" in order_level.columns
                else 0
            ),
        }
    ).dropna()

    model_df = model_df[model_df["target"] >= 0]
    if model_df.empty:
        return None

    feature_keys = [
        "delivery_time_days",
        "estimated_delivery_time_days",
        "delay_days",
        "review_score",
        "is_late_numeric",
    ]
    feature_labels = [
        "Tempo de entrega (dias)",
        "Prazo estimado (dias)",
        "Atraso (dias)",
        "Nota de avaliacao",
        "Pedido atrasado (0/1)",
    ]

    x_values = model_df[feature_keys].to_numpy(dtype=float)
    y_values = model_df["target"].to_numpy(dtype=float)
    intercept = np.ones((x_values.shape[0], 1), dtype=float)
    design = np.hstack([intercept, x_values])

    return _RegressionInputs(
        design_matrix=design,
        target=y_values,
        feature_keys=feature_keys,
        feature_labels=feature_labels,
    )


def _calculate_regression_metrics(target: np.ndarray, predicted: np.ndarray) -> tuple[float, float, float]:
    residual = target - predicted
    rss = float(np.sum(np.square(residual)))
    tss = float(np.sum(np.square(target - float(np.mean(target)))))
    r2 = 1.0 - (rss / tss) if tss > 0 else 0.0
    rmse = float(np.sqrt(np.mean(np.square(residual))))
    mae = float(np.mean(np.abs(residual)))
    return _safe_round(r2), _safe_round(rmse), _safe_round(mae)


def _build_linear_regression(order_level: pd.DataFrame, target_column: str) -> dict[str, object]:
    inputs = _build_regression_inputs(order_level, target_column)
    if inputs is None:
        return {
            "target_label": "Valor total do pedido (R$)",
            "sample_size": 0,
            "r2": 0.0,
            "adjusted_r2": 0.0,
            "rmse": 0.0,
            "mae": 0.0,
            "target_mean": 0.0,
            "target_std": 0.0,
            "baseline_rmse": 0.0,
            "baseline_mae": 0.0,
            "rmse_gain_vs_baseline": 0.0,
            "mae_gain_vs_baseline": 0.0,
            "rmse_percent_of_mean": 0.0,
            "mae_percent_of_mean": 0.0,
            "quality_label": "Sem dados",
            "executive_reading": "Nao ha dados suficientes para avaliar o modelo no recorte atual.",
            "coefficients": [],
            "prediction_samples": [],
        }

    design = inputs.design_matrix
    target = inputs.target
    sample_size, parameter_count = design.shape

    if sample_size <= parameter_count:
        return {
            "target_label": "Valor total do pedido (R$)",
            "sample_size": int(sample_size),
            "r2": 0.0,
            "adjusted_r2": 0.0,
            "rmse": 0.0,
            "mae": 0.0,
            "target_mean": 0.0,
            "target_std": 0.0,
            "baseline_rmse": 0.0,
            "baseline_mae": 0.0,
            "rmse_gain_vs_baseline": 0.0,
            "mae_gain_vs_baseline": 0.0,
            "rmse_percent_of_mean": 0.0,
            "mae_percent_of_mean": 0.0,
            "quality_label": "Amostra insuficiente",
            "executive_reading": "A amostra ficou pequena demais para ajustar um modelo linear robusto.",
            "coefficients": [],
            "prediction_samples": [],
        }

    coefficients, _, _, _ = np.linalg.lstsq(design, target, rcond=None)
    predicted = design @ coefficients
    residual = target - predicted

    r2, rmse, mae = _calculate_regression_metrics(target, predicted)
    adjusted_r2 = 1.0 - (1.0 - r2) * ((sample_size - 1) / (sample_size - parameter_count))
    target_mean = float(np.mean(target))
    target_std = float(np.std(target))

    baseline_predicted = np.full_like(target, fill_value=target_mean, dtype=float)
    _, baseline_rmse, baseline_mae = _calculate_regression_metrics(target, baseline_predicted)

    rmse_gain_vs_baseline = (
        ((baseline_rmse - rmse) / baseline_rmse) * 100 if baseline_rmse > 0 else 0.0
    )
    mae_gain_vs_baseline = (
        ((baseline_mae - mae) / baseline_mae) * 100 if baseline_mae > 0 else 0.0
    )
    rmse_percent_of_mean = (rmse / target_mean) * 100 if target_mean > 0 else 0.0
    mae_percent_of_mean = (mae / target_mean) * 100 if target_mean > 0 else 0.0

    if r2 >= 0.5:
        quality_label = "Boa"
    elif r2 >= 0.25:
        quality_label = "Moderada"
    elif r2 >= 0.1:
        quality_label = "Fraca"
    else:
        quality_label = "Muito fraca"

    executive_reading = (
        f"O modelo explica {r2 * 100:.1f}% da variacao do valor dos pedidos. "
        f"O erro medio absoluto e R$ {mae:.2f} ({mae_percent_of_mean:.1f}% do ticket medio), "
        f"com ganho de {mae_gain_vs_baseline:.1f}% frente ao baseline que sempre usa a media."
    )

    dof = max(1, sample_size - parameter_count)
    mse = float(np.sum(np.square(residual)) / dof)
    covariance = mse * np.linalg.pinv(design.T @ design)
    std_error = np.sqrt(np.diag(covariance))

    coefficient_rows: list[dict[str, object]] = []
    labels = ["Intercepto"] + inputs.feature_labels
    keys = ["intercept"] + inputs.feature_keys
    for index, (key, label) in enumerate(zip(keys, labels)):
        coef_value = float(coefficients[index])
        std_value = float(std_error[index]) if index < len(std_error) else 0.0
        coefficient_rows.append(
            {
                "feature_key": key,
                "feature_label": label,
                "coefficient": _safe_round(coef_value),
                "std_error": _safe_round(std_value),
                "ci_lower": _safe_round(coef_value - Z_95 * std_value),
                "ci_upper": _safe_round(coef_value + Z_95 * std_value),
            }
        )

    sample_points = (
        pd.DataFrame(
            {
                "actual_value": target,
                "predicted_value": predicted,
            }
        )
        .assign(residual=lambda frame: frame["actual_value"] - frame["predicted_value"])
        .head(10)
    )

    prediction_samples = [
        {
            "actual_value": _safe_round(row.actual_value),
            "predicted_value": _safe_round(row.predicted_value),
            "residual": _safe_round(row.residual),
        }
        for row in sample_points.itertuples(index=False)
    ]

    return {
        "target_label": "Valor total do pedido (R$)",
        "sample_size": int(sample_size),
        "r2": _safe_round(r2),
        "adjusted_r2": _safe_round(adjusted_r2),
        "rmse": _safe_round(rmse),
        "mae": _safe_round(mae),
        "target_mean": _safe_round(target_mean),
        "target_std": _safe_round(target_std),
        "baseline_rmse": _safe_round(baseline_rmse),
        "baseline_mae": _safe_round(baseline_mae),
        "rmse_gain_vs_baseline": _safe_round(rmse_gain_vs_baseline),
        "mae_gain_vs_baseline": _safe_round(mae_gain_vs_baseline),
        "rmse_percent_of_mean": _safe_round(rmse_percent_of_mean),
        "mae_percent_of_mean": _safe_round(mae_percent_of_mean),
        "quality_label": quality_label,
        "executive_reading": executive_reading,
        "coefficients": coefficient_rows,
        "prediction_samples": prediction_samples,
    }


def _build_revenue_forecast(order_level: pd.DataFrame, target_column: str, horizon_months: int) -> dict[str, object]:
    if "purchase_year_month" not in order_level.columns or target_column not in order_level.columns:
        return {
            "sample_size": 0,
            "r2": 0.0,
            "rmse": 0.0,
            "mae": 0.0,
            "slope": 0.0,
            "intercept": 0.0,
            "horizon_months": horizon_months,
            "series": [],
        }

    monthly = (
        order_level.dropna(subset=["purchase_year_month"])
        .assign(purchase_year_month=lambda frame: frame["purchase_year_month"].astype(str))
    )
    monthly = monthly[monthly["purchase_year_month"].str.fullmatch(r"\d{4}-\d{2}")]
    if monthly.empty:
        return {
            "sample_size": 0,
            "r2": 0.0,
            "rmse": 0.0,
            "mae": 0.0,
            "slope": 0.0,
            "intercept": 0.0,
            "horizon_months": horizon_months,
            "series": [],
        }

    grouped = (
        monthly.groupby("purchase_year_month", as_index=False)
        .agg(actual_value=(target_column, "sum"))
        .sort_values("purchase_year_month")
    )

    sample_size = int(grouped.shape[0])
    if sample_size < 2:
        only_value = float(grouped["actual_value"].iloc[0]) if sample_size == 1 else 0.0
        return {
            "sample_size": sample_size,
            "r2": 0.0,
            "rmse": 0.0,
            "mae": 0.0,
            "slope": 0.0,
            "intercept": _safe_round(only_value),
            "horizon_months": horizon_months,
            "series": [],
        }

    x_observed = np.arange(sample_size, dtype=float)
    y_observed = grouped["actual_value"].to_numpy(dtype=float)
    x_design = np.column_stack([np.ones(sample_size), x_observed])

    coefficients, _, _, _ = np.linalg.lstsq(x_design, y_observed, rcond=None)
    intercept = float(coefficients[0])
    slope = float(coefficients[1])
    y_predicted_observed = x_design @ coefficients

    r2, rmse, mae = _calculate_regression_metrics(y_observed, y_predicted_observed)

    periods = [pd.Period(value, freq="M") for value in grouped["purchase_year_month"].tolist()]
    last_period = periods[-1]

    series: list[dict[str, object]] = []
    total_points = sample_size + max(1, horizon_months)
    for index in range(total_points):
        period = (periods[index] if index < sample_size else last_period + (index - sample_size + 1)).strftime("%Y-%m")
        predicted_value = intercept + slope * index
        actual_value = float(y_observed[index]) if index < sample_size else None
        series.append(
            {
                "period": period,
                "actual_value": _safe_round(actual_value, 2) if actual_value is not None else None,
                "predicted_value": _safe_round(predicted_value, 2),
                "is_future": index >= sample_size,
            }
        )

    return {
        "sample_size": sample_size,
        "r2": r2,
        "rmse": rmse,
        "mae": mae,
        "slope": _safe_round(slope),
        "intercept": _safe_round(intercept),
        "horizon_months": horizon_months,
        "series": series,
    }


def _normal_two_tailed_p_value(z_score: float) -> float:
    return float(erfc(abs(z_score) / sqrt(2.0)))


def _build_hypothesis_tests(order_level: pd.DataFrame) -> tuple[list[dict[str, object]], list[dict[str, object]]]:
    tests: list[dict[str, object]] = []
    confidence_intervals: list[dict[str, object]] = []

    if "order_delivered_customer_date" in order_level.columns:
        delivered = order_level[order_level["order_delivered_customer_date"].notna()].copy()
    else:
        delivered = order_level.copy()

    if "review_score" in delivered.columns and "is_late" in delivered.columns:
        test_df = delivered[["review_score", "is_late"]].copy()
        test_df["review_score"] = pd.to_numeric(test_df["review_score"], errors="coerce")
        test_df = test_df.dropna(subset=["review_score", "is_late"])

        late_group = test_df.loc[test_df["is_late"] == True, "review_score"]  # noqa: E712
        on_time_group = test_df.loc[test_df["is_late"] == False, "review_score"]  # noqa: E712

        n_a = int(late_group.shape[0])
        n_b = int(on_time_group.shape[0])

        if n_a > 1 and n_b > 1:
            mean_a = float(late_group.mean())
            mean_b = float(on_time_group.mean())
            var_a = float(late_group.var(ddof=1))
            var_b = float(on_time_group.var(ddof=1))
            mean_diff = mean_a - mean_b
            standard_error = sqrt((var_a / n_a) + (var_b / n_b))

            if standard_error > 0:
                z_score = mean_diff / standard_error
                p_value = _normal_two_tailed_p_value(z_score)
                ci_lower = mean_diff - Z_95 * standard_error
                ci_upper = mean_diff + Z_95 * standard_error
            else:
                z_score = 0.0
                p_value = 1.0
                ci_lower = mean_diff
                ci_upper = mean_diff

            reject_null = p_value < SIGNIFICANCE_LEVEL
            interpretation = (
                "Existe evidencia estatistica de diferenca na nota media entre pedidos atrasados e no prazo."
                if reject_null
                else "Nao ha evidencia estatistica suficiente para diferenca de nota media entre os grupos."
            )

            tests.append(
                {
                    "test_name": "Comparacao de medias (aproximacao normal)",
                    "metric_label": "Nota de avaliacao",
                    "group_a_label": "Pedidos atrasados",
                    "group_b_label": "Pedidos no prazo",
                    "group_a_mean": _safe_round(mean_a),
                    "group_b_mean": _safe_round(mean_b),
                    "mean_difference": _safe_round(mean_diff),
                    "p_value": _format_p_value(p_value),
                    "z_score": _safe_round(z_score),
                    "ci_lower": _safe_round(ci_lower),
                    "ci_upper": _safe_round(ci_upper),
                    "significance_level": SIGNIFICANCE_LEVEL,
                    "reject_null": reject_null,
                    "interpretation": interpretation,
                }
            )

    delivery_series = pd.to_numeric(delivered.get("delivery_time_days"), errors="coerce").dropna()
    delivery_series = delivery_series[delivery_series >= 0]
    delivery_count = int(delivery_series.shape[0])
    if delivery_count > 1:
        mean_delivery = float(delivery_series.mean())
        std_delivery = float(delivery_series.std(ddof=1))
        se_delivery = std_delivery / sqrt(delivery_count)
        confidence_intervals.append(
            {
                "metric_key": "mean_delivery_time_days",
                "metric_label": "Tempo medio de entrega (dias)",
                "point_estimate": _safe_round(mean_delivery),
                "ci_lower": _safe_round(mean_delivery - Z_95 * se_delivery),
                "ci_upper": _safe_round(mean_delivery + Z_95 * se_delivery),
                "confidence_level": 0.95,
                "sample_size": delivery_count,
            }
        )

    if "is_late" in delivered.columns:
        late_series = delivered["is_late"].fillna(False).astype(bool)
        late_count = int(late_series.shape[0])
        if late_count > 1:
            proportion = float(late_series.mean())
            se_late = sqrt((proportion * (1 - proportion)) / late_count)
            confidence_intervals.append(
                {
                    "metric_key": "late_delivery_rate",
                    "metric_label": "Taxa de atraso",
                    "point_estimate": _safe_round(proportion * 100),
                    "ci_lower": _safe_round((proportion - Z_95 * se_late) * 100),
                    "ci_upper": _safe_round((proportion + Z_95 * se_late) * 100),
                    "confidence_level": 0.95,
                    "sample_size": late_count,
                }
            )

    return tests, confidence_intervals


def _build_train_test_validation(order_level: pd.DataFrame, target_column: str) -> dict[str, object]:
    inputs = _build_regression_inputs(order_level, target_column)
    if inputs is None:
        return {
            "train_size": 0,
            "test_size": 0,
            "r2_train": 0.0,
            "r2_test": 0.0,
            "rmse_train": 0.0,
            "rmse_test": 0.0,
            "mae_train": 0.0,
            "mae_test": 0.0,
            "generalization_gap": 0.0,
            "stability_label": "Sem dados",
            "interpretation": "Nao ha dados suficientes para validar o modelo fora da amostra.",
        }

    design = inputs.design_matrix
    target = inputs.target
    sample_size = int(design.shape[0])

    if sample_size < 120:
        return {
            "train_size": sample_size,
            "test_size": 0,
            "r2_train": 0.0,
            "r2_test": 0.0,
            "rmse_train": 0.0,
            "rmse_test": 0.0,
            "mae_train": 0.0,
            "mae_test": 0.0,
            "generalization_gap": 0.0,
            "stability_label": "Amostra insuficiente",
            "interpretation": "Amostra insuficiente para separar treino e teste com confiabilidade.",
        }

    rng = np.random.default_rng(42)
    indices = rng.permutation(sample_size)
    train_size = int(sample_size * 0.8)
    train_idx = indices[:train_size]
    test_idx = indices[train_size:]

    x_train, y_train = design[train_idx], target[train_idx]
    x_test, y_test = design[test_idx], target[test_idx]

    coefficients, _, _, _ = np.linalg.lstsq(x_train, y_train, rcond=None)
    y_pred_train = x_train @ coefficients
    y_pred_test = x_test @ coefficients

    r2_train, rmse_train, mae_train = _calculate_regression_metrics(y_train, y_pred_train)
    r2_test, rmse_test, mae_test = _calculate_regression_metrics(y_test, y_pred_test)

    generalization_gap = float(r2_train - r2_test)

    if r2_test < 0.1:
        stability_label = "Baixa confiabilidade"
        interpretation = (
            "No conjunto de teste, a capacidade explicativa ficou baixa. "
            "Use o modelo para leitura de tendencia e diagnostico, nao para previsao individual."
        )
    elif generalization_gap > 0.15:
        stability_label = "Overfitting"
        interpretation = (
            "O desempenho caiu de forma relevante no teste, indicando baixa generalizacao."
        )
    elif generalization_gap > 0.05:
        stability_label = "Estabilidade moderada"
        interpretation = (
            "O modelo generaliza com alguma perda no teste. Requer monitoramento."
        )
    else:
        stability_label = "Estavel"
        interpretation = (
            "Desempenho proximo entre treino e teste, indicando boa consistencia."
        )

    return {
        "train_size": int(train_size),
        "test_size": int(sample_size - train_size),
        "r2_train": _safe_round(r2_train),
        "r2_test": _safe_round(r2_test),
        "rmse_train": _safe_round(rmse_train),
        "rmse_test": _safe_round(rmse_test),
        "mae_train": _safe_round(mae_train),
        "mae_test": _safe_round(mae_test),
        "generalization_gap": _safe_round(generalization_gap),
        "stability_label": stability_label,
        "interpretation": interpretation,
    }


def _build_practical_recommendations(
    linear_regression: dict[str, object],
    revenue_forecast: dict[str, object],
    hypothesis_tests: list[dict[str, object]],
    confidence_intervals: list[dict[str, object]],
    train_test_validation: dict[str, object],
) -> list[dict[str, object]]:
    recommendations: list[dict[str, object]] = []

    if train_test_validation.get("r2_test", 0.0) < 0.1:
        recommendations.append(
            {
                "priority": "Alta",
                "title": "Usar o modelo para tendencia agregada, nao para previsao individual",
                "recommendation": (
                    "Manter o modelo atual como apoio de diagnostico e construir uma versao com mais variaveis "
                    "de negocio (categoria, estado, sazonalidade e perfil de cliente) para previsao de pedido."
                ),
                "evidence": (
                    f"R2 teste = {float(train_test_validation.get('r2_test', 0.0)):.4f} "
                    f"e qualidade = {linear_regression.get('quality_label', 'N/A')}."
                ),
                "expected_impact": "Evita decisoes operacionais baseadas em previsoes pontuais pouco confiaveis.",
            }
        )

    if revenue_forecast.get("slope", 0.0) > 0:
        recommendations.append(
            {
                "priority": "Media",
                "title": "Planejar capacidade para crescimento esperado de receita",
                "recommendation": (
                    "Ajustar planejamento de estoque e operacao logistica para acompanhar a tendencia "
                    "positiva observada na serie mensal."
                ),
                "evidence": (
                    f"Inclinacao mensal estimada = R$ {float(revenue_forecast.get('slope', 0.0)):.2f} "
                    f"com {int(revenue_forecast.get('sample_size', 0))} meses observados."
                ),
                "expected_impact": "Reduz risco de ruptura operacional diante de aumento de demanda.",
            }
        )
    elif revenue_forecast.get("slope", 0.0) < 0:
        recommendations.append(
            {
                "priority": "Alta",
                "title": "Atuar para conter tendencia de queda da receita",
                "recommendation": (
                    "Priorizar acoes comerciais e revisao de conversao para reverter a inclinacao negativa da serie."
                ),
                "evidence": (
                    f"Inclinacao mensal estimada = R$ {float(revenue_forecast.get('slope', 0.0)):.2f}."
                ),
                "expected_impact": "Mitiga perda de receita nos proximos meses projetados.",
            }
        )

    main_test = hypothesis_tests[0] if hypothesis_tests else None
    if main_test and bool(main_test.get("reject_null", False)):
        recommendations.append(
            {
                "priority": "Alta",
                "title": "Reduzir atrasos para proteger satisfacao do cliente",
                "recommendation": (
                    "Priorizar acoes logisticas em rotas/estados com maior atraso e monitorar NPS/review score apos "
                    "as intervencoes."
                ),
                "evidence": (
                    f"{main_test.get('group_a_label', 'Grupo A')} media {float(main_test.get('group_a_mean', 0.0)):.2f} "
                    f"vs {main_test.get('group_b_label', 'Grupo B')} media {float(main_test.get('group_b_mean', 0.0)):.2f}; "
                    f"p-valor {float(main_test.get('p_value', 1.0)):.6f}."
                ),
                "expected_impact": "Aumenta satisfacao e reduz risco de reputacao por atrasos recorrentes.",
            }
        )

    late_ci = next((item for item in confidence_intervals if item.get("metric_key") == "late_delivery_rate"), None)
    if late_ci is not None:
        recommendations.append(
            {
                "priority": "Media",
                "title": "Definir meta operacional ancorada em intervalo de confianca",
                "recommendation": (
                    "Usar o limite superior do IC da taxa de atraso como teto de controle de curto prazo e perseguir "
                    "reducao progressiva."
                ),
                "evidence": (
                    f"Taxa de atraso estimada = {float(late_ci.get('point_estimate', 0.0)):.2f}% "
                    f"(IC95%: {float(late_ci.get('ci_lower', 0.0)):.2f}% a {float(late_ci.get('ci_upper', 0.0)):.2f}%)."
                ),
                "expected_impact": "Cria meta estatisticamente justificavel para acompanhamento de SLA.",
            }
        )

    return recommendations[:4]


def _build_study_limitations(
    linear_regression: dict[str, object],
    train_test_validation: dict[str, object],
) -> list[str]:
    limitations = [
        "Modelo linear assume relacao aproximadamente linear entre variaveis e alvo.",
        "Nao foram incluiveis variaveis externas de mercado (promocoes, concorrencia, sazonalidade macro).",
    ]

    if float(linear_regression.get("r2", 0.0)) < 0.1:
        limitations.append(
            "Baixa explicacao da variancia no recorte atual: resultados devem ser usados com cautela para previsao individual."
        )
    if float(train_test_validation.get("r2_test", 0.0)) <= 0:
        limitations.append(
            "Desempenho fora da amostra nao superou baseline simples; recomenda-se expandir features e comparar novos modelos."
        )

    return limitations


def get_modeling_summary(
    data_dir: Path,
    filters: DashboardFilters | None = None,
    forecast_horizon_months: int = 3,
) -> dict[str, object]:
    horizon = max(1, int(forecast_horizon_months))
    dataframe = get_consolidated_dataset(data_dir)
    dataframe = apply_dashboard_filters(dataframe, filters)

    if dataframe.empty:
        return _empty_summary(horizon)

    order_level = dataframe.drop_duplicates(subset=["order_id"])
    target_column = "order_payment_value" if "order_payment_value" in order_level.columns else "total_item_value"

    linear_regression = _build_linear_regression(order_level, target_column=target_column)
    revenue_forecast = _build_revenue_forecast(
        order_level,
        target_column=target_column,
        horizon_months=horizon,
    )
    train_test_validation = _build_train_test_validation(order_level, target_column=target_column)
    hypothesis_tests, confidence_intervals = _build_hypothesis_tests(order_level)
    practical_recommendations = _build_practical_recommendations(
        linear_regression=linear_regression,
        revenue_forecast=revenue_forecast,
        hypothesis_tests=hypothesis_tests,
        confidence_intervals=confidence_intervals,
        train_test_validation=train_test_validation,
    )
    study_limitations = _build_study_limitations(
        linear_regression=linear_regression,
        train_test_validation=train_test_validation,
    )

    return {
        "linear_regression": linear_regression,
        "revenue_forecast": revenue_forecast,
        "train_test_validation": train_test_validation,
        "hypothesis_tests": hypothesis_tests,
        "confidence_intervals": confidence_intervals,
        "practical_recommendations": practical_recommendations,
        "study_limitations": study_limitations,
    }
