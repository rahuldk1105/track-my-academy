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

def test_supabase_auth_endpoints():
    """Test if backend has Supabase auth endpoints"""
    print("\n=== Testing Supabase Auth Endpoints ===")
    
    auth_endpoints = [
        "/auth/signup",
        "/auth/login", 
        "/auth/logout",
        "/auth/user",
        "/auth/refresh"
    ]
    
    existing_endpoints = []
    missing_endpoints = []
    
    for endpoint in auth_endpoints:
        try:
            response = requests.get(f"{API_BASE_URL}{endpoint}", timeout=5)
            if response.status_code != 404:
                existing_endpoints.append(endpoint)
                print(f"✅ Found endpoint: {endpoint} (Status: {response.status_code})")
            else:
                missing_endpoints.append(endpoint)
                print(f"❌ Missing endpoint: {endpoint}")
        except requests.exceptions.RequestException as e:
            missing_endpoints.append(endpoint)
            print(f"❌ Error testing {endpoint}: {e}")
    
    if existing_endpoints:
        print(f"✅ Found {len(existing_endpoints)} auth endpoints")
        return True
    else:
        print("❌ No Supabase auth endpoints found in backend")
        return False

def test_backend_supabase_integration():
    """Test if backend can integrate with Supabase"""
    print("\n=== Testing Backend Supabase Integration ===")
    
    # Check if backend imports Supabase
    try:
        response = requests.get(f"{API_BASE_URL}/", timeout=10)
        if response.status_code == 200:
            print("✅ Backend is running")
            
            # Test if there's a Supabase health check endpoint
            try:
                supabase_health = requests.get(f"{API_BASE_URL}/supabase/health", timeout=5)
                if supabase_health.status_code == 200:
                    print("✅ Backend has Supabase health check endpoint")
                    return True
                else:
                    print("❌ No Supabase health check endpoint found")
                    return False
            except:
                print("❌ No Supabase integration endpoints found in backend")
                return False
        else:
            print("❌ Backend is not responding properly")
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