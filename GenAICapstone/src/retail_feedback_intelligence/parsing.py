"""Parsing helpers for LLM responses and evaluator outputs."""

from __future__ import annotations

import json
import re

from retail_feedback_intelligence.rules import normalize_feedback_type, normalize_urgency_level
from retail_feedback_intelligence.schema import STRUCTURED_FIELDS, StructuredFeedback


KEY_MAP = {
    "feedback type": "Feedback_Type",
    "feedback_type": "Feedback_Type",
    "type": "Feedback_Type",
    "category": "Category",
    "sentiment": "Sentiment",
    "urgency level": "Urgency_Level",
    "urgency_level": "Urgency_Level",
    "urgency": "Urgency_Level",
    "summary": "Summary",
    "personalized message": "Personalized_Message",
    "personalized_message": "Personalized_Message",
    "retail insight": "Retail_Insight",
    "retail_insight": "Retail_Insight",
}


def parse_structured_feedback(raw_text: str, review_text: str = "", prompt_key: str = "", mode: str = "llm") -> StructuredFeedback:
    output = {field: "" for field in STRUCTURED_FIELDS}
    text = raw_text or ""

    parsed_json = _parse_json_object(text)
    if parsed_json:
        for key, value in parsed_json.items():
            mapped_key = KEY_MAP.get(_normalize_key(key))
            if mapped_key:
                output[mapped_key] = str(value).strip()
    else:
        output.update(_parse_labeled_lines(text))

    output["Feedback_Type"] = normalize_feedback_type(
        output.get("Feedback_Type", ""),
        review_text=review_text,
        category=output.get("Category", ""),
        summary=output.get("Summary", ""),
        retail_insight=output.get("Retail_Insight", ""),
    )
    output["Urgency_Level"] = normalize_urgency_level(
        output.get("Urgency_Level", ""),
        review_text=review_text,
        sentiment=output.get("Sentiment", ""),
        category=output.get("Category", ""),
        summary=output.get("Summary", ""),
    )
    output["Sentiment"] = _normalize_sentiment(output.get("Sentiment", ""))

    return StructuredFeedback(**output, Model_Mode=mode, Prompt_Version=prompt_key)


def parse_recommendation_reply(raw_text: str | None) -> tuple[int | None, str, str]:
    if raw_text is None:
        return None, "", ""
    text = str(raw_text).strip()
    flag_match = re.search(r"Recommended\s*:\s*([01])\b", text, re.IGNORECASE)
    reason_match = re.search(r"Reason\s*:\s*(.+)", text, re.IGNORECASE | re.DOTALL)
    flag = int(flag_match.group(1)) if flag_match else None
    reason = reason_match.group(1).strip().replace("\n", " ")[:200] if reason_match else ""
    return flag, reason, text


def parse_numeric_score(raw_text: str | None) -> float | None:
    if raw_text is None:
        return None
    match = re.search(r"0(?:\.\d+)?|1(?:\.0+)?", str(raw_text))
    if not match:
        return None
    return max(0.0, min(1.0, float(match.group(0))))


def _parse_json_object(text: str) -> dict[str, object] | None:
    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        return None


def _parse_labeled_lines(text: str) -> dict[str, str]:
    output = {field: "" for field in STRUCTURED_FIELDS}
    for line in [line.strip() for line in text.splitlines() if line.strip()]:
        line = re.sub(r"^[\-*\d.)\s]+", "", line)
        if ":" not in line:
            continue
        key_raw, value = line.split(":", 1)
        mapped_key = KEY_MAP.get(_normalize_key(key_raw))
        if mapped_key:
            output[mapped_key] = value.strip()
    return output


def _normalize_key(value: object) -> str:
    return str(value).strip().lower().replace("-", " ").replace("_", " ")


def _normalize_sentiment(value: str) -> str:
    text = str(value or "").strip().lower()
    if "positive" in text:
        return "Positive"
    if "negative" in text:
        return "Negative"
    if "neutral" in text or "mixed" in text:
        return "Neutral"
    return str(value or "").strip().title()
