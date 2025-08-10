#!/usr/bin/env python3
"""
Direct Supabase Authentication Testing
Tests authentication by creating users directly via admin client
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

def create_test_user_directly():
    """Create a test user directly using Supabase admin client"""
    print("\n=== Creating Test User Directly ===")
    
    if not SUPABASE_AVAILABLE:
        print("❌ Supabase client not available")
        return False
    
    try:
        # Create admin client
        supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Test user data
        test_email = "testuser@academy.com"
        test_password = "TestPassword123!"
        
        # Try to create user directly via admin
        try:
            response = supabase_admin.auth.admin.create_user({
                "email": test_email,
                "password": test_password,
                "email_confirm": True,  # Skip email confirmation
                "user_metadata": {
                    "academy_name": "Test Academy",
                    "owner_name": "Test Owner",
                    "phone": "+1234567890",
                    "location": "Test Location",
                    "sports_type": "Football"
                }
            })
            
            if response.user:
                print(f"✅ Test user created successfully: {test_email}")
                return True, test_email, test_password
            else:
                print("❌ Failed to create test user")
                return False, None, None
                
        except Exception as create_error:
            # User might already exist
            if "already registered" in str(create_error).lower() or "user already exists" in str(create_error).lower():
                print(f"✅ Test user already exists: {test_email}")
                return True, test_email, test_password
            else:
                print(f"❌ Error creating user: {create_error}")
                return False, None, None
                
    except Exception as e:
        print(f"❌ Admin client error: {e}")
        return False, None, None

def test_login_with_created_user(email, password):
    """Test login with the created user"""
    print("\n=== Testing Login with Created User ===")
    
    try:
        login_data = {
            "email": email,
            "password": password
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
                session = data.get("session", {})
                access_token = session.get("access_token")
                print("✅ Login with created user PASSED")
                return True, access_token
            else:
                print("❌ Login FAILED - Missing required response fields")
                return False, None
        else:
            print(f"❌ Login FAILED - Status: {response.status_code}, Response: {response.text}")
            return False, None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Login FAILED - Connection error: {e}")
        return False, None

def test_get_user_with_token(access_token):
    """Test get user endpoint with valid token"""
    print("\n=== Testing Get User with Token ===")
    
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        response = requests.get(
            f"{API_BASE_URL}/auth/user",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {list(data.keys())}")
            
            if "user" in data and data.get("user"):
                print("✅ Get user with token PASSED")
                return True
            else:
                print("❌ Get user FAILED - No user data returned")
                return False
        else:
            print(f"❌ Get user FAILED - Status: {response.status_code}, Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Get user FAILED - Connection error: {e}")
        return False

def test_complete_auth_flow_with_admin():
    """Test complete authentication flow using admin-created user"""
    print("\n=== Testing Complete Auth Flow with Admin User ===")
    
    # Step 1: Create user via admin
    user_created, email, password = create_test_user_directly()
    if not user_created:
        print("❌ Complete auth flow FAILED - Could not create user")
        return False
    
    # Step 2: Test login
    login_success, access_token = test_login_with_created_user(email, password)
    if not login_success:
        print("❌ Complete auth flow FAILED - Login failed")
        return False
    
    # Step 3: Test get user with token
    user_success = test_get_user_with_token(access_token)
    if not user_success:
        print("❌ Complete auth flow FAILED - Get user failed")
        return False
    
    # Step 4: Test logout
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        response = requests.post(
            f"{API_BASE_URL}/auth/logout",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Logout PASSED")
        else:
            print(f"❌ Logout FAILED - Status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Logout FAILED - Error: {e}")
        return False
    
    print("✅ Complete auth flow with admin user PASSED")
    return True

def run_direct_auth_tests():
    """Run direct authentication tests"""
    print("🚀 Starting Direct Supabase Authentication Tests")
    print("=" * 60)
    
    # Test Supabase health check first
    try:
        response = requests.get(f"{API_BASE_URL}/supabase/health", timeout=10)
        if response.status_code == 200:
            print("✅ Supabase health check PASSED")
            health_ok = True
        else:
            print("❌ Supabase health check FAILED")
            health_ok = False
    except:
        print("❌ Supabase health check FAILED")
        health_ok = False
    
    if not health_ok:
        print("❌ Cannot proceed with auth tests - health check failed")
        return False
    
    # Run complete auth flow test
    auth_flow_success = test_complete_auth_flow_with_admin()
    
    print("\n" + "=" * 60)
    print("📊 DIRECT AUTH TEST SUMMARY")
    print("=" * 60)
    
    if auth_flow_success:
        print("✅ Supabase authentication endpoints are working correctly!")
        print("✅ Backend can create sessions, validate tokens, and handle logout")
        print("✅ All authentication functionality is operational")
        return True
    else:
        print("❌ Authentication flow has issues")
        return False

if __name__ == "__main__":
    success = run_direct_auth_tests()
    sys.exit(0 if success else 1)