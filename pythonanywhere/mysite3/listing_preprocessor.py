#!/usr/bin/env python3
"""
Listing Data Preprocessing Pipeline
Fetches and prepares ALL listing data from Supabase for TensorFlow embedding
"""

import os
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional
from supabase import create_client, Client
from dotenv import load_dotenv
from temporal_encoder import TemporalEncoder

load_dotenv()


class ListingPreprocessor:
    """
    Fetches listings from Supabase and prepares them for embedding generation
    """

    # Text fields to combine for semantic embedding
    TEXT_FIELDS = [
        'Name',
        'Description',
        '"Description - Neighborhood"',
        '"Location - Hood"',
        '"Location - City"',
        '"Features - Type of Space"',
        '"Kitchen Type"',
        '"rental type"'
    ]

    # Structured numeric fields
    NUMERIC_FIELDS = [
        '"Price number (for map)"',  # Standardized per-night price for map display
        '"Features - Qty Bedrooms"',
        '"Features - Qty Bathrooms"',
        '"Features - Qty Guests"',
        '"Features - SQFT Area"',
        '"Minimum Nights"',
        '"Maximum Nights"'
    ]

    def __init__(self, supabase_url: Optional[str] = None,
                 supabase_key: Optional[str] = None):
        """
        Initialize preprocessor with Supabase connection

        Args:
            supabase_url: Supabase project URL (defaults to env var)
            supabase_key: Supabase anon/service key (defaults to env var)
        """
        self.supabase: Client = create_client(
            supabase_url or os.getenv("SUPABASE_URL"),
            supabase_key or os.getenv("SUPABASE_KEY")
        )

    def fetch_all_listings(self) -> pd.DataFrame:
        """
        Fetch ALL listings from database with required fields

        IMPORTANT: Fetches BOTH active AND inactive listings.
        No Active=true filter is applied.

        Returns:
            DataFrame with all listing data
        """
        print("📥 Fetching ALL listings from Supabase (active + inactive)...")

        # Build comprehensive SELECT query
        select_fields = ', '.join([
            '_id',
            *self.TEXT_FIELDS,
            '"Location - Address"',  # JSONB containing lat/lng
            *self.NUMERIC_FIELDS,
            '"Days Available (List of Days)"',
            '"Nights Available (numbers)"',
            'Active'
        ])

        # Fetch from listing table - NO FILTER (includes active and inactive)
        response = self.supabase.table('listing').select(select_fields).execute()

        if not response.data:
            print("⚠️  No listings found!")
            return pd.DataFrame()

        df = pd.DataFrame(response.data)

        # Count active vs inactive
        active_count = df['Active'].sum() if 'Active' in df.columns else 0
        inactive_count = len(df) - active_count

        print(f"✅ Fetched {len(df)} total listings")
        print(f"   └─ Active: {active_count}, Inactive: {inactive_count}")

        return df

    def extract_text_content(self, listing: pd.Series) -> str:
        """
        Combine multiple text fields into single string for embedding

        Args:
            listing: Single row from listings DataFrame

        Returns:
            Combined text string
        """
        text_parts = []

        # Add name/title
        name = listing.get('Name', '')
        if name:
            text_parts.append(str(name))

        # Add description
        description = listing.get('Description', '')
        if description:
            text_parts.append(str(description))

        # Add neighborhood description
        hood_desc = listing.get('"Description - Neighborhood"', '')
        if hood_desc:
            text_parts.append(f"Neighborhood: {hood_desc}")

        # Add location info
        city = listing.get('"Location - City"', '')
        hood = listing.get('"Location - Hood"', '')
        if hood and city:
            text_parts.append(f"Located in {hood}, {city}")
        elif city:
            text_parts.append(f"Located in {city}")

        # Add property type
        space_type = listing.get('"Features - Type of Space"', '')
        if space_type:
            text_parts.append(f"Property type: {space_type}")

        # Add kitchen type
        kitchen = listing.get('"Kitchen Type"', '')
        if kitchen:
            text_parts.append(f"Kitchen: {kitchen}")

        # Add rental type
        rental_type = listing.get('"rental type"', '')
        if rental_type:
            text_parts.append(f"Rental type: {rental_type}")

        # Join with spaces
        combined = ' '.join([p for p in text_parts if p]).strip()

        return combined if combined else "Listing"  # Fallback

    def extract_location(self, listing: pd.Series) -> Tuple[float, float]:
        """
        Extract latitude and longitude from JSONB "Location - Address" field

        Args:
            listing: Single row from listings DataFrame

        Returns:
            Tuple of (latitude, longitude), or (0.0, 0.0) if not found
        """
        address = listing.get('"Location - Address"', {})

        if isinstance(address, dict):
            lat = address.get('lat')
            lng = address.get('lng')

            if lat is not None and lng is not None:
                try:
                    return (float(lat), float(lng))
                except (ValueError, TypeError):
                    pass

        return (0.0, 0.0)

    def extract_numeric_features(self, listing: pd.Series) -> np.ndarray:
        """
        Extract structured numeric features

        Args:
            listing: Single row from listings DataFrame

        Returns:
            numpy array of shape (12,) containing:
            [0] Price (map price - standardized per-night rate)
            [1:4] Padding (compatibility with 4-price model, set to price/0/0/0)
            [4:6] Location (lat, lng)
            [6:10] Property features (bedrooms, bathrooms, guests, sqft)
            [10:12] Duration limits (min_nights, max_nights normalized)
        """
        features = []

        # Price (1 feature) + padding (3 features) = 4 total
        # Use "Price number (for map)" field for all price slots
        price = listing.get('"Price number (for map)"', 0) or 0
        features.append(float(price))  # [0] Main price (map price)
        features.extend([0.0, 0.0, 0.0])  # [1:4] Padding (for model compatibility)

        # Location (2 features)
        lat, lng = self.extract_location(listing)
        features.extend([lat, lng])

        # Property features (4 features)
        bedrooms = listing.get('"Features - Qty Bedrooms"', 1) or 1
        bathrooms = listing.get('"Features - Qty Bathrooms"', 1) or 1
        guests = listing.get('"Features - Qty Guests"', 2) or 2
        sqft = listing.get('"Features - SQFT Area"', 500) or 500

        features.extend([
            float(bedrooms),
            float(bathrooms),
            float(guests),
            float(sqft) / 1000  # Normalize to thousands
        ])

        # Duration limits (2 features, normalized)
        min_nights = listing.get('"Minimum Nights"', 1) or 1
        max_nights = listing.get('"Maximum Nights"', 365) or 365

        features.extend([
            float(min_nights),
            float(max_nights) / 365  # Normalize to year fraction
        ])

        return np.array(features, dtype=np.float32)

    def extract_temporal_features(self, listing: pd.Series) -> np.ndarray:
        """
        Extract temporal features (days/nights availability)

        Args:
            listing: Single row from listings DataFrame

        Returns:
            numpy array of shape (11,) from TemporalEncoder
        """
        days_available = listing.get('"Days Available (List of Days)"', [])

        # Ensure it's a list
        if not isinstance(days_available, list):
            days_available = []

        return TemporalEncoder.encode_days_available(days_available)

    def preprocess_all(self, listings_df: pd.DataFrame) -> List[Dict]:
        """
        Preprocess all listings into format ready for embedding

        Args:
            listings_df: DataFrame of listings from fetch_all_listings()

        Returns:
            List of dictionaries, each containing:
            - listing_id: str
            - text: str (combined text for embedding)
            - structured_features: np.ndarray (12 numeric features)
            - temporal_features: np.ndarray (11 temporal features)
            - raw_data: original listing dict
        """
        print(f"\n🔄 Preprocessing {len(listings_df)} listings...")

        processed = []

        for idx, listing in listings_df.iterrows():
            try:
                # Extract all components
                text = self.extract_text_content(listing)
                numeric = self.extract_numeric_features(listing)
                temporal = self.extract_temporal_features(listing)

                processed.append({
                    'listing_id': listing['_id'],
                    'text': text,
                    'structured_features': numeric,
                    'temporal_features': temporal,
                    'raw_data': listing.to_dict()
                })

                if (idx + 1) % 100 == 0:
                    print(f"  Processed {idx + 1}/{len(listings_df)} listings...")

            except Exception as e:
                print(f"⚠️  Error processing listing {listing.get('_id', 'unknown')}: {e}")
                continue

        print(f"✅ Successfully preprocessed {len(processed)} listings\n")

        return processed

    def get_feature_summary(self, processed_listings: List[Dict]) -> Dict:
        """
        Get summary statistics of preprocessed data

        Args:
            processed_listings: Output from preprocess_all()

        Returns:
            Dictionary with summary statistics
        """
        if not processed_listings:
            return {}

        # Collect all numeric features
        all_numeric = np.array([l['structured_features'] for l in processed_listings])
        all_temporal = np.array([l['temporal_features'] for l in processed_listings])

        # Calculate statistics
        summary = {
            'total_listings': len(processed_listings),
            'text_lengths': {
                'mean': np.mean([len(l['text']) for l in processed_listings]),
                'min': min(len(l['text']) for l in processed_listings),
                'max': max(len(l['text']) for l in processed_listings)
            },
            'numeric_features': {
                'mean': all_numeric.mean(axis=0).tolist(),
                'std': all_numeric.std(axis=0).tolist(),
                'min': all_numeric.min(axis=0).tolist(),
                'max': all_numeric.max(axis=0).tolist()
            },
            'temporal_features': {
                'avg_days_per_week': all_temporal[:, 7].mean(),
                'avg_weekday_ratio': all_temporal[:, 8].mean(),
                'pct_consecutive': (all_temporal[:, 9].sum() / len(all_temporal)) * 100,
                'pct_flexible': (all_temporal[:, 10].sum() / len(all_temporal)) * 100
            }
        }

        return summary


# ============================================================
# TESTING & EXAMPLES
# ============================================================

if __name__ == '__main__':
    print("=== Listing Preprocessor Testing ===\n")

    try:
        # Initialize preprocessor
        preprocessor = ListingPreprocessor()

        # Fetch listings
        listings_df = preprocessor.fetch_all_listings()

        if len(listings_df) > 0:
            print(f"\n📊 Dataset Overview:")
            print(f"Total listings: {len(listings_df)}")
            print(f"Columns: {len(listings_df.columns)}")

            # Preprocess first 5 for testing
            print(f"\n🧪 Testing with first 5 listings...\n")
            test_df = listings_df.head(5)
            processed = preprocessor.preprocess_all(test_df)

            # Show first example
            if processed:
                example = processed[0]
                print("\n📝 Example Preprocessed Listing:")
                print(f"ID: {example['listing_id']}")
                print(f"\nText (first 200 chars):\n{example['text'][:200]}...")
                print(f"\nStructured features (12 dims):\n{example['structured_features']}")
                print(f"\nTemporal features (11 dims):\n{example['temporal_features']}")

                # Get summary
                summary = preprocessor.get_feature_summary(processed)
                print(f"\n📈 Summary Statistics:")
                print(f"  Text length (avg): {summary['text_lengths']['mean']:.0f} chars")
                print(f"  Avg days/week available: {summary['temporal_features']['avg_days_per_week']:.1f}")
                print(f"  Listings with consecutive days: {summary['temporal_features']['pct_consecutive']:.1f}%")
                print(f"  Flexible schedules: {summary['temporal_features']['pct_flexible']:.1f}%")

            print("\n✅ Preprocessing Test Passed!")

        else:
            print("❌ No listings found in database")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
