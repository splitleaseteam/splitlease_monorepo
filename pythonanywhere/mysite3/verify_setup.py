#!/usr/bin/env python3
"""
Quick Setup Verification Script
Checks if TensorFlow system is ready to use
"""

import os
import sys
from pathlib import Path

def check_file(filepath, description):
    """Check if a file exists"""
    if Path(filepath).exists():
        print(f"  ✅ {description}")
        return True
    else:
        print(f"  ❌ {description} - NOT FOUND")
        return False

def check_module(module_name):
    """Check if a Python module is installed"""
    try:
        __import__(module_name)
        print(f"  ✅ {module_name}")
        return True
    except ImportError:
        print(f"  ❌ {module_name} - NOT INSTALLED")
        return False

def main():
    print("=" * 70)
    print(" TENSORFLOW SEMANTIC MATCHING - SETUP VERIFICATION")
    print("=" * 70)

    all_ok = True

    # Check 1: Core Python files
    print("\n1. Checking Core Python Files...")
    print("-" * 70)
    files_to_check = [
        ('temporal_encoder.py', 'Temporal Encoder'),
        ('listing_preprocessor.py', 'Listing Preprocessor'),
        ('query_processor.py', 'Query Processor'),
        ('tf_model.py', 'TensorFlow Model'),
        ('build_embeddings.py', 'Embedding Builder'),
        ('app_tf.py', 'Flask API'),
        ('test_tf_api.py', 'Test Suite'),
        ('requirements_tf.txt', 'Requirements File'),
        ('.env', 'Environment Variables')
    ]

    for filename, description in files_to_check:
        if not check_file(filename, description):
            all_ok = False

    # Check 2: Python Dependencies
    print("\n2. Checking Python Dependencies...")
    print("-" * 70)
    modules_to_check = [
        'tensorflow',
        'tensorflow_hub',
        'flask',
        'flask_cors',
        'supabase',
        'numpy',
        'pandas',
        'dotenv'
    ]

    for module in modules_to_check:
        if not check_module(module):
            all_ok = False

    # Check 3: Environment Variables
    print("\n3. Checking Environment Variables...")
    print("-" * 70)

    from dotenv import load_dotenv
    load_dotenv()

    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')

    if supabase_url and supabase_url.startswith('https://'):
        print(f"  ✅ SUPABASE_URL: {supabase_url}")
    else:
        print(f"  ❌ SUPABASE_URL: Not configured or invalid")
        all_ok = False

    if supabase_key and len(supabase_key) > 50:
        print(f"  ✅ SUPABASE_KEY: {supabase_key[:20]}...{supabase_key[-10:]}")
    else:
        print(f"  ❌ SUPABASE_KEY: Not configured or invalid")
        all_ok = False

    # Check 4: Database Connection
    print("\n4. Testing Database Connection...")
    print("-" * 70)

    try:
        from supabase import create_client
        supabase = create_client(supabase_url, supabase_key)
        response = supabase.table('listing').select('_id').limit(1).execute()

        if response.data:
            print(f"  ✅ Connected to Supabase successfully")

            # Count total listings
            count_response = supabase.table('listing').select('_id', count='exact').eq('Active', True).execute()
            total = count_response.count if hasattr(count_response, 'count') else len(count_response.data)
            print(f"  ✅ Found {total} active listings in database")
        else:
            print(f"  ⚠️  Connected but no listings found")
    except Exception as e:
        print(f"  ❌ Database connection failed: {e}")
        all_ok = False

    # Check 5: Embedding Index
    print("\n5. Checking Embedding Index...")
    print("-" * 70)

    if Path('listing_embeddings.npz').exists():
        import numpy as np
        try:
            index = np.load('listing_embeddings.npz', allow_pickle=True)
            embeddings = index['embeddings']
            listing_ids = index['listing_ids']
            print(f"  ✅ Embedding index found: {len(listing_ids)} listings, {embeddings.shape[1]}-dim embeddings")
            print(f"  ✅ File size: {Path('listing_embeddings.npz').stat().st_size / (1024*1024):.2f} MB")
        except Exception as e:
            print(f"  ⚠️  Embedding index exists but could not be loaded: {e}")
    else:
        print(f"  ⚠️  Embedding index NOT FOUND (listing_embeddings.npz)")
        print(f"     → Run: python build_embeddings.py")

    # Summary
    print("\n" + "=" * 70)
    if all_ok:
        print(" ✅ SETUP COMPLETE - READY TO USE!")
        print("=" * 70)
        print("\nNext Steps:")
        if not Path('listing_embeddings.npz').exists():
            print("  1. Build embedding index: python build_embeddings.py")
            print("  2. Start the API: python app_tf.py")
        else:
            print("  1. Start the API: python app_tf.py")
            print("  2. Test the API: python test_tf_api.py")
    else:
        print(" ❌ SETUP INCOMPLETE - ISSUES FOUND")
        print("=" * 70)
        print("\nPlease fix the issues above before proceeding.")
        print("\nCommon fixes:")
        print("  - Install dependencies: pip install -r requirements_tf.txt")
        print("  - Configure .env file with SUPABASE_URL and SUPABASE_KEY")

    print()
    return 0 if all_ok else 1

if __name__ == '__main__':
    sys.exit(main())
