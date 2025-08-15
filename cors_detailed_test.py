#!/usr/bin/env python3
"""
Detailed CORS Analysis Script
Analyzes the specific CORS behavior for regex pattern matching
"""

import requests
import json

BACKEND_URL = "https://sleek-admin-dash-1.preview.emergentagent.com"
TEST_ENDPOINT = "/api/auth/user"
FULL_URL = f"{BACKEND_URL}{TEST_ENDPOINT}"

def test_cors_detailed():
    """Test CORS with various origins to understand the regex behavior"""
    
    test_origins = [
        ("https://track-my-academy.vercel.app", "Explicit allowed origin"),
        ("https://some-other.vercel.app", "Should match regex *.vercel.app"),
        ("https://test-app.vercel.app", "Should match regex *.vercel.app"),
        ("https://my-app.vercel.app", "Should match regex *.vercel.app"),
        ("https://vercel.app", "Edge case - just vercel.app"),
        ("https://malicious-site.com", "Should be blocked"),
        ("https://fake-vercel.app.malicious.com", "Should be blocked"),
    ]
    
    print("🔍 DETAILED CORS ORIGIN TESTING")
    print("=" * 80)
    
    for origin, description in test_origins:
        print(f"\n🧪 Testing: {origin}")
        print(f"   Description: {description}")
        print("-" * 60)
        
        # Test preflight OPTIONS
        headers = {
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization"
        }
        
        try:
            response = requests.options(FULL_URL, headers=headers, timeout=10)
            cors_origin = response.headers.get('Access-Control-Allow-Origin')
            
            print(f"   Preflight Status: {response.status_code}")
            print(f"   CORS Origin Header: {cors_origin}")
            
            if cors_origin == origin:
                print("   ✅ Origin ALLOWED by CORS")
            elif cors_origin is None:
                print("   ❌ Origin BLOCKED by CORS")
            else:
                print(f"   ⚠️  Unexpected CORS origin: {cors_origin}")
            
            # Test actual GET request
            get_headers = {"Origin": origin, "Authorization": "Bearer dummy_token"}
            get_response = requests.get(FULL_URL, headers=get_headers, timeout=10)
            get_cors_origin = get_response.headers.get('Access-Control-Allow-Origin')
            
            print(f"   GET Status: {get_response.status_code}")
            print(f"   GET CORS Origin: {get_cors_origin}")
            
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Request failed: {e}")

def test_cors_regex_specifically():
    """Test the specific regex pattern from the backend configuration"""
    print("\n🔍 REGEX PATTERN ANALYSIS")
    print("=" * 80)
    print("Backend regex pattern: r\"https://.*\\.vercel\\.app\"")
    print("This should match any subdomain of vercel.app")
    
    regex_test_cases = [
        "https://a.vercel.app",
        "https://test.vercel.app", 
        "https://my-awesome-app.vercel.app",
        "https://123.vercel.app",
        "https://app-with-dashes.vercel.app",
        "https://app_with_underscores.vercel.app",
    ]
    
    for origin in regex_test_cases:
        print(f"\n🧪 Testing regex case: {origin}")
        
        headers = {
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization"
        }
        
        try:
            response = requests.options(FULL_URL, headers=headers, timeout=10)
            cors_origin = response.headers.get('Access-Control-Allow-Origin')
            
            print(f"   Status: {response.status_code}")
            print(f"   CORS Origin: {cors_origin}")
            
            if cors_origin == origin:
                print("   ✅ Regex pattern MATCHED")
            else:
                print("   ❌ Regex pattern FAILED")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Request failed: {e}")

if __name__ == "__main__":
    test_cors_detailed()
    test_cors_regex_specifically()