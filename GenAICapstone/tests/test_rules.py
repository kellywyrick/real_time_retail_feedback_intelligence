import unittest

from retail_feedback_intelligence.rules import analyze_with_rules
from retail_feedback_intelligence.schema import ReviewRecord


class RuleAnalyzerTests(unittest.TestCase):
    def test_offline_rules_detect_product_quality_issue(self):
        record = ReviewRecord(
            review_text="The sweater is cute but the fabric is thin and see through.",
            rating=2,
            recommended=0,
        )

        feedback = analyze_with_rules(record)

        self.assertEqual(feedback.Feedback_Type, "Product")
        self.assertEqual(feedback.Category, "Product Quality")
        self.assertEqual(feedback.Sentiment, "Negative")
        self.assertEqual(feedback.Urgency_Level, "Medium")
        self.assertEqual(feedback.Recommended_Flag, 0)

    def test_offline_rules_detect_positive_fit_feedback(self):
        record = ReviewRecord(
            review_text="I love these pants. The fit is perfect and the fabric is comfortable.",
            rating=5,
            recommended=1,
        )

        feedback = analyze_with_rules(record)

        self.assertEqual(feedback.Feedback_Type, "Product")
        self.assertEqual(feedback.Sentiment, "Positive")
        self.assertEqual(feedback.Urgency_Level, "Low")
        self.assertEqual(feedback.Recommended_Flag, 1)


if __name__ == "__main__":
    unittest.main()
