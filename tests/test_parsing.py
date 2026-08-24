import unittest

from retail_feedback_intelligence.parsing import parse_numeric_score, parse_recommendation_reply, parse_structured_feedback


class ParsingTests(unittest.TestCase):
    def test_parse_structured_feedback_from_labeled_lines(self):
        raw = """
        Feedback Type: Product
        Category: Fit/Sizing
        Sentiment: Negative
        Urgency Level: Medium
        Summary: The customer says the dress runs small.
        Personalized Message: Thanks for flagging the sizing issue.
        Retail Insight: Review fit guidance for this item.
        """

        parsed = parse_structured_feedback(raw, review_text="This dress runs too small.", prompt_key="cot_v2")

        self.assertEqual(parsed.Feedback_Type, "Product")
        self.assertEqual(parsed.Category, "Fit/Sizing")
        self.assertEqual(parsed.Sentiment, "Negative")
        self.assertEqual(parsed.Urgency_Level, "Medium")
        self.assertTrue(parsed.has_required_fields())

    def test_parse_structured_feedback_normalizes_bad_labels(self):
        parsed = parse_structured_feedback(
            "Category: Delivery\nSentiment: Negative\nSummary: It arrived late.",
            review_text="The order arrived late and support did not help.",
        )

        self.assertEqual(parsed.Feedback_Type, "Service")
        self.assertEqual(parsed.Urgency_Level, "Medium")

    def test_parse_recommendation_reply(self):
        flag, reason, raw = parse_recommendation_reply("Recommended: 0\nReason: The product was returned.")

        self.assertEqual(flag, 0)
        self.assertEqual(reason, "The product was returned.")
        self.assertIn("Recommended", raw)

    def test_parse_numeric_score(self):
        self.assertEqual(parse_numeric_score("0.92"), 0.92)
        self.assertEqual(parse_numeric_score("Score: 1.0"), 1.0)
        self.assertIsNone(parse_numeric_score("no score"))


if __name__ == "__main__":
    unittest.main()
