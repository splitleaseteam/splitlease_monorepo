#!/usr/bin/env python3
"""
Diagnostic script to test all imports used by app.py
Run this on PythonAnywhere to identify which dependency is missing

Usage:
    python3 test_imports.py
"""

import sys
print(f"Python version: {sys.version}")
print(f"Python path: {sys.path}\n")

# Test each import individually
imports_to_test = [
    ("Flask core", "from flask import Flask, request, jsonify"),
    ("Flask CORS", "from flask_cors import CORS"),
    ("OS and sys", "import os"),
    ("dotenv", "from dotenv import load_dotenv"),
    ("NumPy", "import numpy as np"),
    ("Pandas", "import pandas as pd"),
    ("Datetime", "from datetime import datetime, timedelta"),
    ("Supabase", "from supabase import create_client, Client"),
    ("H3", "import h3"),
    ("Regex", "import re"),
    ("JSON", "import json"),
    ("LightGBM", "import lightgbm as lgb"),
    ("Sentence Transformers", "from sentence_transformers import SentenceTransformer"),
    ("Scikit-learn", "from sklearn.metrics.pairwise import cosine_similarity"),
]

print("=" * 60)
print("TESTING IMPORTS")
print("=" * 60)

failed_imports = []
for name, import_statement in imports_to_test:
    try:
        exec(import_statement)
        print(f"✅ {name:25s} OK")
    except ImportError as e:
        print(f"❌ {name:25s} FAILED: {e}")
        failed_imports.append((name, str(e)))
    except Exception as e:
        print(f"⚠️  {name:25s} ERROR: {e}")
        failed_imports.append((name, str(e)))

print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)

if failed_imports:
    print(f"\n❌ {len(failed_imports)} imports failed:\n")
    for name, error in failed_imports:
        print(f"  • {name}: {error}")

    print("\n" + "=" * 60)
    print("RECOMMENDED FIXES")
    print("=" * 60)
    print("\nInstall missing packages with:")
    print("pip3 install --user <package-name>\n")

    # Suggest specific installation commands
    package_map = {
        "Flask core": "flask",
        "Flask CORS": "flask-cors",
        "dotenv": "python-dotenv",
        "NumPy": "numpy",
        "Pandas": "pandas",
        "Supabase": "supabase",
        "H3": "h3",
        "LightGBM": "lightgbm",
        "Sentence Transformers": "sentence-transformers",
        "Scikit-learn": "scikit-learn",
    }

    for name, _ in failed_imports:
        if name in package_map:
            print(f"pip3 install --user {package_map[name]}")

else:
    print("✅ All imports successful!")
    print("\nNow testing if app.py can be imported...")

    try:
        # Try to import the actual app
        import app
        print("✅ app.py imported successfully!")

        # Check if application object exists
        if hasattr(app, 'application'):
            print("✅ 'application' object found (WSGI ready)")
        else:
            print("❌ 'application' object not found - WSGI won't work")
            print("   Check the bottom of app.py for: application = app")

    except Exception as e:
        print(f"❌ Failed to import app.py: {e}")
        print(f"\nError details:\n{type(e).__name__}: {e}")

        import traceback
        print("\nFull traceback:")
        traceback.print_exc()

print("\n" + "=" * 60)
print("ENVIRONMENT VARIABLES")
print("=" * 60)

# Check environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()

    import os
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if supabase_url:
        print(f"✅ SUPABASE_URL: {supabase_url[:30]}...")
    else:
        print("❌ SUPABASE_URL not set")

    if supabase_key:
        print(f"✅ SUPABASE_KEY: {supabase_key[:20]}...")
    else:
        print("❌ SUPABASE_KEY not set")

    if not supabase_url or not supabase_key:
        print("\n⚠️  Create a .env file with:")
        print("SUPABASE_URL=your-url")
        print("SUPABASE_KEY=your-key")

except Exception as e:
    print(f"❌ Error checking environment: {e}")

print("\n" + "=" * 60)
