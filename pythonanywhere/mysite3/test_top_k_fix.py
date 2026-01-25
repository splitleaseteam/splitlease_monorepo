#!/usr/bin/env python3
"""
Test script to verify top_k fix for large values
"""

import requests
import json

# Test against local or production API
API_URL = "https://push-SplitLease.pythonanywhere.com"
# API_URL = "http://localhost:5000"  # Uncomment for local testing

def test_top_k_scenarios():
    """Test various top_k values"""

    test_query = "Need place in Brooklyn under $150"

    test_cases = [
        (10, "Normal case"),
        (20, "Default case"),
        (50, "Medium case"),
        (243, "Exact maximum"),
        (500, "Above maximum"),
        (1000, "Way above maximum"),
    ]

    print("=" * 70)
    print("Testing top_k Parameter Handling")
    print("=" * 70)
    print(f"\nAPI: {API_URL}")
    print(f"Query: '{test_query}'\n")

    # First check health
    try:
        health = requests.get(f"{API_URL}/health", timeout=10)
        health_data = health.json()
        print(f"✅ API Health Check:")
        print(f"   Status: {health_data.get('status')}")
        print(f"   Database: {health_data.get('database')}")
        print(f"   Model: {health_data.get('tensorflow_model')}")
        print(f"   Index: {health_data.get('embedding_index')}")
        print(f"   Ready: {health_data.get('ready')}\n")

        max_available = int(health_data.get('embedding_index', '0').split()[0])
        print(f"📊 Total listings available: {max_available}\n")

    except Exception as e:
        print(f"❌ Health check failed: {e}\n")
        return

    print("-" * 70)

    # Test each top_k value
    for top_k, description in test_cases:
        print(f"\n🧪 Test: {description} (top_k={top_k})")
        print("-" * 70)

        try:
            response = requests.post(
                f"{API_URL}/match",
                json={"query": test_query, "top_k": top_k},
                headers={"Content-Type": "application/json"},
                timeout=30
            )

            if response.status_code == 200:
                data = response.json()
                actual_count = data.get('count', 0)
                processing_time = data.get('processing_time_ms', 0)

                print(f"✅ SUCCESS")
                print(f"   Requested: {top_k} listings")
                print(f"   Returned: {actual_count} listings")
                print(f"   Processing time: {processing_time:.2f}ms")

                # Show first result if available
                if data.get('matches'):
                    first = data['matches'][0]
                    print(f"   Top match: {first.get('title', 'N/A')[:50]}")
                    print(f"   Score: {first.get('similarity_score', 0):.4f}")

            else:
                error_data = response.json()
                print(f"❌ FAILED (Status {response.status_code})")
                print(f"   Error: {error_data.get('error', 'Unknown error')}")
                print(f"   Type: {error_data.get('type', 'N/A')}")

        except requests.exceptions.Timeout:
            print(f"⏱️  TIMEOUT (request took > 30s)")

        except Exception as e:
            print(f"❌ EXCEPTION: {str(e)[:100]}")

    print("\n" + "=" * 70)
    print("Test Complete")
    print("=" * 70)


if __name__ == '__main__':
    test_top_k_scenarios()
