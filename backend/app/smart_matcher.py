import math
import re
from datetime import datetime
from typing import List, Dict, Set, Tuple

# Common English stop words to filter out noise
STOP_WORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
    "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
    "but", "by", "can", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't",
    "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't",
    "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
    "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll",
    "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's",
    "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on",
    "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
    "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some",
    "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then",
    "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this",
    "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we",
    "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's",
    "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't",
    "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself",
    "yourselves", "lost", "found", "item", "please", "help"
}

def tokenize_and_normalize(text: str) -> List[str]:
    """Extract lowercased alphanumeric tokens and remove stop words."""
    if not text:
        return []
    tokens = re.findall(r"\b[a-zA-Z0-9]{2,}\b", text.lower())
    return [t for t in tokens if t not in STOP_WORDS]

def calculate_tf_idf_similarity(tokens1: List[str], tokens2: List[str]) -> Tuple[float, List[str]]:
    """Compute cosine similarity between term frequency vectors and return overlapping keywords."""
    if not tokens1 or not tokens2:
        return 0.0, []

    tf1: Dict[str, int] = {}
    for t in tokens1:
        tf1[t] = tf1.get(t, 0) + 1

    tf2: Dict[str, int] = {}
    for t in tokens2:
        tf2[t] = tf2.get(t, 0) + 1

    common_keys = set(tf1.keys()).intersection(set(tf2.keys()))
    if not common_keys:
        return 0.0, []

    dot_product = sum(tf1[k] * tf2[k] for k in common_keys)
    magnitude1 = math.sqrt(sum(v * v for v in tf1.values()))
    magnitude2 = math.sqrt(sum(v * v for v in tf2.values()))

    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0, []

    cosine = dot_product / (magnitude1 * magnitude2)
    return min(1.0, cosine), sorted(list(common_keys))

def calculate_date_proximity_score(date1: datetime, date2: datetime) -> Tuple[float, int]:
    """Score date proximity (0.0 to 1.0) and return absolute difference in days."""
    if date1.tzinfo is not None and date2.tzinfo is None:
        date2 = date2.replace(tzinfo=date1.tzinfo)
    elif date1.tzinfo is None and date2.tzinfo is not None:
        date1 = date1.replace(tzinfo=date2.tzinfo)
    diff_seconds = abs((date1 - date2).total_seconds())
    diff_days = int(diff_seconds / 86400)
    if diff_days <= 1:
        score = 1.0
    elif diff_days <= 3:
        score = 0.85
    elif diff_days <= 7:
        score = 0.65
    elif diff_days <= 14:
        score = 0.40
    elif diff_days <= 30:
        score = 0.20
    else:
        score = 0.05
    return score, diff_days

def calculate_match_score(
    target_item,
    candidate_item
) -> Tuple[int, List[str], dict]:
    """
    Computes a transparent, weighted match score between target_item and candidate_item.
    Weights:
      - Category: 30%
      - Title & Description Text: 35%
      - Location Similarity: 15%
      - Campus Match: 10%
      - Date Proximity: 10%
    Returns:
      (final_score: int [0-100], shared_characteristics: List[str], breakdown: dict)
    """
    shared_chars: List[str] = []

    # 1. Category Score (weight = 30)
    category_match = target_item.category.strip().lower() == candidate_item.category.strip().lower()
    cat_score = 1.0 if category_match else 0.0
    if category_match:
        shared_chars.append(f"Matching category: {target_item.category}")

    # 2. Text Similarity (weight = 35)
    target_text = f"{target_item.title} {target_item.description}"
    cand_text = f"{candidate_item.title} {candidate_item.description}"
    target_tokens = tokenize_and_normalize(target_text)
    cand_tokens = tokenize_and_normalize(cand_text)
    
    text_sim, overlapping_keywords = calculate_tf_idf_similarity(target_tokens, cand_tokens)
    if overlapping_keywords:
        shared_chars.append(f"Keywords: {', '.join(overlapping_keywords[:5])}")

    # 3. Location Similarity (weight = 15)
    loc_tokens_1 = tokenize_and_normalize(target_item.general_location)
    loc_tokens_2 = tokenize_and_normalize(candidate_item.general_location)
    loc_sim, loc_overlap = calculate_tf_idf_similarity(loc_tokens_1, loc_tokens_2)
    if loc_overlap:
        shared_chars.append(f"Nearby location: {', '.join(loc_overlap)}")

    # 4. Campus Match (weight = 10)
    campus_match = (
        target_item.campus_id is not None
        and candidate_item.campus_id is not None
        and target_item.campus_id == candidate_item.campus_id
    )
    campus_score = 1.0 if campus_match else (0.4 if (target_item.campus_id is None or candidate_item.campus_id is None) else 0.0)
    if campus_match:
        shared_chars.append("Same campus location")

    # 5. Date Proximity (weight = 10)
    date_score, diff_days = calculate_date_proximity_score(target_item.event_date, candidate_item.event_date)
    if diff_days <= 3:
        shared_chars.append(f"Reported within {diff_days} day(s)")

    # Weighted calculation
    # If category completely mismatches, cap max possible score at 30% to prevent false positives
    category_weight = 30.0
    text_weight = 35.0
    loc_weight = 15.0
    campus_weight = 10.0
    date_weight = 10.0

    raw_score = (
        (cat_score * category_weight) +
        (text_sim * text_weight) +
        (loc_sim * loc_weight) +
        (campus_score * campus_weight) +
        (date_score * date_weight)
    )

    if not category_match and text_sim < 0.3:
        raw_score = min(raw_score, 25.0)

    final_score = int(round(raw_score))
    final_score = max(0, min(100, final_score))

    breakdown = {
        "category_match": category_match,
        "category_score": round(cat_score, 2),
        "keyword_overlap": overlapping_keywords,
        "text_similarity_score": round(text_sim, 2),
        "campus_match": campus_match,
        "campus_score": round(campus_score, 2),
        "date_proximity_days": diff_days,
        "date_score": round(date_score, 2),
    }

    return final_score, shared_chars, breakdown
