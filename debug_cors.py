#!/usr/bin/env python3
"""
Debug CORS configuration by testing a simple endpoint
"""

import requests

BACKEND_URL = "https://login-route-fix.preview.emergentagent.com"
SIMPLE_ENDPOINT = "/api/"  # Simple endpoint that should work
FULL_URL = f"{BACKEND_URL}{SIMPLE_ENDPOINT}"

def test_simple_cors():
    """Test CORS on the simple root endpoint"""
    
    test_origins = [
        "https://track-my-academy.vercel.app",
        "https://some-other.vercel.app",
        "https://test.vercel.app",
    ]
    
    print("🔍 TESTING CORS ON SIMPLE ENDPOINT")
    print("=" * 60)
    print(f"URL: {FULL_URL}")
    
    for origin in test_origins:
        print(f"\n🧪 Testing origin: {origin}")
        print("-" * 40)
        
        # Test preflight OPTIONS
        headers = {
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
        }
        
        try:
            response = requests.options(FULL_URL, headers=headers, timeout=10)
            cors_origin = response.headers.get('Access-Control-Allow-Origin')
            
            print(f"   Preflight Status: {response.status_code}")
            print(f"   CORS Origin: {cors_origin}")
            
            if cors_origin == origin:
                print("   ✅ ALLOWED")
            else:
                print("   ❌ BLOCKED")
            
            # Test actual GET request
            get_headers = {"Origin": origin}
            get_response = requests.get(FULL_URL, headers=get_headers, timeout=10)
            get_cors_origin = get_response.headers.get('Access-Control-Allow-Origin')
            
            print(f"   GET Status: {get_response.status_code}")
            print(f"   GET CORS Origin: {get_cors_origin}")
            
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Request failed: {e}")

if __name__ == "__main__":
    test_simple_cors()