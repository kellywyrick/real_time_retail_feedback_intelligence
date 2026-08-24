"""Prompt registry adapted from the original Colab notebook."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class PromptTemplate:
    key: str
    label: str
    text: str


ZERO_SHOT_V1 = """Analyze the customer review and return exactly seven lines in this format:
Feedback Type: <Product, Service, Mixed, or Other>
Category: <main issue or praise area>
Sentiment: <Positive, Negative, or Neutral>
Urgency Level: <High, Medium, or Low>
Summary: <one concise sentence>
Personalized Message: <one empathetic customer-facing sentence>
Retail Insight: <one actionable business insight>"""

ZERO_SHOT_V2 = """You are analyzing real-time holiday-season reviews for ChicStyle, a fashion retail platform. Accuracy matters because delayed or incorrect review handling can damage customer trust during peak sales periods.

Classify the review using retail business context. Prioritize issues related to fit, sizing, product quality, comfort, color/image mismatch, delivery/service, and value.

Feedback Type rules:
- Product: the review is mainly about the item, fit, size, fabric, color, quality, comfort, or style.
- Service: the review is mainly about delivery, shipping, returns, support, store pickup, or order experience.
- Mixed: the review includes both product and service issues.
- Other: the review does not clearly fit product or service.

Urgency Level rules:
- High: serious negative complaint, defect, unusable item, strongly dissatisfied customer, or issue needing fast follow-up.
- Medium: fixable fit, quality, color, delivery, or expectation issue that should be monitored or addressed.
- Low: positive review, minor suggestion, or no immediate operational risk.

If a review contains mixed feedback, choose Neutral unless the overall tone clearly leans positive or negative.

Return exactly seven lines and no extra commentary:
Feedback Type: <Product, Service, Mixed, or Other>
Category: <specific business category>
Sentiment: <Positive, Negative, or Neutral>
Urgency Level: <High, Medium, or Low>
Summary: <one concise sentence grounded in the review>
Personalized Message: <one empathetic customer-facing sentence>
Retail Insight: <one actionable business insight for ChicStyle>"""

FEW_SHOT_V2 = """You are ChicStyle's retail feedback analyst. Use the examples and rules below to produce consistent structured outputs.

Rules:
1. Feedback Type must be exactly Product, Service, Mixed, or Other.
2. Category must be specific, such as Fit/Sizing, Product Quality, Style/Design, Comfort, Color/Image Accuracy, Delivery/Service, Price/Value, or General Experience.
3. Sentiment must be exactly Positive, Negative, or Neutral. Use Neutral for mixed reviews with balanced praise and criticism.
4. Urgency Level must be exactly High, Medium, or Low.
5. Summary must be factual and no more than 25 words.
6. Personalized Message must be customer-facing, empathetic, and should not promise refunds or actions not stated in the review.
7. Retail Insight must be useful for merchandising, product, quality, support, or e-commerce teams.

Urgency guide:
- High: severe complaint, unusable/defective item, strong dissatisfaction, or issue requiring immediate human follow-up.
- Medium: fit, quality, color, delivery, or expectation issue that should be monitored and addressed.
- Low: positive feedback, minor suggestion, or no urgent operational risk.

Example 1
Review: I love the pants. They fit true to size and the fabric is comfortable enough for all-day wear.
Feedback Type: Product
Category: Fit/Sizing and Comfort
Sentiment: Positive
Urgency Level: Low
Summary: The customer is pleased with the true-to-size fit and comfortable fabric.
Personalized Message: Thank you for the feedback; we are happy the fit and comfort worked well for you.
Retail Insight: Promote true-to-size fit and comfort in product messaging.

Example 2
Review: The dress is pretty, but it arrived two days late and the zipper broke the first time I wore it.
Feedback Type: Mixed
Category: Delivery/Service and Product Quality
Sentiment: Negative
Urgency Level: High
Summary: The customer liked the appearance but had late delivery and a zipper failure.
Personalized Message: We are sorry the delivery and zipper quality fell short and appreciate you flagging this.
Retail Insight: Escalate zipper durability and late-delivery complaints for quality and support review.

Example 3
Review: The sweater is soft, but the sleeves stretched out quickly after wearing it once.
Feedback Type: Product
Category: Product Quality
Sentiment: Neutral
Urgency Level: Medium
Summary: The customer liked the sweater's softness but noticed poor sleeve recovery after one wear.
Personalized Message: Thank you for sharing this; we are glad the sweater felt soft but sorry the sleeves stretched out.
Retail Insight: Investigate sleeve recovery and fabric durability while preserving softness.

Now analyze the new review. Return exactly seven lines and no extra text:
Feedback Type: <Product, Service, Mixed, or Other>
Category: <main issue or praise area>
Sentiment: <Positive, Negative, or Neutral>
Urgency Level: <High, Medium, or Low>
Summary: <one concise sentence>
Personalized Message: <one empathetic customer-facing sentence>
Retail Insight: <one actionable business insight>"""

COT_V2 = """You are ChicStyle's real-time retail feedback analyst during a high-volume holiday sales period.

Before answering, reason internally through these steps:
1. Decide whether the feedback type is Product, Service, Mixed, or Other.
2. Identify whether the review is mainly about fit/sizing, quality, style/design, comfort, color/image accuracy, delivery/service, price/value, or general experience.
3. Determine whether the overall sentiment is Positive, Negative, or Neutral, treating balanced mixed feedback as Neutral.
4. Assign urgency as High, Medium, or Low based on customer impact and operational risk.
5. Separate the customer's emotional experience from the business action ChicStyle should take.
6. Decide what customer support should acknowledge and what the merchandising/product team should learn.

Do not show the reasoning. Return exactly seven lines and no extra commentary:
Feedback Type: <Product, Service, Mixed, or Other>
Category: <specific business category>
Sentiment: <Positive, Negative, or Neutral>
Urgency Level: <High, Medium, or Low>
Summary: <one factual sentence of 25 words or fewer>
Personalized Message: <one empathetic customer-facing sentence>
Retail Insight: <one actionable business insight for ChicStyle>"""

PROMPTS = {
    "zero_shot_v1": PromptTemplate("zero_shot_v1", "Zero-Shot V1", ZERO_SHOT_V1),
    "zero_shot_v2": PromptTemplate("zero_shot_v2", "Zero-Shot V2", ZERO_SHOT_V2),
    "few_shot_v2": PromptTemplate("few_shot_v2", "Few-Shot V2", FEW_SHOT_V2),
    "cot_v2": PromptTemplate("cot_v2", "CoT V2", COT_V2),
}

DEFAULT_PROMPT_KEY = "cot_v2"

JUDGE_PROMPT = """You are an impartial evaluator for a retail feedback intelligence system.
Score the generated output against the original review.

Rubric:
- 0.15 correct feedback type: Product, Service, Mixed, or Other
- 0.15 useful and specific business category
- 0.15 correct sentiment and tone interpretation
- 0.15 appropriate urgency level: High, Medium, or Low
- 0.15 accurate and concise summary
- 0.10 empathetic, specific personalized message
- 0.15 actionable retail insight

Return only one decimal number from 0 to 1. Do not include words, bullets, or explanations.

{output}
"""

RECOMMENDATION_PROMPT = """Predict whether the customer would recommend the product based only on the review text.

Return exactly two lines:
Recommended: <1 if the customer would recommend, otherwise 0>
Reason: <brief reason using 20 words or fewer>

Rules:
- Use 1 for clearly positive or recommendable experiences.
- Use 0 for clearly negative experiences, returns, poor fit, defects, misleading photos, or strong dissatisfaction.
- For mixed reviews, choose the label that best matches the customer's overall likelihood to recommend.
- Do not include any extra text.
"""
