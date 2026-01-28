#!/usr/bin/env python3
"""
Build Embedding Index for All Listings
Run this script to generate embeddings for all listings in the database

Usage:
    python build_embeddings.py

Output:
    listing_embeddings.npz - Compressed numpy file with all embeddings
"""

import os
import sys
from datetime import datetime
from listing_preprocessor import ListingPreprocessor
from tf_model import ListingMatchingModel, EmbeddingIndexBuilder


def main():
    print("=" * 70)
    print(" TENSORFLOW LISTING EMBEDDING GENERATOR")
    print("=" * 70)
    print(f"\nStarted: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    try:
        # Step 1: Initialize preprocessor
        print("STEP 1: Initialize Data Preprocessor")
        print("-" * 70)
        preprocessor = ListingPreprocessor()

        # Step 2: Fetch all listings
        print("\nSTEP 2: Fetch Listings from Supabase")
        print("-" * 70)
        listings_df = preprocessor.fetch_all_listings()

        if len(listings_df) == 0:
            print("❌ No listings found! Exiting.")
            return 1

        # Step 3: Preprocess all listings
        print("\nSTEP 3: Preprocess Listing Data")
        print("-" * 70)
        processed_listings = preprocessor.preprocess_all(listings_df)

        if len(processed_listings) == 0:
            print("❌ Preprocessing failed! Exiting.")
            return 1

        # Show summary
        summary = preprocessor.get_feature_summary(processed_listings)
        print("\n📊 Dataset Summary:")
        print(f"  Total listings: {summary['total_listings']}")
        print(f"  Avg text length: {summary['text_lengths']['mean']:.0f} chars")
        print(f"  Avg days/week available: {summary['temporal_features']['avg_days_per_week']:.1f}")
        print(f"  Flexible schedules: {summary['temporal_features']['pct_flexible']:.1f}%")

        # Step 4: Initialize TensorFlow model
        print("\nSTEP 4: Initialize TensorFlow Model")
        print("-" * 70)
        model = ListingMatchingModel()

        # Step 5: Generate embeddings
        print("\nSTEP 5: Generate Embeddings")
        print("-" * 70)
        index_builder = EmbeddingIndexBuilder(model)
        embedding_index = index_builder.build_index(processed_listings, batch_size=32)

        # Step 6: Save to disk
        print("\nSTEP 6: Save Embedding Index")
        print("-" * 70)
        output_file = 'listing_embeddings.npz'
        index_builder.save_index(embedding_index, output_file)

        # Final summary
        print("\n" + "=" * 70)
        print(" EMBEDDING GENERATION COMPLETE ✅")
        print("=" * 70)
        print(f"\nOutput file: {output_file}")
        print(f"Total listings indexed: {len(embedding_index['listing_ids'])}")
        print(f"Embedding dimensions: {embedding_index['embeddings'].shape[1]}")
        print(f"File size: {os.path.getsize(output_file) / (1024*1024):.2f} MB")
        print(f"\nCompleted: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("\n🎉 You can now use the Flask API for semantic search!")

        return 0

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
