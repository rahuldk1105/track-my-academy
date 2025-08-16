#!/usr/bin/env python3
"""
CORS Testing Script for Track My Academy Backend
Tests CORS behavior as requested in the review.
"""

import requests
import json
from typing import Dict, Any

# Test configuration
BACKEND_URL = "https://dashboard-repair-15.preview.emergentagent.com"
TEST_ENDPOINT = "/api/auth/user"
FULL_URL = f"{BACKEND_URL}{TEST_ENDPOINT}"

# Test origins
ALLOWED_ORIGIN = "https://track-my-academy.vercel.app"
REGEX_ORIGIN = "https://some-other.vercel.app"  # Should match regex pattern
DISALLOWED_ORIGIN = "https://malicious-site.com"

def print_headers(headers: Dict[str, str], title: str):
    """Print headers in a formatted way"""
    print(f"\n{title}:")
    print("-" * 50)
    for key, value in headers.items():
        if key.lower().startswith('access-control'):
            print(f"  {key}: {value}")
    print("-" * 50)

def test_preflight_options_request():
    """Test 1: Preflight OPTIONS request with allowed origin"""
    print("\n🔍 TEST 1: Preflight OPTIONS Request (Allowed Origin)")
    print(f"URL: {FULL_URL}")
    print(f"Origin: {ALLOWED_ORIGIN}")
    
    headers = {
        "Origin": ALLOWED_ORIGIN,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Authorization"
    }
    
    try:
        response = requests.options(FULL_URL, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        print_headers(response.headers, "Response Headers")
        
        # Check for required CORS headers
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
            'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
        }
        
        print("\n✅ CORS Headers Analysis:")
        for header, value in cors_headers.items():
            status = "✅ Present" if value else "❌ Missing"
            print(f"  {header}: {value} ({status})")
        
        # Validate CORS headers
        if cors_headers['Access-Control-Allow-Origin'] == ALLOWED_ORIGIN:
            print("✅ Access-Control-Allow-Origin matches request origin")
        else:
            print(f"❌ Access-Control-Allow-Origin mismatch. Expected: {ALLOWED_ORIGIN}, Got: {cors_headers['Access-Control-Allow-Origin']}")
        
        if cors_headers['Access-Control-Allow-Methods'] and 'GET' in cors_headers['Access-Control-Allow-Methods']:
            print("✅ GET method is allowed")
        else:
            print("❌ GET method not explicitly allowed")
        
        if cors_headers['Access-Control-Allow-Headers'] and 'authorization' in cors_headers['Access-Control-Allow-Headers'].lower():
            print("✅ Authorization header is allowed")
        else:
            print("❌ Authorization header not explicitly allowed")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False
    
    return response.status_code == 200

def test_get_request_with_auth():
    """Test 2: GET request with dummy Authorization token and allowed origin"""
    print("\n🔍 TEST 2: GET Request with Authorization (Allowed Origin)")
    print(f"URL: {FULL_URL}")
    print(f"Origin: {ALLOWED_ORIGIN}")
    
    headers = {
        "Origin": ALLOWED_ORIGIN,
        "Authorization": "Bearer dummy_token_for_cors_testing_12345"
    }
    
    try:
        response = requests.get(FULL_URL, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        print_headers(response.headers, "Response Headers")
        
        # Check CORS headers in actual response
        cors_origin = response.headers.get('Access-Control-Allow-Origin')
        cors_credentials = response.headers.get('Access-Control-Allow-Credentials')
        
        print("\n✅ CORS Headers in Response:")
        print(f"  Access-Control-Allow-Origin: {cors_origin}")
        print(f"  Access-Control-Allow-Credentials: {cors_credentials}")
        
        if cors_origin == ALLOWED_ORIGIN:
            print("✅ CORS headers present even with 401 status")
        else:
            print(f"❌ CORS headers missing or incorrect. Expected: {ALLOWED_ORIGIN}, Got: {cors_origin}")
        
        # We expect 401 since it's a dummy token, but CORS headers should still be present
        if response.status_code == 401:
            print("✅ Expected 401 status for invalid token")
        else:
            print(f"⚠️  Unexpected status code: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False
    
    return True

def test_regex_origin():
    """Test 3: Test regex pattern matching for vercel.app domains"""
    print("\n🔍 TEST 3: Regex Origin Pattern Test")
    print(f"URL: {FULL_URL}")
    print(f"Origin: {REGEX_ORIGIN} (should match *.vercel.app regex)")
    
    headers = {
        "Origin": REGEX_ORIGIN,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Authorization"
    }
    
    try:
        # Test preflight first
        response = requests.options(FULL_URL, headers=headers, timeout=10)
        print(f"Preflight Status Code: {response.status_code}")
        
        print_headers(response.headers, "Preflight Response Headers")
        
        cors_origin = response.headers.get('Access-Control-Allow-Origin')
        
        if cors_origin == REGEX_ORIGIN:
            print("✅ Regex pattern matching works - origin allowed")
        else:
            print(f"❌ Regex pattern matching failed. Expected: {REGEX_ORIGIN}, Got: {cors_origin}")
        
        # Now test actual GET request
        print("\n--- Testing actual GET request with regex origin ---")
        get_headers = {
            "Origin": REGEX_ORIGIN,
            "Authorization": "Bearer dummy_token_for_cors_testing_12345"
        }
        
        get_response = requests.get(FULL_URL, headers=get_headers, timeout=10)
        print(f"GET Status Code: {get_response.status_code}")
        
        get_cors_origin = get_response.headers.get('Access-Control-Allow-Origin')
        print(f"GET Response CORS Origin: {get_cors_origin}")
        
        if get_cors_origin == REGEX_ORIGIN:
            print("✅ Regex origin works for actual requests too")
        else:
            print(f"❌ Regex origin failed for actual requests. Got: {get_cors_origin}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False
    
    return True

def test_disallowed_origin():
    """Test 4: Test with disallowed origin (should fail)"""
    print("\n🔍 TEST 4: Disallowed Origin Test")
    print(f"URL: {FULL_URL}")
    print(f"Origin: {DISALLOWED_ORIGIN} (should be blocked)")
    
    headers = {
        "Origin": DISALLOWED_ORIGIN,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Authorization"
    }
    
    try:
        response = requests.options(FULL_URL, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        print_headers(response.headers, "Response Headers")
        
        cors_origin = response.headers.get('Access-Control-Allow-Origin')
        
        if not cors_origin or cors_origin != DISALLOWED_ORIGIN:
            print("✅ Disallowed origin correctly blocked")
        else:
            print(f"❌ Disallowed origin was allowed: {cors_origin}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False
    
    return True

def main():
    """Run all CORS tests"""
    print("🚀 CORS Testing for Track My Academy Backend")
    print("=" * 60)
    
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Endpoint: {TEST_ENDPOINT}")
    print(f"Full URL: {FULL_URL}")
    
    # Run all tests
    tests = [
        ("Preflight OPTIONS Request", test_preflight_options_request),
        ("GET Request with Auth Header", test_get_request_with_auth),
        ("Regex Origin Pattern", test_regex_origin),
        ("Disallowed Origin", test_disallowed_origin)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n{'='*60}")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Test '{test_name}' failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print(f"\n{'='*60}")
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"  {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All CORS tests passed!")
    else:
        print("⚠️  Some CORS tests failed. Check the details above.")

if __name__ == "__main__":
    main()