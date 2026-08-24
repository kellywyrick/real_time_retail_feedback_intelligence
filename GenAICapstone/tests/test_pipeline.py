import tempfile
import unittest
from pathlib import Path

from retail_feedback_intelligence.pipeline import analyze_records, read_reviews, write_results_csv


class PipelineTests(unittest.TestCase):
    def test_pipeline_reads_and_analyzes_sample_data(self):
        records = read_reviews("data/sample_reviews.csv", limit=3)
        rows, summary = analyze_records(records, mode="offline")

        self.assertEqual(len(rows), 3)
        self.assertEqual(summary["records"], 3)
        self.assertEqual(summary["parse_success_rate"], 1.0)
        self.assertIn("recommendation_metrics", summary)

        with tempfile.TemporaryDirectory() as temp_dir:
            out = Path(temp_dir) / "predictions.csv"
            write_results_csv(rows, out)
            self.assertTrue(out.exists())
            self.assertIn("Feedback_Type", out.read_text())


if __name__ == "__main__":
    unittest.main()
