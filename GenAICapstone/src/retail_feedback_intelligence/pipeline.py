"""Batch pipeline for turning reviews into structured retail intelligence."""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

from retail_feedback_intelligence.evaluation import summarize_results
from retail_feedback_intelligence.llm import LLMConfig, LLMUnavailable, OpenAIChatClient, analyze_with_llm
from retail_feedback_intelligence.prompts import DEFAULT_PROMPT_KEY, PROMPTS
from retail_feedback_intelligence.rules import analyze_with_rules
from retail_feedback_intelligence.schema import ReviewRecord


def read_reviews(path: str | Path, limit: int | None = None) -> list[ReviewRecord]:
    path = Path(path)
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        sample = handle.read(4096)
        handle.seek(0)
        dialect = csv.Sniffer().sniff(sample, delimiters=",;")
        reader = csv.DictReader(handle, dialect=dialect)
        records = [ReviewRecord.from_mapping(row) for row in reader]

    cleaned = [record for record in records if record.review_text.strip()]
    return cleaned[:limit] if limit else cleaned


def analyze_records(
    records: list[ReviewRecord],
    mode: str = "offline",
    prompt_key: str = DEFAULT_PROMPT_KEY,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    if prompt_key not in PROMPTS and mode == "llm":
        raise ValueError(f"Unknown prompt key: {prompt_key}. Choose one of: {', '.join(PROMPTS)}")

    client = _build_client(mode)
    rows: list[dict[str, Any]] = []
    for record in records:
        feedback = (
            analyze_with_llm(record=record, prompt_key=prompt_key, client=client)
            if mode == "llm"
            else analyze_with_rules(record=record, prompt_key="offline_rules")
        )
        row = record.to_source_dict()
        row.update(feedback.to_dict())
        row["Actual_Recommended"] = record.recommended if record.recommended is not None else ""
        rows.append(row)

    summary = summarize_results(rows)
    summary["mode"] = mode
    summary["prompt_key"] = prompt_key if mode == "llm" else "offline_rules"
    return rows, summary


def write_results_csv(rows: list[dict[str, Any]], path: str | Path) -> None:
    if not rows:
        raise ValueError("No rows to write.")
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = list(dict.fromkeys(key for row in rows for key in row.keys()))
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_summary_json(summary: dict[str, Any], path: str | Path) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(summary, indent=2), encoding="utf-8")


def _build_client(mode: str) -> OpenAIChatClient | None:
    if mode == "offline":
        return None
    if mode != "llm":
        raise ValueError("mode must be 'offline' or 'llm'")
    try:
        return OpenAIChatClient(LLMConfig.from_env())
    except LLMUnavailable:
        raise
