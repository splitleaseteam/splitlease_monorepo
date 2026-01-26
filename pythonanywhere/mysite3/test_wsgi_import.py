#!/usr/bin/env python3
"""
Test if WSGI can successfully import the application
Run this on PythonAnywhere to simulate what WSGI does

Usage: python3 test_wsgi_import.py
"""
import os
import sys

print("=" * 60)
print("TESTING WSGI IMPORT PROCESS")
print("=" * 60)

# Step 1: Set up path (like WSGI does)
project_home = '/home/SplitLease/mysite3'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

print(f"\n1. Python path configured:")
print(f"   Working directory: {os.getcwd()}")
print(f"   Project home: {project_home}")
print(f"   In sys.path: {project_home in sys.path}")

# Step 2: Load environment (like WSGI does)
print(f"\n2. Loading .env file...")
try:
    from dotenv import load_dotenv
    env_path = os.path.join(project_home, '.env')

    if os.path.exists(env_path):
        load_dotenv(env_path)
        print(f"   ✅ .env loaded from: {env_path}")

        # Check key environment variables
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")

        if supabase_url:
            print(f"   ✅ SUPABASE_URL: {supabase_url[:40]}...")
        else:
            print(f"   ❌ SUPABASE_URL not set!")

        if supabase_key:
            print(f"   ✅ SUPABASE_KEY: {supabase_key[:20]}...")
        else:
            print(f"   ❌ SUPABASE_KEY not set!")
    else:
        print(f"   ❌ .env file not found at: {env_path}")

except Exception as e:
    print(f"   ❌ Error loading .env: {e}")

# Step 3: Import app (this is where it usually fails)
print(f"\n3. Attempting to import app.py...")
try:
    import app
    print(f"   ✅ app.py imported successfully!")

    # Check what's available
    if hasattr(app, 'application'):
        print(f"   ✅ 'application' object found (WSGI ready)")
        print(f"   Type: {type(app.application)}")
    else:
        print(f"   ❌ 'application' object NOT found!")
        print(f"   Available attributes: {[x for x in dir(app) if not x.startswith('_')][:10]}")

    if hasattr(app, 'app'):
        print(f"   ✅ 'app' object found")
    else:
        print(f"   ❌ 'app' object NOT found!")

    # Check if embedding_model is properly set
    if hasattr(app, 'embedding_model'):
        print(f"   ℹ️  embedding_model = {app.embedding_model}")

except ImportError as e:
    print(f"   ❌ Import Error: {e}")
    print(f"\n   This is a missing dependency or syntax error.")

    import traceback
    print("\n   Full traceback:")
    traceback.print_exc()

except SyntaxError as e:
    print(f"   ❌ Syntax Error in app.py: {e}")
    print(f"   File: {e.filename}")
    print(f"   Line: {e.lineno}")

except Exception as e:
    print(f"   ❌ Unexpected error: {type(e).__name__}: {e}")

    import traceback
    print("\n   Full traceback:")
    traceback.print_exc()

# Step 4: Try to access a route (if import succeeded)
print(f"\n4. Testing application object...")
try:
    if 'app' in locals():
        application = app.application
        print(f"   ✅ Application object accessible")

        # Try to get app context info
        if hasattr(application, 'url_map'):
            routes = [str(rule) for rule in application.url_map.iter_rules()]
            print(f"   ✅ Found {len(routes)} routes:")
            for route in routes[:5]:
                print(f"      - {route}")
            if len(routes) > 5:
                print(f"      ... and {len(routes) - 5} more")

except Exception as e:
    print(f"   ❌ Error accessing application: {e}")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)

# Final verdict
if 'app' in locals() and hasattr(app, 'application'):
    print("\n✅ SUCCESS: WSGI import should work!")
    print("   If still getting 500 error, check PythonAnywhere error log")
    sys.exit(0)
else:
    print("\n❌ FAILED: WSGI import will not work")
    print("   Fix the errors above before reloading web app")
    sys.exit(1)
