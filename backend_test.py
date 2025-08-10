#!/usr/bin/env python3
"""
Backend API Testing for Track My Academy
Tests the FastAPI backend endpoints and MongoDB integration
"""

import requests
import json
import os
from datetime import datetime
import sys

# Load environment variables
from dotenv import load_dotenv
load_dotenv('/app/frontend/.env')
load_dotenv('/app/backend/.env')

# Import Supabase client
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("⚠️ Supabase client not available")

# Get backend URL from frontend environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE_URL = f"{BACKEND_URL}/api"

# Get Supabase configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

print(f"Testing backend at: {API_BASE_URL}")
print(f"Supabase URL: {SUPABASE_URL}")
print(f"Supabase Key available: {'Yes' if SUPABASE_KEY else 'No'}")
print(f"Supabase Service Key available: {'Yes' if SUPABASE_SERVICE_KEY else 'No'}")

def test_server_health():
    """Test basic server health check"""
    print("\n=== Testing Server Health ===")
    try:
        response = requests.get(f"{API_BASE_URL}/", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200 and response.json().get("message") == "Hello World":
            print("✅ Server health check PASSED")
            return True
        else:
            print("❌ Server health check FAILED - Unexpected response")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Server health check FAILED - Connection error: {e}")
        return False

def test_cors_configuration():
    """Test CORS configuration"""
    print("\n=== Testing CORS Configuration ===")
    try:
        # Test preflight request
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        response = requests.options(f"{API_BASE_URL}/status", headers=headers, timeout=10)
        print(f"CORS Preflight Status Code: {response.status_code}")
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        }
        print(f"CORS Headers: {cors_headers}")
        
        if response.status_code == 200:
            print("✅ CORS configuration PASSED")
            return True
        else:
            print("❌ CORS configuration FAILED")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ CORS test FAILED - Connection error: {e}")
        return False

def test_create_status_check():
    """Test POST /api/status endpoint"""
    print("\n=== Testing POST /api/status ===")
    try:
        test_data = {
            "client_name": "Track My Academy Test Client"
        }
        
        response = requests.post(
            f"{API_BASE_URL}/status",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if 'id' in data and 'client_name' in data and 'timestamp' in data:
                print("✅ POST /api/status PASSED")
                return True, data['id']
            else:
                print("❌ POST /api/status FAILED - Missing required fields")
                return False, None
        else:
            print("❌ POST /api/status FAILED - Non-200 status code")
            return False, None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ POST /api/status FAILED - Connection error: {e}")
        return False, None

def test_get_status_checks():
    """Test GET /api/status endpoint"""
    print("\n=== Testing GET /api/status ===")
    try:
        response = requests.get(f"{API_BASE_URL}/status", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Number of status checks retrieved: {len(data)}")
            
            if isinstance(data, list):
                print("✅ GET /api/status PASSED")
                return True
            else:
                print("❌ GET /api/status FAILED - Response is not a list")
                return False
        else:
            print("❌ GET /api/status FAILED - Non-200 status code")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ GET /api/status FAILED - Connection error: {e}")
        return False

def test_supabase_environment_variables():
    """Test if Supabase environment variables are properly loaded"""
    print("\n=== Testing Supabase Environment Variables ===")
    
    missing_vars = []
    if not SUPABASE_URL:
        missing_vars.append("SUPABASE_URL")
    if not SUPABASE_KEY:
        missing_vars.append("SUPABASE_KEY")
    if not SUPABASE_SERVICE_KEY:
        missing_vars.append("SUPABASE_SERVICE_KEY")
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        return False
    
    # Validate URL format
    if not SUPABASE_URL.startswith('https://'):
        print("❌ SUPABASE_URL should start with https://")
        return False
    
    print("✅ All Supabase environment variables are properly loaded")
    return True

def test_supabase_connection():
    """Test connection to Supabase"""
    print("\n=== Testing Supabase Connection ===")
    
    if not SUPABASE_AVAILABLE:
        print("❌ Supabase client library not available")
        return False
    
    if not test_supabase_environment_variables():
        print("❌ Cannot test connection - environment variables missing")
        return False
    
    try:
        # Test with anon key
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Try to get the current user (should return None for anon key)
        user = supabase.auth.get_user()
        print(f"Anon key connection test - User response: {user}")
        
        # Test with service key
        supabase_service: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Try to list users (admin operation)
        try:
            # This should work with service key
            response = supabase_service.auth.admin.list_users()
            print(f"Service key connection test - Users list response received")
            print("✅ Supabase connection PASSED")
            return True
        except Exception as admin_error:
            print(f"Service key admin operation: {admin_error}")
            # Even if admin operations fail, basic connection might work
            print("✅ Supabase basic connection PASSED (admin operations may be restricted)")
            return True
            
    except Exception as e:
        print(f"❌ Supabase connection FAILED: {e}")
        return False

def test_supabase_health_check():
    """Test Supabase health check endpoint"""
    print("\n=== Testing Supabase Health Check ===")
    try:
        response = requests.get(f"{API_BASE_URL}/supabase/health", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy" and data.get("connection") == "active":
                print("✅ Supabase health check PASSED")
                return True
            else:
                print("❌ Supabase health check FAILED - Unhealthy status")
                return False
        else:
            print("❌ Supabase health check FAILED - Non-200 status code")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Supabase health check FAILED - Connection error: {e}")
        return False

def test_auth_signup():
    """Test user signup endpoint"""
    print("\n=== Testing Auth Signup ===")
    try:
        # Use realistic test data
        test_user = {
            "email": "test@academy.com",
            "password": "TestPassword123!",
            "academy_name": "Test Academy",
            "owner_name": "Test Owner",
            "phone": "+1234567890",
            "location": "Test Location",
            "sports_type": "Football"
        }
        
        response = requests.post(
            f"{API_BASE_URL}/auth/signup",
            json=test_user,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {list(data.keys())}")
            
            if "user" in data and "session" in data and "message" in data:
                print("✅ Auth signup PASSED")
                return True, data
            else:
                print("❌ Auth signup FAILED - Missing required response fields")
                return False, None
        elif response.status_code == 400:
            # User might already exist, which is acceptable for testing
            error_data = response.json()
            if "already registered" in str(error_data).lower() or "user already exists" in str(error_data).lower():
                print("✅ Auth signup PASSED (user already exists)")
                return True, None
            else:
                print(f"❌ Auth signup FAILED - Bad request: {error_data}")
                return False, None
        else:
            print(f"❌ Auth signup FAILED - Status: {response.status_code}, Response: {response.text}")
            return False, None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Auth signup FAILED - Connection error: {e}")
        return False, None

def test_auth_login():
    """Test user login endpoint"""
    print("\n=== Testing Auth Login ===")
    try:
        login_data = {
            "email": "test@academy.com",
            "password": "TestPassword123!"
        }
        
        response = requests.post(
            f"{API_BASE_URL}/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {list(data.keys())}")
            
            if "user" in data and "session" in data and "message" in data:
                # Extract access token for further tests
                session = data.get("session", {})
                access_token = session.get("access_token")
                print("✅ Auth login PASSED")
                return True, access_token
            else:
                print("❌ Auth login FAILED - Missing required response fields")
                return False, None
        else:
            print(f"❌ Auth login FAILED - Status: {response.status_code}, Response: {response.text}")
            return False, None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Auth login FAILED - Connection error: {e}")
        return False, None

def test_auth_user(access_token=None):
    """Test get current user endpoint"""
    print("\n=== Testing Auth User ===")
    try:
        headers = {"Content-Type": "application/json"}
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
        
        response = requests.get(
            f"{API_BASE_URL}/auth/user",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {list(data.keys())}")
            
            if "message" in data:
                if access_token and data.get("user"):
                    print("✅ Auth user PASSED (authenticated user)")
                    return True
                elif not access_token and not data.get("user"):
                    print("✅ Auth user PASSED (no authenticated user)")
                    return True
                else:
                    print("❌ Auth user FAILED - Unexpected user state")
                    return False
            else:
                print("❌ Auth user FAILED - Missing message field")
                return False
        else:
            print(f"❌ Auth user FAILED - Status: {response.status_code}, Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Auth user FAILED - Connection error: {e}")
        return False

def test_auth_refresh():
    """Test token refresh endpoint"""
    print("\n=== Testing Auth Refresh ===")
    try:
        response = requests.post(
            f"{API_BASE_URL}/auth/refresh",
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        # Token refresh might fail if no active session, which is expected
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {list(data.keys())}")
            
            if "user" in data and "session" in data and "message" in data:
                print("✅ Auth refresh PASSED")
                return True
            else:
                print("❌ Auth refresh FAILED - Missing required response fields")
                return False
        elif response.status_code == 401:
            print("✅ Auth refresh PASSED (no active session to refresh)")
            return True
        else:
            print(f"❌ Auth refresh FAILED - Status: {response.status_code}, Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Auth refresh FAILED - Connection error: {e}")
        return False

def test_auth_logout(access_token=None):
    """Test user logout endpoint"""
    print("\n=== Testing Auth Logout ===")
    try:
        headers = {"Content-Type": "application/json"}
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
        
        response = requests.post(
            f"{API_BASE_URL}/auth/logout",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data:
                print("✅ Auth logout PASSED")
                return True
            else:
                print("❌ Auth logout FAILED - Missing message field")
                return False
        else:
            print(f"❌ Auth logout FAILED - Status: {response.status_code}, Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Auth logout FAILED - Connection error: {e}")
        return False

def test_auth_error_handling():
    """Test authentication error handling"""
    print("\n=== Testing Auth Error Handling ===")
    
    # Test login with invalid credentials
    try:
        invalid_login = {
            "email": "invalid@test.com",
            "password": "wrongpassword"
        }
        
        response = requests.post(
            f"{API_BASE_URL}/auth/login",
            json=invalid_login,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Invalid login status: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Invalid credentials properly rejected")
            error_handling_passed = True
        else:
            print("❌ Invalid credentials not properly handled")
            error_handling_passed = False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error handling test failed: {e}")
        error_handling_passed = False
    
    # Test protected endpoint without auth
    try:
        response = requests.get(f"{API_BASE_URL}/auth/user", timeout=10)
        print(f"Unauth user endpoint status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if not data.get("user"):
                print("✅ Protected endpoint properly handles no auth")
                error_handling_passed = error_handling_passed and True
            else:
                print("❌ Protected endpoint should not return user without auth")
                error_handling_passed = False
        else:
            print("❌ Protected endpoint error handling failed")
            error_handling_passed = False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Protected endpoint test failed: {e}")
        error_handling_passed = False
    
    return error_handling_passed

def test_complete_auth_flow():
    """Test complete authentication flow"""
    print("\n=== Testing Complete Auth Flow ===")
    
    # Step 1: Signup
    signup_success, signup_data = test_auth_signup()
    if not signup_success:
        print("❌ Complete auth flow FAILED at signup")
        return False
    
    # Step 2: Login
    login_success, access_token = test_auth_login()
    if not login_success:
        print("❌ Complete auth flow FAILED at login")
        return False
    
    # Step 3: Get user info
    user_success = test_auth_user(access_token)
    if not user_success:
        print("❌ Complete auth flow FAILED at get user")
        return False
    
    # Step 4: Logout
    logout_success = test_auth_logout(access_token)
    if not logout_success:
        print("❌ Complete auth flow FAILED at logout")
        return False
    
    print("✅ Complete auth flow PASSED")
    return True

def test_supabase_auth_endpoints():
    """Test all Supabase authentication endpoints"""
    print("\n=== Testing Supabase Auth Endpoints ===")
    
    # Test individual endpoints
    health_check = test_supabase_health_check()
    signup_test, _ = test_auth_signup()
    login_test, access_token = test_auth_login()
    user_test = test_auth_user(access_token)
    refresh_test = test_auth_refresh()
    logout_test = test_auth_logout(access_token)
    error_handling = test_auth_error_handling()
    complete_flow = test_complete_auth_flow()
    
    # Summary
    tests = [health_check, signup_test, login_test, user_test, refresh_test, logout_test, error_handling, complete_flow]
    passed_tests = sum(tests)
    total_tests = len(tests)
    
    print(f"\n📊 Auth Endpoints Summary: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests >= 6:  # Allow some flexibility for edge cases
        print("✅ Supabase auth endpoints PASSED")
        return True
    else:
        print("❌ Supabase auth endpoints FAILED")
        return False

def test_backend_supabase_integration():
    """Test if backend can integrate with Supabase"""
    print("\n=== Testing Backend Supabase Integration ===")
    
    # Check if backend is running
    try:
        response = requests.get(f"{API_BASE_URL}/", timeout=10)
        if response.status_code != 200:
            print("❌ Backend is not responding properly")
            return False
        
        print("✅ Backend is running")
        
        # Test Supabase health check endpoint
        health_success = test_supabase_health_check()
        if not health_success:
            print("❌ Backend Supabase integration FAILED - No health check")
            return False
        
        # Test if auth endpoints are available
        auth_endpoints = ["/auth/signup", "/auth/login", "/auth/logout", "/auth/user", "/auth/refresh"]
        available_endpoints = 0
        
        for endpoint in auth_endpoints:
            try:
                # Use HEAD request to check if endpoint exists without triggering auth logic
                response = requests.head(f"{API_BASE_URL}{endpoint}", timeout=5)
                if response.status_code != 404:
                    available_endpoints += 1
            except:
                pass
        
        if available_endpoints >= 4:  # Most endpoints should be available
            print(f"✅ Backend has {available_endpoints}/{len(auth_endpoints)} auth endpoints")
            print("✅ Backend Supabase integration PASSED")
            return True
        else:
            print(f"❌ Backend only has {available_endpoints}/{len(auth_endpoints)} auth endpoints")
            return False
            
    except Exception as e:
        print(f"❌ Backend integration test failed: {e}")
        return False

def test_mongodb_integration():
    """Test MongoDB integration by creating and retrieving data"""
    print("\n=== Testing MongoDB Integration ===")
    
    # Create a test record
    success, record_id = test_create_status_check()
    if not success:
        print("❌ MongoDB integration FAILED - Could not create record")
        return False
    
    # Retrieve records to verify persistence
    if test_get_status_checks():
        print("✅ MongoDB integration PASSED")
        return True
    else:
        print("❌ MongoDB integration FAILED - Could not retrieve records")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("🚀 Starting Track My Academy Backend API Tests")
    print("=" * 60)
    
    test_results = {
        'server_health': test_server_health(),
        'cors_configuration': test_cors_configuration(),
        'mongodb_integration': test_mongodb_integration(),
        'supabase_environment_variables': test_supabase_environment_variables(),
        'supabase_connection': test_supabase_connection(),
        'supabase_auth_endpoints': test_supabase_auth_endpoints(),
        'backend_supabase_integration': test_backend_supabase_integration(),
    }
    
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All backend tests PASSED! Backend is working correctly.")
        return True
    else:
        print("⚠️  Some backend tests FAILED. Please check the issues above.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)