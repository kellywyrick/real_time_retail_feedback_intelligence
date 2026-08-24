"""Shared data structures for review analysis."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Mapping


STRUCTURED_FIELDS = [
    "Feedback_Type",
    "Category",
    "Sentiment",
    "Urgency_Level",
    "Summary",
    "Personalized_Message",
    "Retail_Insight",
]


@dataclass(frozen=True)
class ReviewRecord:
    """One customer review with optional retail metadata."""

    review_text: str
    rating: float | None = None
    recommended: int | None = None
    title: str = ""
    department: str = ""
    division: str = ""
    class_name: str = ""
    clothing_id: str = ""

    @classmethod
    def from_mapping(cls, row: Mapping[str, Any]) -> "ReviewRecord":
        def first_present(*names: str) -> Any:
            for name in names:
                if name in row and row[name] not in (None, ""):
                    return row[name]
            return ""

        return cls(
            review_text=str(first_present("Review.Text", "Review Text", "review_text", "review")),
            rating=_parse_float(first_present("Rating", "rating")),
            recommended=_parse_int(first_present("Recommended.IND", "Recommended", "recommended")),
            title=str(first_present("Title", "title")),
            department=str(first_present("Department.Name", "Department", "department")),
            division=str(first_present("Division.Name", "Division", "division")),
            class_name=str(first_present("Class.Name", "Class", "class_name")),
            clothing_id=str(first_present("Clothing.ID", "Clothing ID", "clothing_id")),
        )

    def to_source_dict(self) -> dict[str, Any]:
        return {
            "Review.Text": self.review_text,
            "Rating": self.rating if self.rating is not None else "",
            "Recommended.IND": self.recommended if self.recommended is not None else "",
            "Title": self.title,
            "Department.Name": self.department,
            "Division.Name": self.division,
            "Class.Name": self.class_name,
            "Clothing.ID": self.clothing_id,
        }


@dataclass
class StructuredFeedback:
    """Seven-field review intelligence output used by the portfolio project."""

    Feedback_Type: str = ""
    Category: str = ""
    Sentiment: str = ""
    Urgency_Level: str = ""
    Summary: str = ""
    Personalized_Message: str = ""
    Retail_Insight: str = ""
    Recommended_Flag: int | None = None
    Recommendation_Reason: str = ""
    Model_Mode: str = "offline"
    Prompt_Version: str = ""

    def to_dict(self) -> dict[str, Any]:
        output = asdict(self)
        if output["Recommended_Flag"] is None:
            output["Recommended_Flag"] = ""
        return output

    def has_required_fields(self) -> bool:
        return all(str(getattr(self, field, "")).strip() for field in STRUCTURED_FIELDS)


def _parse_float(value: Any) -> float | None:
    try:
        if value in (None, ""):
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _parse_int(value: Any) -> int | None:
    try:
        if value in (None, ""):
            return None
        return int(float(value))
    except (TypeError, ValueError):
        return None
