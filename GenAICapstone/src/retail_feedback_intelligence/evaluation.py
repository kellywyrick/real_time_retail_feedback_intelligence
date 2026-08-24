"""Evaluation utilities for portfolio reporting."""

from __future__ import annotations

from collections import Counter
from typing import Any, Iterable

from retail_feedback_intelligence.schema import STRUCTURED_FIELDS


NOTEBOOK_PROMPT_RESULTS = [
    {"Prompt_Version": "Zero-Shot V1", "Average_Judge_Score": 0.91},
    {"Prompt_Version": "Zero-Shot V2", "Average_Judge_Score": 0.91},
    {"Prompt_Version": "Few-Shot V1", "Average_Judge_Score": 0.90},
    {"Prompt_Version": "Few-Shot V2", "Average_Judge_Score": 0.92},
    {"Prompt_Version": "CoT V1", "Average_Judge_Score": 0.90},
    {"Prompt_Version": "CoT V2", "Average_Judge_Score": 0.92},
]

NOTEBOOK_RECOMMENDATION_METRICS = {
    "accuracy": 0.80,
    "confusion_matrix": [[12, 0], [10, 28]],
    "not_recommended_precision": 0.545,
    "recommended_precision": 1.000,
}


def summarize_results(rows: Iterable[dict[str, Any]]) -> dict[str, Any]:
    rows = list(rows)
    total = len(rows)
    if total == 0:
        return {"records": 0, "parse_success_rate": 0.0, "sentiment_counts": {}, "urgency_counts": {}}

    parse_success = sum(_has_required_fields(row) for row in rows) / total
    return {
        "records": total,
        "parse_success_rate": round(parse_success, 3),
        "sentiment_counts": dict(Counter(str(row.get("Sentiment", "Missing") or "Missing") for row in rows)),
        "urgency_counts": dict(Counter(str(row.get("Urgency_Level", "Missing") or "Missing") for row in rows)),
        "feedback_type_counts": dict(Counter(str(row.get("Feedback_Type", "Missing") or "Missing") for row in rows)),
        "recommendation_metrics": recommendation_metrics(rows),
    }


def recommendation_metrics(rows: Iterable[dict[str, Any]]) -> dict[str, Any]:
    pairs: list[tuple[int, int]] = []
    for row in rows:
        actual = _parse_int(row.get("Actual_Recommended", row.get("Recommended.IND", "")))
        predicted = _parse_int(row.get("Recommended_Flag", ""))
        if actual is not None and predicted is not None:
            pairs.append((actual, predicted))

    if not pairs:
        return {"evaluated_records": 0}

    true_negative = sum(1 for actual, predicted in pairs if actual == 0 and predicted == 0)
    false_positive = sum(1 for actual, predicted in pairs if actual == 0 and predicted == 1)
    false_negative = sum(1 for actual, predicted in pairs if actual == 1 and predicted == 0)
    true_positive = sum(1 for actual, predicted in pairs if actual == 1 and predicted == 1)
    accuracy = (true_positive + true_negative) / len(pairs)
    return {
        "evaluated_records": len(pairs),
        "accuracy": round(accuracy, 3),
        "confusion_matrix": [[true_negative, false_positive], [false_negative, true_positive]],
    }


def _has_required_fields(row: dict[str, Any]) -> bool:
    return all(str(row.get(field, "")).strip() for field in STRUCTURED_FIELDS)


def _parse_int(value: Any) -> int | None:
    try:
        if value in (None, ""):
            return None
        return int(float(value))
    except (TypeError, ValueError):
        return None
