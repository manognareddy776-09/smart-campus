import sys
from pathlib import Path
from datetime import datetime, timedelta

# Ensure backend root directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.smart_matcher import (
    calculate_match_score,
    tokenize_and_normalize,
    calculate_tf_idf_similarity,
    calculate_date_proximity_score
)

class MockItem:
    def __init__(self, title, description, category, report_type, general_location, event_date, campus_id="campus-1"):
        self.id = "mock-id"
        self.title = title
        self.description = description
        self.category = category
        self.report_type = report_type
        self.general_location = general_location
        self.event_date = event_date
        self.campus_id = campus_id

def test_tokenization_and_stop_words():
    text = "The black Dell laptop charger was lost in the library please help!"
    tokens = tokenize_and_normalize(text)
    assert "black" in tokens
    assert "dell" in tokens
    assert "laptop" in tokens
    assert "charger" in tokens
    assert "library" in tokens
    # stop words should be stripped
    assert "the" not in tokens
    assert "in" not in tokens
    assert "please" not in tokens
    assert "help" not in tokens

def test_exact_category_and_similar_description():
    now = datetime.now()
    item1 = MockItem(
        title="Black Dell Laptop",
        description="Lost a black Dell Inspiron 15 inch laptop with sticker on back",
        category="Electronics",
        report_type="lost",
        general_location="Central Library 2nd floor",
        event_date=now,
        campus_id="campus-1"
    )
    item2 = MockItem(
        title="Found Dell Laptop",
        description="Found black Dell laptop near study desks in Central Library",
        category="Electronics",
        report_type="found",
        general_location="Central Library 2nd floor reading hall",
        event_date=now - timedelta(hours=4),
        campus_id="campus-1"
    )
    score, shared_chars, breakdown = calculate_match_score(item1, item2)
    assert score >= 70, f"Expected high match score, got {score}"
    assert breakdown["category_match"] is True
    assert breakdown["campus_match"] is True
    assert len(breakdown["keyword_overlap"]) > 0

def test_same_item_type_different_descriptions():
    now = datetime.now()
    item1 = MockItem(
        title="Apple iPhone 14 Pro",
        description="Deep purple iPhone with clear MagSafe case",
        category="Electronics",
        report_type="lost",
        general_location="Cafeteria",
        event_date=now,
        campus_id="campus-1"
    )
    item2 = MockItem(
        title="Samsung Galaxy S22",
        description="Green Samsung smartphone with black rugged case",
        category="Electronics",
        report_type="found",
        general_location="Basketball Court",
        event_date=now - timedelta(days=2),
        campus_id="campus-1"
    )
    score, shared_chars, breakdown = calculate_match_score(item1, item2)
    assert score < 60, f"Expected moderate/lower score for different phones, got {score}"
    assert breakdown["category_match"] is True

def test_different_categories():
    now = datetime.now()
    item1 = MockItem(
        title="Blue HydroFlask Water Bottle",
        description="Stainless steel blue water bottle with sports cap",
        category="Other",
        report_type="lost",
        general_location="Auditorium",
        event_date=now,
        campus_id="campus-1"
    )
    item2 = MockItem(
        title="Calculus Mathematics Textbook",
        description="Thomas Calculus 14th edition blue hardcover textbook",
        category="Books",
        report_type="found",
        general_location="Auditorium front row",
        event_date=now,
        campus_id="campus-1"
    )
    score, shared_chars, breakdown = calculate_match_score(item1, item2)
    assert score <= 30, f"Expected low score for different categories, got {score}"
    assert breakdown["category_match"] is False

def test_similar_dates_and_locations():
    now = datetime.now()
    item1 = MockItem(
        title="Brown Leather Wallet",
        description="Lost brown wallet containing student ID card and bus pass",
        category="Wallets",
        report_type="lost",
        general_location="Cafeteria food counter",
        event_date=now,
        campus_id="campus-1"
    )
    item2 = MockItem(
        title="Found Leather Wallet",
        description="Men's brown leather wallet found near food court tables",
        category="Wallets",
        report_type="found",
        general_location="Cafeteria main hall",
        event_date=now + timedelta(hours=2),
        campus_id="campus-1"
    )
    score, shared_chars, breakdown = calculate_match_score(item1, item2)
    assert score >= 70
    assert breakdown["date_proximity_days"] <= 1

def test_empty_descriptions():
    now = datetime.now()
    item1 = MockItem(
        title="Keys",
        description="",
        category="Keys",
        report_type="lost",
        general_location="Parking lot",
        event_date=now,
        campus_id="campus-1"
    )
    item2 = MockItem(
        title="Keys",
        description="",
        category="Keys",
        report_type="found",
        general_location="Parking lot",
        event_date=now,
        campus_id="campus-1"
    )
    score, shared_chars, breakdown = calculate_match_score(item1, item2)
    assert score >= 40
    assert 0 <= score <= 100

def test_duplicate_reports():
    now = datetime.now()
    item1 = MockItem(
        title="Sony WH-1000XM4 Silver Headphones",
        description="Over ear noise cancelling silver Sony headphones in black zip case",
        category="Electronics",
        report_type="lost",
        general_location="Library Study Room 4",
        event_date=now,
        campus_id="campus-1"
    )
    item2 = MockItem(
        title="Sony WH-1000XM4 Silver Headphones",
        description="Over ear noise cancelling silver Sony headphones in black zip case",
        category="Electronics",
        report_type="found",
        general_location="Library Study Room 4",
        event_date=now,
        campus_id="campus-1"
    )
    score, shared_chars, breakdown = calculate_match_score(item1, item2)
    assert score >= 90, f"Expected near 100 score for identical items, got {score}"

def test_reports_from_different_campuses():
    now = datetime.now()
    item1 = MockItem(
        title="Blue Backpack",
        description="Navy blue Nike school backpack with textbooks inside",
        category="Bags",
        report_type="lost",
        general_location="Engineering Building",
        event_date=now,
        campus_id="campus-A"
    )
    item2 = MockItem(
        title="Blue Backpack",
        description="Navy blue Nike school backpack with textbooks inside",
        category="Bags",
        report_type="found",
        general_location="Arts Center Lounge",
        event_date=now,
        campus_id="campus-B"
    )
    score_diff_campus, _, breakdown_diff = calculate_match_score(item1, item2)
    
    # Compare with same campus
    item2_same_campus = MockItem(
        title="Blue Backpack",
        description="Navy blue Nike school backpack with textbooks inside",
        category="Bags",
        report_type="found",
        general_location="Arts Center Lounge",
        event_date=now,
        campus_id="campus-A"
    )
    score_same_campus, _, breakdown_same = calculate_match_score(item1, item2_same_campus)

    assert breakdown_diff["campus_match"] is False
    assert breakdown_same["campus_match"] is True
    assert score_same_campus > score_diff_campus

if __name__ == "__main__":
    try:
        import pytest
        sys.exit(pytest.main(["-v", str(Path(__file__).resolve())]))
    except ImportError:
        print("\n=== Running Smart Matcher Tests (Standalone Mode) ===")
        matcher_tests = [
            ("test_tokenization_and_stop_words", test_tokenization_and_stop_words),
            ("test_exact_category_and_similar_description", test_exact_category_and_similar_description),
            ("test_same_item_type_different_descriptions", test_same_item_type_different_descriptions),
            ("test_different_categories", test_different_categories),
            ("test_similar_dates_and_locations", test_similar_dates_and_locations),
            ("test_empty_descriptions", test_empty_descriptions),
            ("test_duplicate_reports", test_duplicate_reports),
            ("test_reports_from_different_campuses", test_reports_from_different_campuses),
        ]
        passed = 0
        for name, test_fn in matcher_tests:
            try:
                test_fn()
                print(f" ✓ {name} PASSED")
                passed += 1
            except Exception as e:
                print(f" ✗ {name} FAILED: {e}")
        print(f"\nResult: {passed}/{len(matcher_tests)} matcher tests passed.\n")
        sys.exit(0 if passed == len(matcher_tests) else 1)
