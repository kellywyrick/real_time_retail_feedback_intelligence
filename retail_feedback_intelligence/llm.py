"""Optional OpenAI-backed analysis path."""

from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Any

from retail_feedback_intelligence.parsing import parse_recommendation_reply, parse_structured_feedback
from retail_feedback_intelligence.prompts import PROMPTS, RECOMMENDATION_PROMPT
from retail_feedback_intelligence.schema import ReviewRecord, StructuredFeedback


class LLMUnavailable(RuntimeError):
    """Raised when the LLM path is requested but cannot be initialized."""


@dataclass(frozen=True)
class LLMConfig:
    api_key: str
    model: str = "gpt-4o-mini"
    base_url: str | None = None

    @classmethod
    def from_env(cls) -> "LLMConfig":
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not api_key:
            raise LLMUnavailable("OPENAI_API_KEY is required for --mode llm. Use --mode offline for a no-key demo.")
        base_url = os.getenv("OPENAI_BASE_URL", "").strip() or None
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"
        return cls(api_key=api_key, model=model, base_url=base_url)


class OpenAIChatClient:
    def __init__(self, config: LLMConfig):
        try:
            from openai import OpenAI
        except ImportError as exc:
            raise LLMUnavailable("Install the LLM extras with `pip install -e .[llm]` to use --mode llm.") from exc

        self.config = config
        kwargs: dict[str, Any] = {"api_key": config.api_key}
        if config.base_url:
            kwargs["base_url"] = config.base_url
        self._client = OpenAI(**kwargs)

    def complete(self, messages: list[dict[str, str]], temperature: float = 0.0, max_tokens: int = 500) -> str:
        response = self._client.chat.completions.create(
            model=self.config.model,
            temperature=temperature,
            max_tokens=max_tokens,
            messages=messages,
        )
        return response.choices[0].message.content or ""


def analyze_with_llm(
    record: ReviewRecord,
    prompt_key: str,
    client: OpenAIChatClient,
    max_retries: int = 3,
    base_wait: float = 1.0,
) -> StructuredFeedback:
    prompt = PROMPTS[prompt_key].text
    raw = _complete_with_retries(
        client=client,
        messages=[
            {"role": "system", "content": "You are a precise retail feedback analyst. Return only the requested labeled fields."},
            {"role": "user", "content": f"{prompt}\n\nReview: {record.review_text}"},
        ],
        max_tokens=500,
        max_retries=max_retries,
        base_wait=base_wait,
    )
    feedback = parse_structured_feedback(raw, review_text=record.review_text, prompt_key=prompt_key, mode="llm")
    flag, reason = predict_recommendation_with_llm(record, client, max_retries=max_retries, base_wait=base_wait)
    feedback.Recommended_Flag = flag
    feedback.Recommendation_Reason = reason
    return feedback


def predict_recommendation_with_llm(
    record: ReviewRecord,
    client: OpenAIChatClient,
    max_retries: int = 3,
    base_wait: float = 1.0,
) -> tuple[int | None, str]:
    raw = _complete_with_retries(
        client=client,
        messages=[{"role": "user", "content": f"{RECOMMENDATION_PROMPT}\n\nReview:\n{record.review_text}"}],
        max_tokens=80,
        max_retries=max_retries,
        base_wait=base_wait,
    )
    flag, reason, _ = parse_recommendation_reply(raw)
    return flag, reason


def _complete_with_retries(
    client: OpenAIChatClient,
    messages: list[dict[str, str]],
    max_tokens: int,
    max_retries: int,
    base_wait: float,
) -> str:
    last_error: Exception | None = None
    for attempt in range(1, max_retries + 1):
        try:
            return client.complete(messages=messages, temperature=0.0, max_tokens=max_tokens)
        except Exception as exc:
            last_error = exc
            if attempt == max_retries:
                break
            time.sleep(min(base_wait * attempt, 10))
    raise RuntimeError(f"LLM request failed after {max_retries} attempts: {last_error}")
