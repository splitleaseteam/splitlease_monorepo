#!/usr/bin/env python3
"""Test the matching API with sample queries"""
import requests
import json

# Your PythonAnywhere URL
API_URL = "https://push-splitlease.pythonanywhere.com"

def test_matching():
    """Test various query patterns"""
    
    test_queries = [
        {
            "name": "Hybrid worker - weeknight commuter",
            "query": "Need a place Monday-Thursday nights every week for work commute, budget $100-130/night with wifi and desk space"
        },
        {
            "name": "Bi-city professional",
            "query": "Work in NYC 3 nights a week, need quiet apartment near downtown with parking around $120/night"
        },
        {
            "name": "Recurring weekly stay",
            "query": "Looking for furnished place for weeknights, need workspace and kitchen, budget under $150/night"
        },
        {
            "name": "Seasonal commuter",
            "query": "Need pied-a-terre for 4 nights per week ongoing, quiet neighborhood with good wifi between $90-140/night"
        },
        {
            "name": "Professional workspace focus",
            "query": "Hybrid schedule requires city apartment 2-3 nights weekly, must have desk and reliable internet, around $110/night"
        }
    ]
    
    print("=" * 70)
    print("🧪 Testing Split Lease Matching API")
    print("=" * 70)
    
    for test in test_queries:
        print(f"\n📝 Test: {test['name']}")
        print(f"   Query: \"{test['query']}\"")
        
        try:
            response = requests.post(
                f"{API_URL}/match",
                json={"query": test['query'], "top_k": 5},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                print(f"\n   ✅ Success!")
                print(f"   Parsed budget: ${data['parsed_query'].get('budget_min', 'N/A')}-${data['parsed_query'].get('budget_max', 'N/A')}")
                print(f"   Duration: {data['parsed_query'].get('num_nights', 'N/A')} nights")
                print(f"   Found {data['num_candidates']} candidates")
                print(f"   Returned {data['num_results']} results")
                print(f"   Processing time: {data['processing_time_ms']}ms")
                
                if data['results']:
                    print(f"\n   🏆 Top Result:")
                    top = data['results'][0]
                    print(f"      {top.get('title', 'Untitled')}")
                    print(f"      ${top.get('price_per_night', 0)}/night (${top.get('total_price', 0)} total)")
                    print(f"      Rating: {top.get('rating', 0)}/5.0 ({top.get('review_count', 0)} reviews)")
                    print(f"      Score: {top.get('ranking_score', 0):.3f}")
                    match_reasons = top.get('match_reasons', [])
                    if match_reasons:
                        print(f"      Match reasons: {', '.join(match_reasons[:3])}")
                    else:
                        print(f"      Match reasons: None")
                
            else:
                print(f"   ❌ Error: {response.status_code}")
                print(f"   {response.text}")
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
    
    print("\n" + "=" * 70)
    print("✅ Testing complete")
    print("=" * 70)

if __name__ == "__main__":
    test_matching()