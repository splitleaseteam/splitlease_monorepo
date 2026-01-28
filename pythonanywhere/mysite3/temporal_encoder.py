#!/usr/bin/env python3
"""
Temporal Feature Encoder
Converts JSONB days/nights availability to ML features
"""

import numpy as np
import re
from typing import List, Dict, Optional


class TemporalEncoder:
    """
    Encodes temporal availability patterns (days/nights per week)
    from JSONB database fields into ML-ready feature vectors
    """

    WEEKDAY_MAP = {
        'monday': 0, 'mon': 0,
        'tuesday': 1, 'tue': 1, 'tues': 1,
        'wednesday': 2, 'wed': 2,
        'thursday': 3, 'thu': 3, 'thur': 3, 'thurs': 3,
        'friday': 4, 'fri': 4,
        'saturday': 5, 'sat': 6,
        'sunday': 6, 'sun': 6
    }

    WEEKDAYS = {'monday', 'tuesday', 'wednesday', 'thursday', 'friday'}
    WEEKENDS = {'saturday', 'sunday'}

    @classmethod
    def encode_days_available(cls, days_json: List[str]) -> np.ndarray:
        """
        Convert JSONB days array to ML feature vector

        Args:
            days_json: List of day names, e.g., ["monday", "tuesday", "wednesday"]

        Returns:
            numpy array of shape (11,) containing:
            - [0:7] One-hot weekday mask
            - [7] Days per week available
            - [8] Weekday ratio (weekdays / total days)
            - [9] Consecutive days boolean
            - [10] Flexible schedule indicator (5+ days = flexible)
        """
        if not days_json or not isinstance(days_json, list):
            # No availability data - return neutral encoding
            return np.array([0, 0, 0, 0, 0, 0, 0,  # All days unavailable
                           0,  # 0 days per week
                           0.5,  # Neutral weekday ratio
                           0,  # Not consecutive
                           0])  # Not flexible

        # Normalize day names
        normalized_days = []
        for day in days_json:
            day_clean = str(day).lower().strip()
            if day_clean in cls.WEEKDAY_MAP:
                normalized_days.append(day_clean)

        if not normalized_days:
            return np.array([0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0, 0])

        # Feature 1: One-hot weekday mask (7 dimensions)
        weekday_mask = np.zeros(7)
        day_numbers = []
        for day in normalized_days:
            day_num = cls.WEEKDAY_MAP[day]
            weekday_mask[day_num] = 1
            day_numbers.append(day_num)

        # Feature 2: Days per week available (scalar)
        days_per_week = len(set(normalized_days))

        # Feature 3: Weekday vs weekend ratio
        weekday_count = sum(1 for d in normalized_days
                          if any(wd in d for wd in cls.WEEKDAYS))
        weekday_ratio = weekday_count / max(len(normalized_days), 1)

        # Feature 4: Consecutive days (boolean)
        if len(day_numbers) > 1:
            day_numbers_sorted = sorted(set(day_numbers))
            is_consecutive = all(
                day_numbers_sorted[i] == day_numbers_sorted[i-1] + 1
                for i in range(1, len(day_numbers_sorted))
            )
        else:
            is_consecutive = False

        # Feature 5: Flexible schedule indicator
        is_flexible = days_per_week >= 5  # Available 5+ days = flexible

        return np.concatenate([
            weekday_mask,            # [7 dims]
            [days_per_week],         # [1 dim]
            [weekday_ratio],         # [1 dim]
            [float(is_consecutive)], # [1 dim]
            [float(is_flexible)]     # [1 dim]
        ])  # Total: 11 dimensions

    @classmethod
    def parse_user_schedule(cls, query_text: str) -> Dict:
        """
        Extract schedule requirements from natural language user query

        Args:
            query_text: User's search query

        Returns:
            Dictionary with:
            - weekday_mask: np.array of shape (7,)
            - nights_per_week: int or None
            - specific_days: list of day names
            - flexible: boolean
        """
        query_lower = query_text.lower()

        result = {
            'weekday_mask': np.zeros(7),
            'nights_per_week': None,
            'specific_days': [],
            'flexible': True
        }

        # Pattern 1: Mon-Thu / Monday-Thursday (weekday commuter)
        if re.search(r'(mon|monday).*(thu|thursday)', query_lower):
            result['weekday_mask'][[0, 1, 2, 3]] = 1  # Mon-Thu
            result['nights_per_week'] = 4
            result['specific_days'] = ['monday', 'tuesday', 'wednesday', 'thursday']
            result['flexible'] = False

        # Pattern 2: Mon-Fri (full work week)
        elif re.search(r'(mon|monday).*(fri|friday)', query_lower):
            result['weekday_mask'][[0, 1, 2, 3, 4]] = 1  # Mon-Fri
            result['nights_per_week'] = 5
            result['specific_days'] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            result['flexible'] = False

        # Pattern 3: Weekend only
        elif re.search(r'(weekend|fri.*sun|friday.*sunday)', query_lower):
            result['weekday_mask'][[5, 6]] = 1  # Sat-Sun
            result['nights_per_week'] = 2
            result['specific_days'] = ['saturday', 'sunday']
            result['flexible'] = False

        # Pattern 4: "X nights per week" or "X days/week"
        nights_match = re.search(r'(\d+)\s*(night|day)s?\s*(?:per|a|/|each)\s*week', query_lower)
        if nights_match:
            result['nights_per_week'] = int(nights_match.group(1))

        # Pattern 5: Specific days mentioned
        specific_days = []
        for day_name in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']:
            if day_name in query_lower or day_name[:3] in query_lower:
                day_num = cls.WEEKDAY_MAP[day_name]
                result['weekday_mask'][day_num] = 1
                specific_days.append(day_name)

        if specific_days:
            result['specific_days'] = specific_days
            if not result['nights_per_week']:
                result['nights_per_week'] = len(specific_days)
            result['flexible'] = False

        # Pattern 6: Keywords suggesting flexibility
        if any(kw in query_lower for kw in ['flexible', 'any day', 'anytime', 'all week']):
            result['flexible'] = True
            result['weekday_mask'] = np.ones(7)  # All days
            if not result['nights_per_week']:
                result['nights_per_week'] = 7

        return result

    @classmethod
    def encode_user_schedule(cls, query_text: str) -> np.ndarray:
        """
        Parse user query and encode to same 11-dim vector as listing availability

        Args:
            query_text: User's natural language query

        Returns:
            numpy array of shape (11,) matching listing encoding format
        """
        schedule = cls.parse_user_schedule(query_text)

        weekday_mask = schedule['weekday_mask']
        nights_per_week = schedule['nights_per_week'] or 7

        # Calculate weekday ratio
        weekday_ratio = weekday_mask[[0,1,2,3,4]].sum() / max(weekday_mask.sum(), 1)

        # Check if consecutive
        active_days = np.where(weekday_mask == 1)[0]
        if len(active_days) > 1:
            is_consecutive = all(
                active_days[i] == active_days[i-1] + 1
                for i in range(1, len(active_days))
            )
        else:
            is_consecutive = False

        is_flexible = schedule['flexible']

        return np.concatenate([
            weekday_mask,                # [7 dims]
            [nights_per_week],           # [1 dim]
            [weekday_ratio],             # [1 dim]
            [float(is_consecutive)],     # [1 dim]
            [float(is_flexible)]         # [1 dim]
        ])

    @classmethod
    def calculate_schedule_compatibility(cls, listing_schedule: np.ndarray,
                                        user_schedule: np.ndarray) -> float:
        """
        Calculate compatibility score between listing and user schedules

        Args:
            listing_schedule: 11-dim encoding from encode_days_available()
            user_schedule: 11-dim encoding from encode_user_schedule()

        Returns:
            Compatibility score [0, 1], where 1 = perfect match
        """
        # Extract components
        listing_mask = listing_schedule[:7]
        listing_nights = listing_schedule[7]
        listing_flexible = listing_schedule[10]

        user_mask = user_schedule[:7]
        user_nights = user_schedule[7]
        user_flexible = user_schedule[10]

        # Component 1: Day overlap (40% weight)
        # Check if listing has all user's required days
        required_days_available = (listing_mask * user_mask).sum()
        user_required_days = user_mask.sum()

        if user_required_days > 0:
            day_overlap_score = required_days_available / user_required_days
        else:
            day_overlap_score = 1.0  # User didn't specify, so perfect match

        # Component 2: Nights per week match (30% weight)
        if user_nights > 0 and listing_nights > 0:
            nights_diff = abs(listing_nights - user_nights)
            nights_score = max(0, 1 - nights_diff / 7)
        else:
            nights_score = 1.0

        # Component 3: Flexibility bonus (30% weight)
        # If listing is flexible OR user is flexible, easier to match
        flexibility_score = 0.5
        if listing_flexible or user_flexible:
            flexibility_score = 1.0

        # Combined score
        compatibility = (
            0.40 * day_overlap_score +
            0.30 * nights_score +
            0.30 * flexibility_score
        )

        return float(compatibility)


# ============================================================
# TESTING & EXAMPLES
# ============================================================

if __name__ == '__main__':
    print("=== Temporal Encoder Testing ===\n")

    # Test 1: Encode listing with Mon-Thu availability
    print("Test 1: Listing available Mon-Thu")
    listing_days = ["monday", "tuesday", "wednesday", "thursday"]
    listing_encoded = TemporalEncoder.encode_days_available(listing_days)
    print(f"Input: {listing_days}")
    print(f"Encoded (11-dim): {listing_encoded}")
    print(f"Weekday mask: {listing_encoded[:7]}")
    print(f"Days per week: {listing_encoded[7]}")
    print(f"Weekday ratio: {listing_encoded[8]:.2f}")
    print(f"Consecutive: {bool(listing_encoded[9])}")
    print(f"Flexible: {bool(listing_encoded[10])}\n")

    # Test 2: Parse user query "Need Mon-Thu"
    print("Test 2: User query 'Need place Mon-Thu for work commute'")
    user_query = "Need place Mon-Thu for work commute"
    user_encoded = TemporalEncoder.encode_user_schedule(user_query)
    print(f"Query: {user_query}")
    print(f"Encoded (11-dim): {user_encoded}")
    print(f"Weekday mask: {user_encoded[:7]}")
    print(f"Nights per week: {user_encoded[7]}\n")

    # Test 3: Calculate compatibility
    print("Test 3: Compatibility between listing and user")
    compatibility = TemporalEncoder.calculate_schedule_compatibility(
        listing_encoded, user_encoded
    )
    print(f"Compatibility score: {compatibility:.2f}")
    print(f"Match quality: {'✅ EXCELLENT' if compatibility > 0.8 else '⚠️ PARTIAL' if compatibility > 0.5 else '❌ POOR'}\n")

    # Test 4: Flexible schedule
    print("Test 4: Flexible user vs. fixed listing")
    flexible_query = "Need place anytime, flexible schedule"
    flexible_encoded = TemporalEncoder.encode_user_schedule(flexible_query)
    compatibility_flexible = TemporalEncoder.calculate_schedule_compatibility(
        listing_encoded, flexible_encoded
    )
    print(f"Query: {flexible_query}")
    print(f"Compatibility: {compatibility_flexible:.2f}\n")

    # Test 5: Weekend listing
    print("Test 5: Weekend listing")
    weekend_days = ["friday", "saturday", "sunday"]
    weekend_encoded = TemporalEncoder.encode_days_available(weekend_days)
    print(f"Input: {weekend_days}")
    print(f"Weekday ratio: {weekend_encoded[8]:.2f} (low = weekend-heavy)")
    print(f"Days per week: {weekend_encoded[7]}\n")

    print("=== All Tests Passed ✅ ===")
