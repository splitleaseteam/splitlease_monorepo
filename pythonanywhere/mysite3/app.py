#!/usr/bin/env python3
"""
TensorFlow-Powered Semantic Listing Matching API
Flask API with deep learning-based recommendation system
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import numpy as np
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Import our custom modules
from tf_model import ListingMatchingModel, EmbeddingIndexBuilder
from query_processor import QueryProcessor
from temporal_encoder import TemporalEncoder

load_dotenv()

# Initialize Flask
app = Flask(__name__)
CORS(app)

# Initialize Supabase
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Global variables for model and embeddings
model = None
embedding_index = None

# ============================================================
# INITIALIZATION
# ============================================================

def initialize_model():
    """
    Load TensorFlow model and embedding index (called once at startup)
    """
    global model, embedding_index

    import sys
    import logging

    # Configure logging to write to error log
    logging.basicConfig(stream=sys.stderr, level=logging.INFO)
    logger = logging.getLogger(__name__)

    logger.info("\n" + "=" * 70)
    logger.info(" INITIALIZING TENSORFLOW SEMANTIC MATCHING API")
    logger.info("=" * 70 + "\n")

    try:
        # Load TensorFlow model
        logger.info("📦 Loading TensorFlow model...")
        model = ListingMatchingModel()
        logger.info("✅ Model loaded successfully\n")

        # Load pre-computed embeddings
        logger.info("📂 Loading embedding index...")
        logger.info(f"Current working directory: {os.getcwd()}")

        # Use absolute path to embedding file (same directory as this script)
        script_dir = os.path.dirname(os.path.abspath(__file__))
        embedding_path = os.path.join(script_dir, 'listing_embeddings.npz')
        logger.info(f"Looking for: {embedding_path}")

        embedding_index = EmbeddingIndexBuilder.load_index(embedding_path)
        logger.info(f"✅ Loaded {len(embedding_index['listing_ids'])} listing embeddings\n")

        logger.info("=" * 70)
        logger.info(" 🚀 API READY FOR REQUESTS")
        logger.info("=" * 70 + "\n")

        return True

    except FileNotFoundError as e:
        logger.error("⚠️  WARNING: Embedding index not found!")
        logger.error(f"   Error: {e}")
        logger.error(f"   Current directory: {os.getcwd()}")
        logger.error("   Please run: python build_embeddings.py")
        logger.error("   API will start but /match endpoint will not work.\n")
        return False

    except Exception as e:
        logger.error(f"❌ Error during initialization: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(traceback.format_exc())
        return False


# Initialize on startup (lazy loading for WSGI compatibility)
model_ready = False
_initialization_attempted = False

def ensure_model_loaded():
    """Lazy initialization - load model on first request"""
    global model_ready, _initialization_attempted
    if not _initialization_attempted:
        _initialization_attempted = True
        model_ready = initialize_model()
    return model_ready


# ============================================================
# API ENDPOINTS
# ============================================================

@app.route('/', methods=['GET'])
def home():
    """Health check and API info"""
    return jsonify({
        'status': 'ok',
        'service': 'TensorFlow Semantic Listing Matching API',
        'version': '2.0.0-tf',
        'model_ready': model_ready,
        'total_listings': len(embedding_index['listing_ids']) if embedding_index else 0,
        'endpoints': {
            '/': 'GET - API info',
            '/health': 'GET - Health check',
            '/match': 'POST - Semantic listing matching (TensorFlow)',
            '/rebuild': 'POST - Rebuild embedding index'
        }
    })


@app.route('/health', methods=['GET'])
def health():
    """Detailed health check"""
    # Trigger lazy loading
    ensure_model_loaded()

    try:
        # Test database connection
        response = supabase.table('listing').select('_id').limit(1).execute()
        db_status = 'connected' if response.data else 'empty'
    except Exception as e:
        db_status = f'error: {str(e)}'

    return jsonify({
        'status': 'ok',
        'database': db_status,
        'tensorflow_model': 'loaded' if model else 'not loaded',
        'embedding_index': f'{len(embedding_index["listing_ids"])} listings' if embedding_index else 'not loaded',
        'ready': model_ready
    })


@app.route('/match', methods=['POST'])
def match_semantic():
    """
    TensorFlow-powered semantic matching

    Request body:
    {
        "query": "Need Mon-Thu in Brooklyn under $150/night for 3 months",
        "top_k": 20
    }

    Response:
    {
        "query": "...",
        "matches": [
            {
                "listing_id": "...",
                "similarity_score": 0.85,
                "title": "...",
                "price_per_night": 140,
                "city": "Brooklyn",
                "days_available": ["monday", "tuesday", ...],
                "match_reasons": [...]
            }
        ],
        "processing_time_ms": 45
    }
    """
    start_time = datetime.now()

    # Trigger lazy loading
    ensure_model_loaded()

    if not model_ready:
        return jsonify({
            'error': 'Model not ready. Please run build_embeddings.py first.'
        }), 503

    try:
        # Parse request
        data = request.get_json()
        query_text = data.get('query', '')
        top_k = data.get('top_k', 20)

        if not query_text:
            return jsonify({'error': 'query field is required'}), 400

        # Validate and cap top_k to available listings
        max_listings = len(embedding_index['listing_ids']) if embedding_index else 0
        if top_k > max_listings:
            top_k = max_listings

        # Step 1: Process user query
        try:
            query_data = QueryProcessor.process_query(query_text, supabase)
        except Exception as e:
            import traceback
            return jsonify({
                'error': f'Query processing failed: {str(e)}',
                'type': type(e).__name__,
                'traceback': traceback.format_exc()
            }), 400

        # Step 1.5: Filter by borough if specified (STRICT - no fallback, no active filter)
        borough = query_data.get('parsed', {}).get('borough')

        if borough:
            borough_id = borough['id']

            # Get ALL listings from requested borough (active and inactive)
            borough_listings = supabase.table('listing')\
                .select('_id')\
                .eq('"Location - Borough"', borough_id)\
                .execute()

            # Filter embedding index to only include borough listings
            borough_listing_ids = {l['_id'] for l in borough_listings.data}
            borough_mask = [lid in borough_listing_ids for lid in embedding_index['listing_ids']]
            filtered_embeddings = embedding_index['embeddings'][borough_mask]
            filtered_ids = [lid for lid, m in zip(embedding_index['listing_ids'], borough_mask) if m]

            # Step 2: Compute similarity scores on filtered embeddings
            similarities = model.match(
                query_text,
                query_data['structured_features'],
                query_data['schedule_features'],
                filtered_embeddings
            )

            # Step 3: Get top-k results from filtered set
            top_indices = np.argsort(similarities)[::-1][:top_k]
            top_listing_ids = [filtered_ids[i] for i in top_indices]
            top_scores = [float(similarities[i]) for i in top_indices]

        else:
            # No borough specified - use all listings
            # Step 2: Compute similarity scores using TensorFlow
            similarities = model.match(
                query_text,
                query_data['structured_features'],
                query_data['schedule_features'],
                embedding_index['embeddings']
            )

            # Step 3: Get top-k results
            top_indices = np.argsort(similarities)[::-1][:top_k]
            top_listing_ids = [embedding_index['listing_ids'][i] for i in top_indices]
            top_scores = [float(similarities[i]) for i in top_indices]

        # Step 4: Fetch full listing details from database
        listings_response = supabase.table('listing').select('*').in_('_id', top_listing_ids).execute()

        # Create lookup map
        listing_map = {l['_id']: l for l in listings_response.data}

        # Step 5: Format results
        results = []
        for listing_id, score in zip(top_listing_ids, top_scores):
            listing = listing_map.get(listing_id)
            if not listing:
                continue

            # Calculate price for display - use "Price number (for map)" field
            # This is the standardized per-night price shown on the map
            # Convert to float since it's stored as string in database
            price_raw = listing.get('Price number (for map)') or 0
            try:
                price = float(price_raw)
            except (ValueError, TypeError):
                price = 0

            # Extract location
            location_addr = listing.get('Location - Address', {})
            lat, lng = None, None
            if isinstance(location_addr, dict):
                lat = location_addr.get('lat')
                lng = location_addr.get('lng')

            # Generate match reasons
            match_reasons = QueryProcessor.format_match_reasons(
                query_data, listing, score
            )

            # Safe extraction with None checks
            description = listing.get('Description') or ''
            description_preview = str(description)[:200] if description else ''

            results.append({
                'listing_id': listing_id,
                'similarity_score': score,
                'title': listing.get('Name') or 'Untitled',
                'description': description_preview,
                'city': listing.get('Location - City'),
                'neighborhood': listing.get('Location - Hood'),
                'price_per_night': float(price) if price else None,
                'bedrooms': listing.get('Features - Qty Bedrooms'),
                'bathrooms': listing.get('Features - Qty Bathrooms'),
                'days_available': listing.get('Days Available (List of Days)') or [],
                'coordinates': {'lat': lat, 'lng': lng} if lat and lng else None,
                'match_reasons': match_reasons,
                'url': f"https://split-lease.com/listings/{listing_id}"
            })

        # Calculate processing time
        processing_time_ms = (datetime.now() - start_time).total_seconds() * 1000

        # Convert parsed query to JSON-serializable format
        parsed_query_serializable = {}
        for key, value in query_data.get('parsed', {}).items():
            if value is None:
                parsed_query_serializable[key] = None
            elif isinstance(value, dict):
                # Convert any numpy values in nested dicts
                parsed_query_serializable[key] = {
                    k: (v.tolist() if hasattr(v, 'tolist') else v)
                    for k, v in value.items()
                    if v is not None
                }
            elif hasattr(value, 'tolist'):
                # Convert numpy arrays to lists
                parsed_query_serializable[key] = value.tolist()
            else:
                parsed_query_serializable[key] = value

        return jsonify({
            'query': query_text,
            'parsed_query': parsed_query_serializable,
            'matches': results,
            'count': len(results),
            'processing_time_ms': round(processing_time_ms, 2),
            'model': 'TensorFlow Two-Tower Semantic Matching'
        })

    except Exception as e:
        import traceback
        import sys

        # Log detailed error for debugging
        error_trace = traceback.format_exc()
        print(f"ERROR in /match endpoint:", file=sys.stderr)
        print(f"Error type: {type(e).__name__}", file=sys.stderr)
        print(f"Error message: {str(e)}", file=sys.stderr)
        print(f"Traceback:\n{error_trace}", file=sys.stderr)

        return jsonify({
            'error': str(e),
            'type': type(e).__name__,
            'traceback': error_trace if app.debug else None
        }), 500


@app.route('/rebuild', methods=['POST'])
def rebuild_embeddings():
    """
    Rebuild embedding index (call after adding new listings)

    Requires admin authentication in production!
    """
    global embedding_index

    try:
        from listing_preprocessor import ListingPreprocessor

        # Fetch and preprocess
        preprocessor = ListingPreprocessor()
        listings_df = preprocessor.fetch_all_listings()
        processed = preprocessor.preprocess_all(listings_df)

        # Rebuild embeddings
        builder = EmbeddingIndexBuilder(model)
        new_index = builder.build_index(processed)
        builder.save_index(new_index, 'listing_embeddings.npz')

        # Update global index
        embedding_index = new_index

        return jsonify({
            'status': 'success',
            'listings_indexed': len(new_index['listing_ids']),
            'message': 'Embedding index rebuilt successfully'
        })

    except Exception as e:
        return jsonify({
            'error': str(e),
            'type': type(e).__name__
        }), 500


@app.route('/debug/query', methods=['POST'])
def debug_query():
    """
    Debug endpoint to see how a query is parsed

    Request:
    {
        "query": "Need Mon-Thu in Brooklyn under $150"
    }

    Response:
    {
        "query": "...",
        "parsed": {...},
        "structured_features": [...],
        "schedule_features": [...]
    }
    """
    try:
        data = request.get_json()
        query_text = data.get('query', '')

        if not query_text:
            return jsonify({'error': 'query field is required'}), 400

        query_data = QueryProcessor.process_query(query_text)

        return jsonify({
            'query': query_text,
            'parsed': query_data['parsed'],
            'structured_features': query_data['structured_features'].tolist(),
            'schedule_features': query_data['schedule_features'].tolist(),
            'feature_explanations': {
                'structured': [
                    'budget_min', 'budget_max',
                    'lat', 'lng', 'radius_km',
                    'nights', 'weeks',
                    'nights_per_week', 'flexible',
                    'reserved_1', 'reserved_2', 'reserved_3'
                ],
                'schedule': [
                    'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
                    'days_per_week', 'weekday_ratio', 'consecutive', 'flexible'
                ]
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/debug/listing/<listing_id>', methods=['GET'])
def debug_listing(listing_id):
    """
    Show embedding details for a specific listing
    """
    try:
        if not embedding_index:
            return jsonify({'error': 'Embedding index not loaded'}), 503

        # Find listing in index
        if listing_id in embedding_index['listing_ids']:
            idx = embedding_index['listing_ids'].index(listing_id)
            embedding = embedding_index['embeddings'][idx]

            # Fetch from database
            listing = supabase.table('listing').select('*').eq('_id', listing_id).single().execute()

            return jsonify({
                'listing_id': listing_id,
                'title': listing.data.get('Name'),
                'embedding_shape': embedding.shape,
                'embedding_norm': float(np.linalg.norm(embedding)),
                'embedding_preview': embedding[:10].tolist(),  # First 10 dims
                'days_available': listing.data.get('Days Available (List of Days)'),
                'price': listing.data.get('💰Nightly Host Rate for 7 nights')
            })
        else:
            return jsonify({'error': 'Listing not found in index'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================
# MAIN
# ============================================================

if __name__ == '__main__':
    # For local development
    print("\n🌐 Starting Flask development server...")
    print("   API will be available at: http://localhost:5000")
    print("   Press CTRL+C to stop\n")

    app.run(debug=True, host='0.0.0.0', port=5000)

else:
    # For production (e.g., PythonAnywhere, Gunicorn)
    application = app
