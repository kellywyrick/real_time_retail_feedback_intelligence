# Case Study: Real-Time Retail Feedback Intelligence

## Executive Summary

ChicStyle receives large spikes of unstructured customer reviews during peak retail periods. The original notebook proved that a GenAI workflow can turn those reviews into structured operational fields: feedback type, issue category, sentiment, urgency, customer response, and business insight.

This repository turns the notebook into a production-style portfolio project with reusable code, a no-key offline demo, optional OpenAI execution, test coverage, CI, and a clear case-study narrative.

## Business Problem

Traditional sentiment analysis can tell whether a review is broadly positive or negative, but retail teams need more actionable routing:

- Is the issue about product quality, fit, service, delivery, color accuracy, or something else?
- How urgent is the review?
- Which team should act on the signal?
- What customer-facing response can be drafted safely?
- Which recurring product issues should merchandising and quality teams investigate?

## Solution

The pipeline analyzes review text and emits seven structured fields:

1. `Feedback_Type`: Product, Service, Mixed, or Other
2. `Category`: specific retail issue or praise area
3. `Sentiment`: Positive, Negative, or Neutral
4. `Urgency_Level`: High, Medium, or Low
5. `Summary`: concise customer feedback summary
6. `Personalized_Message`: safe draft customer response
7. `Retail_Insight`: business action for retail teams

The project also predicts recommendation intent when labels are available, enabling comparison against the source dataset's `Recommended.IND` field.

## Dataset

The source file is a semicolon-delimited retail reviews CSV with product metadata, review text, star ratings, and a `Recommended.IND` label. After rows with empty review text are removed, the full local dataset contains 22,641 usable reviews.

For GitHub, the full dataset is kept locally in ignored `data/raw/retail_feedback_reviews.csv`, while `data/sample_reviews.csv` provides a curated 12-row sample drawn from the same source file.

## Prompt Strategy

The notebook compared zero-shot, few-shot, and chain-of-thought prompt designs. The final production design uses CoT V2 because it tied for the strongest rounded judge score while producing operationally useful urgency routing.

| Prompt version | Average judge score |
| --- | ---: |
| Zero-Shot V1 | 0.91 |
| Zero-Shot V2 | 0.91 |
| Few-Shot V1 | 0.90 |
| Few-Shot V2 | 0.92 |
| CoT V1 | 0.90 |
| CoT V2 | 0.92 |

## Recommendation Intent Evaluation

On the evaluated 50-review notebook sample, the recommendation-intent workflow reached 80.0% accuracy.

| Actual / Predicted | Not recommended | Recommended |
| --- | ---: | ---: |
| Not recommended | 12 | 0 |
| Recommended | 10 | 28 |

Interpretation: the workflow was conservative. It was strong at catching non-recommended reviews, but missed some cases where customers still recommended the product despite fit or quality concerns.

## Offline Full-Dataset Sanity Check

The repository includes a deterministic offline analyzer so reviewers can run the project without API keys. On the full local dataset, this no-key path processed 22,641 reviews with 100.0% structured parse success and 89.6% recommendation-label accuracy.

This offline score is a runnable engineering sanity check, not a replacement for the original LLM prompt evaluation.

## Why This Is Portfolio-Ready

- Converts a Colab workflow into a reusable Python package.
- Includes deterministic offline execution so reviewers can run the project without secrets.
- Keeps the original GenAI prompt registry and optional OpenAI path.
- Adds tests for parsing, heuristic fallback behavior, and batch processing.
- Documents the business value, evaluation method, and production limitations.

## Production Considerations

- Use a human-labeled benchmark for feedback type and urgency before rollout.
- Monitor parse success, latency, API cost, score drift, and human override rate.
- Keep human review for high-urgency complaints and customer-facing messages.
- Connect outputs to support tickets, merchandising workflows, and product quality review.
