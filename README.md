# Real-Time Retail Feedback Intelligence

A GenAI project that turns fashion retail reviews into structured, actionable customer intelligence.

## What It Does

For each customer review, the pipeline returns:

- `Feedback_Type`: Product, Service, Mixed, or Other
- `Category`: fit, sizing, quality, color accuracy, delivery, comfort, value, or general experience
- `Sentiment`: Positive, Negative, or Neutral
- `Urgency_Level`: High, Medium, or Low
- `Summary`: concise review summary
- `Personalized_Message`: safe customer-facing draft response
- `Retail_Insight`: operational action for retail teams
- `Recommended_Flag`: predicted recommendation intent

## Results From The Notebook

| Evaluation | Result |
| --- | ---: |
| Best average LLM-as-judge score | 0.92 |
| Top prompt designs | Few-Shot V2 and CoT V2 |
| Selected production prompt | CoT V2 |
| Recommendation-intent accuracy | 80.0% |

The recommendation model was intentionally conservative: it caught all non-recommended examples in the evaluated sample, but missed some customers who still recommended a product despite mixed feedback.

## Dataset

The full source CSV should live locally at `data/raw/retail_feedback_reviews.csv`. That path is ignored by Git so the public repo stays lightweight and avoids publishing the full raw dataset.

This repo includes `data/sample_reviews.csv`, a curated 12-row sample drawn from the provided dataset. The full local file contains 22,641 usable reviews after dropping empty `Review.Text` rows.

Offline sanity check on the full local dataset:

| Check | Result |
| --- | ---: |
| Reviews processed | 22,641 |
| Structured parse success | 100.0% |
| Recommendation-label accuracy | 89.6% |

## Quickstart

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
retail-feedback data/sample_reviews.csv --mode offline --limit 12
python -m unittest discover -s tests
```

The offline mode is deterministic and does not require an API key, which makes the project easy for recruiters and reviewers to run.

To run the no-key demo on the full local dataset:

```bash
retail-feedback data/raw/retail_feedback_reviews.csv --mode offline \
  --output outputs/full_offline_predictions.csv \
  --summary-output outputs/full_offline_summary.json
```

## Optional LLM Mode

```bash
cp .env.example .env
export OPENAI_API_KEY="sk-your-key-here"
export OPENAI_MODEL="gpt-4o-mini"
pip install -e ".[llm]"
retail-feedback data/sample_reviews.csv --mode llm --prompt cot_v2 --limit 5
```

If you use a compatible hosted endpoint, set `OPENAI_BASE_URL`.

## Repository Map

```text
src/retail_feedback_intelligence/
  cli.py          Command-line entrypoint
  pipeline.py     Batch CSV processing
  prompts.py      Prompt registry from the notebook
  parsing.py      Robust JSON/labeled-line parser
  rules.py        No-key deterministic demo analyzer
  evaluation.py   Metrics and notebook benchmark results
data/
  README.md
  sample_reviews.csv
notebooks/
  Real_Time_Retail_Feedback_Intelligence.ipynb
reports/
  case_study.md
tests/
  test_parsing.py
  test_pipeline.py
  test_rules.py
```

## Next Improvements

- Add a human-labeled benchmark for feedback type and urgency.
- Track API cost, latency, parse failures, and human override rate.
- Add a lightweight review-ops dashboard for support and merchandising teams.
- Connect outputs to returns, support tickets, and product-level revenue data.
