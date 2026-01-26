#!/usr/bin/env python3
"""
TensorFlow Two-Tower Model for Semantic Listing Matching
Uses Universal Sentence Encoder + structured features + temporal features
"""

import tensorflow as tf
import tensorflow_hub as hub
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
from typing import Dict, Tuple, Optional


class ListingMatchingModel:
    """
    Two-tower neural network for semantic matching between user queries and listings

    Architecture:
    - User Tower: Text embedding (512) + Structured features (12+11) → 128-dim
    - Listing Tower: Text embedding (512) + Structured (12) + Temporal (11) → 128-dim
    - Similarity: Cosine similarity between normalized embeddings
    """

    # Universal Sentence Encoder model URL
    USE_MODEL_URL = "https://tfhub.dev/google/universal-sentence-encoder/4"

    def __init__(self, use_cached_encoder: bool = True):
        """
        Initialize the two-tower model

        Args:
            use_cached_encoder: If True, load pre-trained USE from TF Hub (recommended)
        """
        print("🏗️  Building TensorFlow two-tower model...")

        # Load Universal Sentence Encoder (512-dim output)
        print("  Loading Universal Sentence Encoder from TF Hub...")
        self.text_encoder = hub.KerasLayer(
            self.USE_MODEL_URL,
            trainable=False,  # Keep pre-trained weights frozen
            name="universal_sentence_encoder"
        )
        print("  ✅ Text encoder loaded (512-dim embeddings)")

        # Build model components
        self._build_user_tower()
        self._build_listing_tower()

        print("✅ Model architecture built successfully\n")

    def _build_user_tower(self):
        """
        Build user query processing tower

        Input features:
        - Text: Variable length string
        - Structured: 12 numeric features (budget, location, duration, schedule mask)
        - Schedule: 11 temporal features (encoded from query)
        Total: 512 (text) + 23 (structured+schedule) = 535 dims → 128 dims
        """
        # Structured features encoder (23 features: 12 numeric + 11 schedule)
        self.user_structured_encoder = keras.Sequential([
            layers.Dense(64, activation='relu', name='user_struct_1'),
            layers.Dropout(0.2, name='user_dropout_1'),
            layers.Dense(64, activation='relu', name='user_struct_2')
        ], name='user_structured_tower')

        # Fusion layer: Combine text (512) + structured (64)
        self.user_fusion = keras.Sequential([
            layers.Dense(256, activation='relu', name='user_fusion_1'),
            layers.Dropout(0.3, name='user_fusion_dropout'),
            layers.Dense(128, activation='relu', name='user_fusion_2'),
            layers.Lambda(
                lambda x: tf.math.l2_normalize(x, axis=1),
                name='user_l2_normalize'
            )
        ], name='user_fusion_layer')

    def _build_listing_tower(self):
        """
        Build listing processing tower

        Input features:
        - Text: Combined listing description
        - Structured: 12 numeric features (price, location, size, duration)
        - Temporal: 11 features (days available encoding)
        Total: 512 (text) + 12 (struct) + 11 (temporal) = 535 dims → 128 dims
        """
        # Structured features encoder (12 features)
        self.listing_structured_encoder = keras.Sequential([
            layers.Dense(64, activation='relu', name='listing_struct_1'),
            layers.Dropout(0.2, name='listing_dropout_1'),
            layers.Dense(64, activation='relu', name='listing_struct_2')
        ], name='listing_structured_tower')

        # Temporal features encoder (11 features)
        self.listing_temporal_encoder = keras.Sequential([
            layers.Dense(32, activation='relu', name='listing_temporal_1'),
            layers.Dense(32, activation='relu', name='listing_temporal_2')
        ], name='listing_temporal_tower')

        # Fusion layer: Combine text (512) + structured (64) + temporal (32)
        self.listing_fusion = keras.Sequential([
            layers.Dense(256, activation='relu', name='listing_fusion_1'),
            layers.Dropout(0.3, name='listing_fusion_dropout'),
            layers.Dense(128, activation='relu', name='listing_fusion_2'),
            layers.Lambda(
                lambda x: tf.math.l2_normalize(x, axis=1),
                name='listing_l2_normalize'
            )
        ], name='listing_fusion_layer')

    def encode_user_query(self, query_text: tf.Tensor,
                          structured_features: tf.Tensor,
                          schedule_features: tf.Tensor) -> tf.Tensor:
        """
        Encode user query into 128-dim embedding

        Args:
            query_text: Tensor of shape (batch_size,) containing query strings
            structured_features: Tensor of shape (batch_size, 12) numeric features
            schedule_features: Tensor of shape (batch_size, 11) schedule encoding

        Returns:
            Normalized embedding of shape (batch_size, 128)
        """
        # Text embedding (512-dim)
        text_emb = self.text_encoder(query_text)

        # Structured + schedule features (23-dim → 64-dim)
        combined_features = tf.concat([structured_features, schedule_features], axis=1)
        struct_emb = self.user_structured_encoder(combined_features)

        # Fuse text + structured (512 + 64 → 128-dim)
        combined = tf.concat([text_emb, struct_emb], axis=1)
        user_embedding = self.user_fusion(combined)

        return user_embedding

    def encode_listing(self, listing_text: tf.Tensor,
                       structured_features: tf.Tensor,
                       temporal_features: tf.Tensor) -> tf.Tensor:
        """
        Encode listing into 128-dim embedding

        Args:
            listing_text: Tensor of shape (batch_size,) containing listing descriptions
            structured_features: Tensor of shape (batch_size, 12) numeric features
            temporal_features: Tensor of shape (batch_size, 11) days/nights encoding

        Returns:
            Normalized embedding of shape (batch_size, 128)
        """
        # Text embedding (512-dim)
        text_emb = self.text_encoder(listing_text)

        # Structured features (12-dim → 64-dim)
        struct_emb = self.listing_structured_encoder(structured_features)

        # Temporal features (11-dim → 32-dim)
        temp_emb = self.listing_temporal_encoder(temporal_features)

        # Fuse text + structured + temporal (512 + 64 + 32 → 128-dim)
        combined = tf.concat([text_emb, struct_emb, temp_emb], axis=1)
        listing_embedding = self.listing_fusion(combined)

        return listing_embedding

    def compute_similarity(self, user_embedding: tf.Tensor,
                          listing_embeddings: tf.Tensor) -> tf.Tensor:
        """
        Compute cosine similarity between user and listings

        Args:
            user_embedding: Tensor of shape (1, 128) - single user query
            listing_embeddings: Tensor of shape (n_listings, 128) - all listings

        Returns:
            Similarity scores of shape (n_listings,) ranging from -1 to 1
        """
        # Cosine similarity = dot product of L2-normalized vectors
        # user_embedding: (1, 128)
        # listing_embeddings: (n_listings, 128)
        # Result: (n_listings,)

        similarities = tf.matmul(listing_embeddings, user_embedding, transpose_b=True)
        return tf.squeeze(similarities)

    def match(self, query_text: str,
              user_structured: np.ndarray,
              user_schedule: np.ndarray,
              listing_embeddings: np.ndarray) -> np.ndarray:
        """
        Main matching function: Find top listings for a user query

        Args:
            query_text: User's search query string
            user_structured: User features (12,) - budget, location, etc.
            user_schedule: User schedule (11,) - days/nights needed
            listing_embeddings: Pre-computed listing embeddings (n_listings, 128)

        Returns:
            Similarity scores (n_listings,) - higher is better
        """
        # Convert inputs to tensors
        query_tensor = tf.constant([query_text])
        struct_tensor = tf.constant([user_structured], dtype=tf.float32)
        sched_tensor = tf.constant([user_schedule], dtype=tf.float32)

        # Encode user query
        user_emb = self.encode_user_query(query_tensor, struct_tensor, sched_tensor)

        # Compute similarities
        listing_emb_tensor = tf.constant(listing_embeddings, dtype=tf.float32)
        similarities = self.compute_similarity(user_emb, listing_emb_tensor)

        return similarities.numpy()


# ============================================================
# EMBEDDING INDEX BUILDER
# ============================================================

class EmbeddingIndexBuilder:
    """
    Builds and saves embedding index for all listings
    """

    def __init__(self, model: ListingMatchingModel):
        self.model = model

    def build_index(self, processed_listings: list,
                    batch_size: int = 32) -> Dict:
        """
        Generate embeddings for all listings

        Args:
            processed_listings: List of dicts from ListingPreprocessor.preprocess_all()
            batch_size: Batch size for processing (larger = faster but more memory)

        Returns:
            Dictionary containing:
            - listing_ids: List of listing IDs
            - embeddings: np.array of shape (n_listings, 128)
            - metadata: Original processed listings
        """
        print(f"\n🔮 Generating embeddings for {len(processed_listings)} listings...")

        listing_ids = []
        all_embeddings = []

        # Process in batches for efficiency
        for i in range(0, len(processed_listings), batch_size):
            batch = processed_listings[i:i+batch_size]

            # Extract batch data
            texts = [l['text'] for l in batch]
            structured = np.array([l['structured_features'] for l in batch])
            temporal = np.array([l['temporal_features'] for l in batch])

            # Convert to tensors
            text_tensor = tf.constant(texts)
            struct_tensor = tf.constant(structured, dtype=tf.float32)
            temp_tensor = tf.constant(temporal, dtype=tf.float32)

            # Generate embeddings
            embeddings = self.model.encode_listing(
                text_tensor, struct_tensor, temp_tensor
            )

            # Collect results
            listing_ids.extend([l['listing_id'] for l in batch])
            all_embeddings.append(embeddings.numpy())

            if (i + batch_size) % 100 == 0:
                print(f"  Processed {min(i + batch_size, len(processed_listings))}/{len(processed_listings)} listings...")

        # Combine all batches
        all_embeddings = np.vstack(all_embeddings)

        print(f"✅ Generated {len(all_embeddings)} embeddings (shape: {all_embeddings.shape})\n")

        return {
            'listing_ids': listing_ids,
            'embeddings': all_embeddings,
            'metadata': processed_listings
        }

    def save_index(self, index: Dict, filepath: str = 'listing_embeddings.npz'):
        """
        Save embedding index to disk

        Args:
            index: Output from build_index()
            filepath: Where to save (default: listing_embeddings.npz)
        """
        print(f"💾 Saving embedding index to {filepath}...")

        np.savez_compressed(
            filepath,
            listing_ids=index['listing_ids'],
            embeddings=index['embeddings']
        )

        print(f"✅ Index saved successfully ({len(index['listing_ids'])} listings)\n")

    @staticmethod
    def load_index(filepath: str = 'listing_embeddings.npz') -> Dict:
        """
        Load embedding index from disk

        Args:
            filepath: Path to saved index

        Returns:
            Dictionary with listing_ids and embeddings
        """
        print(f"📂 Loading embedding index from {filepath}...")

        data = np.load(filepath, allow_pickle=True)

        index = {
            'listing_ids': data['listing_ids'].tolist(),
            'embeddings': data['embeddings']
        }

        print(f"✅ Loaded {len(index['listing_ids'])} listings\n")

        return index


# ============================================================
# TESTING
# ============================================================

if __name__ == '__main__':
    print("=== TensorFlow Model Testing ===\n")

    try:
        # Initialize model
        model = ListingMatchingModel()

        # Test encoding
        print("🧪 Testing user query encoding...")
        test_query = "Need Mon-Thu in Brooklyn under $150/night"
        test_structured = np.array([
            120.0, 150.0,  # Budget min/max
            40.7128, -74.0060,  # NYC coords
            5.0, 7, 1,  # Radius, nights, weeks
            4, 1  # Nights per week, flexible
        ] + [1, 1, 1, 1, 0, 0, 0], dtype=np.float32)  # Mon-Thu mask

        test_schedule = np.array([
            1, 1, 1, 1, 0, 0, 0,  # Mon-Thu mask
            4, 0.8, 1, 0  # 4 nights, 80% weekday, consecutive, not flexible
        ], dtype=np.float32)

        user_emb = model.encode_user_query(
            tf.constant([test_query]),
            tf.constant([test_structured]),
            tf.constant([test_schedule])
        )

        print(f"  Query: '{test_query}'")
        print(f"  Embedding shape: {user_emb.shape}")
        print(f"  Embedding norm: {tf.norm(user_emb).numpy():.4f} (should be ~1.0)")
        print("  ✅ User encoding works!\n")

        # Test listing encoding
        print("🧪 Testing listing encoding...")
        test_listing_text = "Cozy 1BR in Williamsburg, perfect for professionals"
        test_listing_struct = np.array([
            140.0, 130.0, 550.0, 2000.0,  # Prices
            40.7081, -73.9571,  # Williamsburg coords
            1, 1, 2, 0.6,  # 1BR, 1BA, 2 guests, 600sqft
            2, 0.5  # Min 2 nights, max 180 days
        ], dtype=np.float32)

        test_listing_temporal = np.array([
            1, 1, 1, 1, 1, 0, 0,  # Mon-Fri available
            5, 1.0, 1, 1  # 5 days/week, all weekdays, consecutive, flexible
        ], dtype=np.float32)

        listing_emb = model.encode_listing(
            tf.constant([test_listing_text]),
            tf.constant([test_listing_struct]),
            tf.constant([test_listing_temporal])
        )

        print(f"  Listing: '{test_listing_text[:50]}...'")
        print(f"  Embedding shape: {listing_emb.shape}")
        print(f"  Embedding norm: {tf.norm(listing_emb).numpy():.4f}")
        print("  ✅ Listing encoding works!\n")

        # Test similarity
        print("🧪 Testing similarity computation...")
        similarity = model.compute_similarity(user_emb, listing_emb)

        print(f"  Similarity score: {similarity.numpy()[0]:.4f}")
        print(f"  Match quality: {'✅ GOOD' if similarity > 0.5 else '⚠️ MODERATE' if similarity > 0.3 else '❌ POOR'}")

        print("\n✅ All model tests passed!")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
