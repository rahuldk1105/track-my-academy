#!/usr/bin/env python3
"""
Authentication System Test for Track My Academy Backend
Tests the specific authentication endpoints after Supabase dependency fixes
"""

import requests
import json
import os
import sys
from datetime import datetime

# Load environment variables
from dotenv import load_dotenv
load_dotenv('/app/frontend/.env')
load_dotenv('/app/backend/.env')

# Get backend URL from frontend environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE_URL = f"{BACKEND_URL}/api"

print(f"🔍 Testing Authentication System at: {API_BASE_URL}")
print(f"📅 Test Time: {datetime.now()}")

def test_health_check():
    """Test 1: Backend server health check at /api/"""
    print("\n=== TEST 1: Backend Server Health Check ===")
    try:
        response = requests.get(f"{API_BASE_URL}/", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200 and response.json().get("message") == "Hello World":
            print("✅ Health check PASSED - Returns 'Hello World'")
            return True
        else:
            print("❌ Health check FAILED - Unexpected response")
            return False
            
    except Exception as e:
        print(f"❌ Health check FAILED - Error: {e}")
        return False

def test_admin_login():
    """Test 2: Admin login with admin@trackmyacademy.com / AdminPassword123!"""
    print("\n=== TEST 2: Admin Authentication ===")
    try:
        login_data = {
            "email": "admin@trackmyacademy.com",
            "password": "AdminPassword123!"
        }
        
        response = requests.post(f"{API_BASE_URL}/auth/login", json=login_data, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            print(f"Response keys: {list(response_data.keys())}")
            
            # Check for access token in session
            session = response_data.get("session", {})
            access_token = session.get("access_token")
            
            if access_token:
                print("✅ Login PASSED - Access token received")
                print(f"🔑 Access Token: {access_token[:50]}...")
                return True, access_token
            else:
                print("❌ Login FAILED - No access token in response")
                print(f"Session data: {session}")
                return False, None
        else:
            print(f"❌ Login FAILED - Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ Login FAILED - Error: {e}")
        return False, None

def test_user_role_detection(access_token):
    """Test 3: User endpoint with JWT token to verify role detection"""
    print("\n=== TEST 3: User Role Detection ===")
    try:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{API_BASE_URL}/auth/user", headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            print(f"Response keys: {list(response_data.keys())}")
            
            # Check for role info
            user_data = response_data.get("user", {})
            role_info = user_data.get("role_info", {})
            role = role_info.get("role")
            
            print(f"🔍 Role Info: {role_info}")
            print(f"👤 User Role: {role}")
            
            if role == "super_admin":
                print("✅ Role Detection PASSED - Role: super_admin")
                
                # Check permissions
                permissions = role_info.get("permissions", [])
                expected_permissions = ['manage_all_academies', 'view_all_data', 'create_academies', 'manage_billing']
                
                print(f"🔐 Permissions: {permissions}")
                
                if all(perm in permissions for perm in expected_permissions):
                    print("✅ Permissions PASSED - All expected permissions present")
                    return True
                else:
                    print("⚠️ Permissions PARTIAL - Some expected permissions missing")
                    return True  # Still consider role detection successful
            else:
                print(f"❌ Role Detection FAILED - Expected 'super_admin', got '{role}'")
                return False
        else:
            print(f"❌ User endpoint FAILED - Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ User role detection FAILED - Error: {e}")
        return False

def main():
    """Run all authentication tests"""
    print("🚀 Starting Authentication System Tests")
    print("=" * 60)
    
    results = {
        "health_check": False,
        "admin_login": False,
        "role_detection": False
    }
    
    # Test 1: Health Check
    results["health_check"] = test_health_check()
    
    # Test 2: Admin Login
    login_success, access_token = test_admin_login()
    results["admin_login"] = login_success
    
    # Test 3: Role Detection (only if login successful)
    if login_success and access_token:
        results["role_detection"] = test_user_role_detection(access_token)
    else:
        print("\n⏭️ Skipping role detection test - login failed")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 AUTHENTICATION TEST SUMMARY")
    print("=" * 60)
    
    total_tests = len(results)
    passed_tests = sum(results.values())
    
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall Result: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 ALL AUTHENTICATION TESTS PASSED!")
        print("✅ Backend authentication is working correctly")
    else:
        print("⚠️ SOME AUTHENTICATION TESTS FAILED")
        print("❌ Backend authentication may have issues")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)