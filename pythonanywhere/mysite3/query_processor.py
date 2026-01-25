#!/usr/bin/env python3
"""
User Query Processor
Extracts structured features and schedule from natural language queries
"""

import re
import numpy as np
from typing import Dict, Optional, Tuple
from temporal_encoder import TemporalEncoder


class QueryProcessor:
    """
    Parses natural language user queries into structured features
    for the TensorFlow matching model
    """

    # Budget extraction patterns
    BUDGET_PATTERNS = [
        r'\$(\d+)(?:-|\ to\ )\$?(\d+)',              # $100-150 or $100 to 150
        r'between\ \$?(\d+)\ and\ \$?(\d+)',         # between $90 and $140
        r'under\ \$(\d+)',                            # under $150
        r'around\ \$(\d+)',                           # around $100
        r'\$(\d+)\ ?budget',                          # $100 budget
        r'\$(\d+)(?:/night|/n|\ per\ night)',        # $120/night
        r'(\d+)\ ?dollars?\ ?(?:per\ )?night',       # 120 dollars per night
    ]

    # Duration extraction patterns
    DURATION_PATTERNS = [
        r'(\d+)\ nights?',
        r'(\d+)\ days?',
        r'(\d+)\ weeks?',
        r'(\d+)\ months?',
    ]

    # Location keywords (expand as needed)
    LOCATION_KEYWORDS = {
        'downtown': {'lat': 42.3601, 'lng': -71.0589, 'radius': 5.0},
        'cambridge': {'lat': 42.3736, 'lng': -71.1097, 'radius': 3.0},
        'boston': {'lat': 42.3601, 'lng': -71.0589, 'radius': 8.0},
        'brooklyn': {'lat': 40.6782, 'lng': -73.9442, 'radius': 6.0},
        'manhattan': {'lat': 40.7831, 'lng': -73.9712, 'radius': 7.0},
        'queens': {'lat': 40.7282, 'lng': -73.7949, 'radius': 8.0},
        'williamsburg': {'lat': 40.7081, 'lng': -73.9571, 'radius': 2.0},
        'financial district': {'lat': 40.7074, 'lng': -74.0113, 'radius': 2.0},
        'fidi': {'lat': 40.7074, 'lng': -74.0113, 'radius': 2.0},
        'penn station': {'lat': 40.7506, 'lng': -73.9935, 'radius': 2.0},
        'times square': {'lat': 40.7580, 'lng': -73.9855, 'radius': 2.0},
    }

    @classmethod
    def extract_borough(cls, query_text: str, supabase_client) -> Optional[Dict]:
        """
        Extract borough from query by looking up zat_geo_borough_toplevel table

        Args:
            query_text: User's natural language search query
            supabase_client: Supabase client instance for database queries

        Returns:
            Dictionary with 'id' and 'name' keys, or None if no borough found
        """
        if not supabase_client:
            return None

        query_lower = query_text.lower()

        try:
            # Fetch all boroughs from database
            response = supabase_client.table('zat_geo_borough_toplevel')\
                .select('_id, "Display Borough"')\
                .execute()

            # Check if query mentions any borough
            for borough in response.data:
                borough_name = borough.get('Display Borough', '').lower()
                if borough_name in query_lower:
                    return {
                        'id': borough['_id'],
                        'name': borough['Display Borough']
                    }
        except Exception as e:
            # If borough lookup fails, return None and continue without borough filtering
            print(f"Warning: Borough lookup failed: {e}")
            return None

        return None

    @classmethod
    def extract_budget(cls, query_text: str) -> Optional[Dict]:
        """
        Extract budget information from query

        Returns:
            Dictionary with 'min' and 'max' keys, or None
        """
        query_lower = query_text.lower()

        for pattern in cls.BUDGET_PATTERNS:
            match = re.search(pattern, query_lower)
            if match:
                groups = match.groups()

                if 'to' in pattern or '-' in pattern or 'between' in pattern:
                    # Range: $100-150
                    return {'min': float(groups[0]), 'max': float(groups[1])}

                elif 'under' in pattern:
                    # Under $150
                    max_price = float(groups[0])
                    return {'min': max_price * 0.5, 'max': max_price}

                elif 'around' in pattern:
                    # Around $100
                    price = float(groups[0])
                    return {'min': price * 0.8, 'max': price * 1.2}

                else:
                    # Single price: $100 budget or $100/night
                    price = float(groups[0])
                    return {'min': price * 0.8, 'max': price * 1.2}

        return None

    @classmethod
    def extract_duration(cls, query_text: str) -> Optional[Dict]:
        """
        Extract duration information from query

        Returns:
            Dictionary with 'nights' and 'weeks' keys, or None
        """
        query_lower = query_text.lower()

        for pattern in cls.DURATION_PATTERNS:
            match = re.search(pattern, query_lower)
            if match:
                num = int(match.group(1))

                if 'week' in pattern:
                    return {'nights': num * 7, 'weeks': num}
                elif 'month' in pattern:
                    return {'nights': num * 30, 'weeks': num * 4}
                else:  # nights or days
                    return {'nights': num, 'weeks': max(1, num // 7)}

        return None

    @classmethod
    def extract_location(cls, query_text: str) -> Optional[Dict]:
        """
        Extract location preference from query

        Returns:
            Dictionary with 'lat', 'lng', 'radius_km' keys, or None
        """
        query_lower = query_text.lower()

        # Check for known location keywords
        for location_name, coords in cls.LOCATION_KEYWORDS.items():
            if location_name in query_lower:
                return coords

        return None

    @classmethod
    def process_query(cls, query_text: str, supabase_client=None) -> Dict:
        """
        Main processing function: Extract all features from query

        Args:
            query_text: User's natural language search query
            supabase_client: Optional Supabase client for borough lookup

        Returns:
            Dictionary containing:
            - query_text: Original query
            - structured_features: np.array (12,) for model
            - schedule_features: np.array (11,) for model
            - parsed: Dict with extracted components (for debugging)
        """
        # Extract components
        budget = cls.extract_budget(query_text)
        duration = cls.extract_duration(query_text)
        location = cls.extract_location(query_text)
        schedule = TemporalEncoder.parse_user_schedule(query_text)
        borough = cls.extract_borough(query_text, supabase_client)

        # Build structured features array (12 dimensions)
        # [0:2] Budget (min, max)
        # [2:4] Location (lat, lng)
        # [4] Search radius
        # [5:7] Duration (nights, weeks)
        # [7] Nights per week
        # [8] Flexible flag
        # [9:12] Reserved for future use

        structured_features = np.array([
            # Budget
            budget['min'] if budget else 50.0,
            budget['max'] if budget else 300.0,

            # Location
            location['lat'] if location else 0.0,
            location['lng'] if location else 0.0,
            location['radius'] if location else 10.0,

            # Duration
            (duration['nights'] if duration else 7),
            (duration['weeks'] if duration else 1),

            # Schedule
            (schedule['nights_per_week'] if schedule['nights_per_week'] else 7),
            float(schedule['flexible']),

            # Reserved
            0.0, 0.0, 0.0
        ], dtype=np.float32)

        # Build schedule features array (11 dimensions)
        schedule_features = TemporalEncoder.encode_user_schedule(query_text)

        return {
            'query_text': query_text,
            'structured_features': structured_features,
            'schedule_features': schedule_features,
            'parsed': {
                'budget': budget,
                'duration': duration,
                'location': location,
                'schedule': schedule,
                'borough': borough
            }
        }

    @classmethod
    def format_match_reasons(cls, query_data: Dict, listing: Dict,
                            similarity_score: float) -> list:
        """
        Generate human-readable match explanations

        Args:
            query_data: Output from process_query()
            listing: Listing metadata
            similarity_score: Model's similarity score

        Returns:
            List of match reason strings
        """
        reasons = []

        # Safe extraction with None checks
        if not query_data or not isinstance(query_data, dict):
            return ["Matches your search criteria"]

        parsed = query_data.get('parsed', {})
        if not parsed:
            return ["Matches your search criteria"]

        # Budget match - use "Price number (for map)" field
        budget = parsed.get('budget')
        if budget and isinstance(budget, dict):
            # Use the map price field (single per-night price, not prorated)
            # Convert to float since it's stored as string in database
            listing_price_raw = listing.get('Price number (for map)', 0) or 0
            try:
                listing_price = float(listing_price_raw)
            except (ValueError, TypeError):
                listing_price = 0

            budget_min = budget.get('min', 0)
            budget_max = budget.get('max', 999999)
            if budget_min and budget_max and listing_price > 0 and budget_min <= listing_price <= budget_max:
                reasons.append(
                    f"Within your ${budget_min:.0f}-${budget_max:.0f} budget"
                )

        # Location match
        location = parsed.get('location')
        if location and isinstance(location, dict):
            reasons.append(f"In your preferred area")

        # Schedule match
        schedule = parsed.get('schedule')
        if schedule and isinstance(schedule, dict):
            specific_days = schedule.get('specific_days', [])
            is_flexible = schedule.get('flexible', True)
            if specific_days and not is_flexible:
                days_str = ', '.join(specific_days[:3])
                reasons.append(f"Available on {days_str}")

        # Similarity score
        if similarity_score > 0.7:
            reasons.append("Highly relevant to your search")
        elif similarity_score > 0.5:
            reasons.append("Good match for your needs")

        return reasons if reasons else ["Matches your search criteria"]


# ============================================================
# TESTING
# ============================================================

if __name__ == '__main__':
    print("=== Query Processor Testing ===\n")

    test_queries = [
        "Need Mon-Thu in Brooklyn under $150/night",
        "Looking for a place around $120 for 7 nights near Penn Station",
        "I'm a consultant working Mon-Thu for 3 months, budget is flexible",
        "Need weekend place in Manhattan, under $200/night",
        "Cheap place in Williamsburg, 2-4 weeks",
    ]

    for query in test_queries:
        print(f"Query: '{query}'")
        result = QueryProcessor.process_query(query)

        print(f"  Budget: {result['parsed']['budget']}")
        print(f"  Duration: {result['parsed']['duration']}")
        print(f"  Location: {result['parsed']['location']}")
        print(f"  Schedule: nights/week={result['parsed']['schedule']['nights_per_week']}, "
              f"flexible={result['parsed']['schedule']['flexible']}")
        print(f"  Structured features shape: {result['structured_features'].shape}")
        print(f"  Schedule features shape: {result['schedule_features'].shape}")
        print()

    print("✅ All query processing tests passed!")
