"""Command line interface for the retail feedback intelligence pipeline."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from retail_feedback_intelligence.llm import LLMUnavailable
from retail_feedback_intelligence.pipeline import analyze_records, read_reviews, write_results_csv, write_summary_json
from retail_feedback_intelligence.prompts import DEFAULT_PROMPT_KEY, PROMPTS


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Analyze retail customer reviews into structured feedback intelligence.")
    parser.add_argument("input", help="CSV file with Review.Text and optional retail metadata columns.")
    parser.add_argument("--output", default="outputs/retail_feedback_predictions.csv", help="Output CSV path.")
    parser.add_argument("--summary-output", default="outputs/retail_feedback_summary.json", help="Output JSON summary path.")
    parser.add_argument("--mode", choices=["offline", "llm"], default="offline", help="Use offline rules or the OpenAI-backed LLM path.")
    parser.add_argument("--prompt", choices=sorted(PROMPTS), default=DEFAULT_PROMPT_KEY, help="Prompt version for --mode llm.")
    parser.add_argument("--limit", type=int, default=None, help="Optional maximum number of rows to process.")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        records = read_reviews(Path(args.input), limit=args.limit)
        rows, summary = analyze_records(records=records, mode=args.mode, prompt_key=args.prompt)
        write_results_csv(rows, args.output)
        write_summary_json(summary, args.summary_output)
    except (ValueError, FileNotFoundError, LLMUnavailable, RuntimeError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    print(f"Analyzed {summary['records']} review(s) with mode={summary['mode']}.")
    print(f"Parse success rate: {summary['parse_success_rate']:.1%}")
    if "recommendation_metrics" in summary and summary["recommendation_metrics"].get("evaluated_records"):
        metrics = summary["recommendation_metrics"]
        print(f"Recommendation accuracy: {metrics['accuracy']:.1%} on {metrics['evaluated_records']} labeled review(s).")
    print(f"Wrote predictions to {args.output}")
    print(f"Wrote summary to {args.summary_output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
