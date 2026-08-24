"""Deterministic fallback analyzer for demos, tests, and recruiter review."""

from __future__ import annotations

import re

from retail_feedback_intelligence.schema import ReviewRecord, StructuredFeedback

VALID_FEEDBACK_TYPES = {"Product", "Service", "Mixed", "Other"}
VALID_URGENCY_LEVELS = {"High", "Medium", "Low"}

PRODUCT_TERMS = {
    "fit",
    "size",
    "sizing",
    "fabric",
    "material",
    "quality",
    "color",
    "photo",
    "image",
    "dress",
    "top",
    "pants",
    "skirt",
    "sweater",
    "zipper",
    "seam",
    "style",
    "design",
    "comfort",
    "petite",
    "runs small",
    "runs large",
    "wash",
}

SERVICE_TERMS = {
    "delivery",
    "shipping",
    "ship",
    "late",
    "delay",
    "return",
    "exchange",
    "refund",
    "support",
    "customer service",
    "order",
    "package",
    "store pickup",
}

AFTERSALE_TERMS = {"return", "returned", "exchange", "refund"}

CATEGORY_TERMS = {
    "Fit/Sizing": {"fit", "size", "sizing", "tight", "loose", "small", "large", "petite", "bust", "waist", "long", "short"},
    "Product Quality": {"quality", "fabric", "material", "zipper", "broke", "broken", "stitch", "ripped", "hole", "thin", "transparent", "wash", "durable"},
    "Color/Image Accuracy": {"photo", "image", "pictured", "shown", "online", "different", "darker", "lighter", "mismatch"},
    "Delivery/Service": SERVICE_TERMS,
    "Comfort": {"comfortable", "comfort", "soft", "itchy", "scratchy", "wear", "all-day"},
    "Style/Design": {"style", "design", "cute", "flattering", "beautiful", "gorgeous", "dressy", "casual"},
    "Price/Value": {"price", "expensive", "cheap", "worth", "value", "sale"},
}

POSITIVE_TERMS = {
    "love",
    "loved",
    "great",
    "perfect",
    "beautiful",
    "flattering",
    "comfortable",
    "soft",
    "recommend",
    "favorite",
    "happy",
    "excellent",
    "amazing",
}

NEGATIVE_TERMS = {
    "return",
    "returned",
    "disappointed",
    "terrible",
    "awful",
    "cheap",
    "poor",
    "bad",
    "small",
    "large",
    "tight",
    "loose",
    "thin",
    "see through",
    "transparent",
    "late",
    "broken",
    "defective",
    "ripped",
    "hole",
    "itchy",
}

HIGH_URGENCY_TERMS = {
    "defective",
    "damaged",
    "ripped",
    "hole",
    "broke",
    "broken",
    "cannot wear",
    "can't wear",
    "unwearable",
    "never arrived",
    "wrong item",
    "terrible",
    "awful",
}


def analyze_with_rules(record: ReviewRecord, prompt_key: str = "offline_rules") -> StructuredFeedback:
    text = clean_text(record.review_text)
    category = infer_category(text)
    feedback_type = infer_feedback_type(text, category)
    sentiment = infer_sentiment(text, record.rating)
    urgency = infer_urgency(text, sentiment, category)
    summary = build_summary(category, sentiment)
    message = build_customer_message(sentiment, category)
    insight = build_retail_insight(category, urgency, feedback_type)
    flag, reason = predict_recommendation(record, sentiment, text)

    return StructuredFeedback(
        Feedback_Type=feedback_type,
        Category=category,
        Sentiment=sentiment,
        Urgency_Level=urgency,
        Summary=summary,
        Personalized_Message=message,
        Retail_Insight=insight,
        Recommended_Flag=flag,
        Recommendation_Reason=reason,
        Model_Mode="offline",
        Prompt_Version=prompt_key,
    )


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def infer_feedback_type(review_text: str = "", category: str = "", summary: str = "", retail_insight: str = "") -> str:
    combined = " ".join([review_text, category, summary, retail_insight]).lower()
    has_product = _has_any(combined, PRODUCT_TERMS)
    has_core_service = _has_any(combined, SERVICE_TERMS - AFTERSALE_TERMS)
    has_aftersale = _has_any(combined, AFTERSALE_TERMS)
    if has_product and has_core_service:
        return "Mixed"
    if has_product:
        return "Product"
    if has_core_service or has_aftersale:
        return "Service"
    return "Other"


def infer_category(review_text: str) -> str:
    lowered = review_text.lower()
    if _has_any(lowered, {"zipper", "broke", "broken", "ripped", "hole", "thin", "transparent", "see through"}):
        return "Product Quality"
    if _has_any(lowered, {"too small", "too large", "runs small", "runs large", "tight", "loose"}) or (
        _has_any(lowered, {"fit", "fits", "size", "sizing", "waist", "bust", "petite"})
        and _has_any(lowered, {"small", "large", "long", "short", "true to size", "perfect"})
    ):
        return "Fit/Sizing"
    if "color" in lowered and _has_any(lowered, {"different", "darker", "lighter", "nothing like", "mismatch", "not match", "not like"}):
        return "Color/Image Accuracy"
    if _has_any(lowered, SERVICE_TERMS - AFTERSALE_TERMS):
        return "Delivery/Service"

    scores = {
        category: sum(1 for term in terms if term in lowered)
        for category, terms in CATEGORY_TERMS.items()
    }
    best_category, best_score = max(scores.items(), key=lambda item: item[1])
    return best_category if best_score > 0 else "General Experience"


def infer_sentiment(review_text: str, rating: float | None = None) -> str:
    lowered = review_text.lower()
    positive_hits = sum(1 for term in POSITIVE_TERMS if term in lowered)
    negative_hits = sum(1 for term in NEGATIVE_TERMS if term in lowered)

    if rating is not None:
        if rating >= 4 and negative_hits == 0:
            return "Positive"
        if rating <= 2 and positive_hits == 0:
            return "Negative"

    if positive_hits and negative_hits:
        return "Neutral"
    if negative_hits:
        return "Negative"
    if positive_hits:
        return "Positive"
    if rating is not None:
        if rating >= 4:
            return "Positive"
        if rating <= 2:
            return "Negative"
    return "Neutral"


def infer_urgency(review_text: str, sentiment: str = "", category: str = "", summary: str = "") -> str:
    combined = " ".join([review_text, sentiment, category, summary]).lower()
    sentiment_clean = str(sentiment).strip().lower()
    if sentiment_clean == "negative" and _has_any(combined, HIGH_URGENCY_TERMS):
        return "High"
    if sentiment_clean == "negative":
        return "Medium"
    if sentiment_clean != "positive" and (_has_any(combined, NEGATIVE_TERMS) or category in {"Fit/Sizing", "Product Quality", "Color/Image Accuracy", "Delivery/Service"}):
        return "Medium"
    return "Low"


def normalize_feedback_type(value: str, review_text: str = "", category: str = "", summary: str = "", retail_insight: str = "") -> str:
    cleaned = str(value or "").strip().title()
    if cleaned in VALID_FEEDBACK_TYPES:
        return cleaned
    return infer_feedback_type(review_text, category, summary, retail_insight)


def normalize_urgency_level(value: str, review_text: str = "", sentiment: str = "", category: str = "", summary: str = "") -> str:
    cleaned = str(value or "").strip().title()
    if cleaned in VALID_URGENCY_LEVELS:
        return cleaned
    return infer_urgency(review_text, sentiment, category, summary)


def build_summary(category: str, sentiment: str) -> str:
    if sentiment == "Positive":
        return f"The review highlights a positive {category.lower()} experience."
    if sentiment == "Negative":
        return f"The review flags a negative {category.lower()} issue that needs attention."
    return f"The review contains mixed or limited feedback about {category.lower()}."


def build_customer_message(sentiment: str, category: str) -> str:
    if sentiment == "Positive":
        return "Thank you for sharing this feedback; we are glad the product experience worked well for you."
    if sentiment == "Negative":
        return f"Thank you for flagging this {category.lower()} issue; your feedback helps us improve the experience."
    return "Thank you for the thoughtful feedback; we appreciate the details about what worked and what could improve."


def build_retail_insight(category: str, urgency: str, feedback_type: str) -> str:
    if urgency == "High":
        return f"Escalate this {feedback_type.lower()} feedback for human review and track recurring {category.lower()} complaints."
    if urgency == "Medium":
        return f"Monitor {category.lower()} patterns and route recurring issues to the responsible retail team."
    return f"Use positive {category.lower()} feedback to strengthen product positioning and merchandising copy."


def predict_recommendation(record: ReviewRecord, sentiment: str, review_text: str) -> tuple[int, str]:
    lowered = review_text.lower()
    if _has_any(lowered, {"darker than", "lighter than", "nothing like", "not match", "different color"}):
        return 0, "Color or image mismatch suggests low recommendation intent."
    if record.rating is not None:
        if record.rating >= 4 and "return" not in lowered:
            return 1, "High rating and no strong return signal."
        if record.rating <= 2:
            return 0, "Low rating indicates the customer is unlikely to recommend."
    if sentiment == "Positive":
        return 1, "Positive review language suggests recommendation intent."
    if sentiment == "Negative":
        return 0, "Negative issue language suggests low recommendation intent."
    if "return" in lowered or "disappointed" in lowered:
        return 0, "Mixed review includes a strong return or disappointment signal."
    return 1, "Balanced feedback without a severe issue is treated as recommendable."


def _has_any(text: str, terms: set[str]) -> bool:
    return any(term in text for term in terms)
