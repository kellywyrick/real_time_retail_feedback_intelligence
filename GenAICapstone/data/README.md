# Data

This repo includes `sample_reviews.csv`, a curated 12-row sample drawn from the provided retail feedback dataset so the project can run immediately on GitHub.

The full dataset is intentionally not committed. Keep it locally at:

```text
data/raw/retail_feedback_reviews.csv
```

That path is ignored by Git. The pipeline supports the source file's semicolon-delimited schema:

- `Clothing.ID`
- `Age`
- `Title`
- `Review.Text`
- `Rating`
- `Recommended.IND`
- `Positive.Feedback.Count`
- `Division.Name`
- `Department.Name`
- `Class.Name`

The provided full dataset contains 22,641 usable reviews after dropping rows with empty review text.
