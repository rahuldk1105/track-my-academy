#!/usr/bin/env python3
"""
Academy Settings and Profile API Testing for Track My Academy
Tests the academy settings endpoints including branding, operational, notifications, and privacy settings
"""

import requests
import json
import os
import io
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

print(f"Testing academy settings at: {API_BASE_URL}")
print(f"Supabase URL: {SUPABASE_URL}")

# Test credentials for academy user
ACADEMY_USER_EMAIL = "testacademy2@roletest.com"
ACADEMY_USER_PASSWORD = "TestPassword123!"

def authenticate_academy_user():
    """Authenticate academy user and return access token"""
    print("\n=== Authenticating Academy User ===")
    try:
        login_data = {
            "email": ACADEMY_USER_EMAIL,
            "password": ACADEMY_USER_PASSWORD
        }
        
        response = requests.post(f"{API_BASE_URL}/auth/login", json=login_data, timeout=10)
        print(f"Login Status Code: {response.status_code}")
        
        if response.status_code == 200:
            auth_data = response.json()
            access_token = auth_data.get("session", {}).get("access_token")
            if access_token:
                print("✅ Academy user authentication PASSED")
                return access_token
            else:
                print("❌ No access token in response")
                return None
        else:
            print(f"❌ Academy user authentication FAILED: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Authentication FAILED - Connection error: {e}")
        return None

def test_get_academy_settings(access_token):
    """Test GET /api/academy/settings endpoint"""
    print("\n=== Testing GET /api/academy/settings ===")
    try:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{API_BASE_URL}/academy/settings", headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            settings_data = response.json()
            print(f"Settings Response: {json.dumps(settings_data, indent=2)}")
            
            # Verify all required fields are present
            required_fields = [
                'id', 'academy_id', 'logo_url', 'description', 'website', 'social_media',
                'theme_color', 'season_start_date', 'season_end_date', 'training_days',
                'training_time', 'facility_address', 'facility_amenities',
                'email_notifications', 'sms_notifications', 'parent_notifications',
                'coach_notifications', 'public_profile', 'show_player_stats',
                'show_coach_info', 'data_sharing_consent', 'created_at', 'updated_at'
            ]
            
            missing_fields = []
            for field in required_fields:
                if field not in settings_data:
                    missing_fields.append(field)
            
            if not missing_fields:
                print("✅ GET academy settings PASSED - All required fields present")
                
                # Verify field types and structure
                branding_fields = ['logo_url', 'description', 'website', 'social_media', 'theme_color']
                operational_fields = ['season_start_date', 'season_end_date', 'training_days', 'training_time', 'facility_address', 'facility_amenities']
                notification_fields = ['email_notifications', 'sms_notifications', 'parent_notifications', 'coach_notifications']
                privacy_fields = ['public_profile', 'show_player_stats', 'show_coach_info', 'data_sharing_consent']
                
                print("✅ Branding settings fields present:", all(field in settings_data for field in branding_fields))
                print("✅ Operational settings fields present:", all(field in settings_data for field in operational_fields))
                print("✅ Notification settings fields present:", all(field in settings_data for field in notification_fields))
                print("✅ Privacy settings fields present:", all(field in settings_data for field in privacy_fields))
                
                return True, settings_data
            else:
                print(f"❌ GET academy settings FAILED - Missing fields: {missing_fields}")
                return False, None
        else:
            print(f"❌ GET academy settings FAILED: {response.text}")
            return False, None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ GET academy settings FAILED - Connection error: {e}")
        return False, None

def test_update_academy_settings(access_token):
    """Test PUT /api/academy/settings endpoint"""
    print("\n=== Testing PUT /api/academy/settings ===")
    try:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # Test data with all categories
        update_data = {
            # Branding settings
            "description": "Premier Football Academy - Training Champions Since 2020",
            "website": "https://testacademy2.com",
            "social_media": {
                "facebook": "https://facebook.com/testacademy2",
                "twitter": "https://twitter.com/testacademy2",
                "instagram": "https://instagram.com/testacademy2"
            },
            "theme_color": "#1e40af",
            
            # Operational settings
            "season_start_date": "2024-03-01",
            "season_end_date": "2024-11-30",
            "training_days": ["Monday", "Wednesday", "Friday"],
            "training_time": "6:00 PM - 8:00 PM",
            "facility_address": "123 Sports Complex, Test City, TC 12345",
            "facility_amenities": ["Full-size Football Field", "Gym", "Changing Rooms", "Medical Room"],
            
            # Notification settings
            "email_notifications": True,
            "sms_notifications": True,
            "parent_notifications": True,
            "coach_notifications": True,
            
            # Privacy settings
            "public_profile": True,
            "show_player_stats": True,
            "show_coach_info": True,
            "data_sharing_consent": False
        }
        
        response = requests.put(f"{API_BASE_URL}/academy/settings", headers=headers, json=update_data, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            updated_settings = response.json()
            print(f"Updated Settings Response: {json.dumps(updated_settings, indent=2)}")
            
            # Verify updates were applied
            verification_passed = True
            for key, expected_value in update_data.items():
                actual_value = updated_settings.get(key)
                if actual_value != expected_value:
                    print(f"❌ Field '{key}' not updated correctly. Expected: {expected_value}, Got: {actual_value}")
                    verification_passed = False
            
            if verification_passed:
                print("✅ PUT academy settings PASSED - All updates applied correctly")
                return True, updated_settings
            else:
                print("❌ PUT academy settings FAILED - Some updates not applied")
                return False, None
        else:
            print(f"❌ PUT academy settings FAILED: {response.text}")
            return False, None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ PUT academy settings FAILED - Connection error: {e}")
        return False, None

def test_partial_update_academy_settings(access_token):
    """Test partial update of academy settings"""
    print("\n=== Testing Partial Update of Academy Settings ===")
    try:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # Test partial update - only update a few fields
        partial_update_data = {
            "description": "Updated Academy Description - Excellence in Sports Training",
            "email_notifications": False,
            "theme_color": "#059669"  # emerald-600
        }
        
        response = requests.put(f"{API_BASE_URL}/academy/settings", headers=headers, json=partial_update_data, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            updated_settings = response.json()
            print(f"Partial Update Response: {json.dumps(updated_settings, indent=2)}")
            
            # Verify only specified fields were updated
            verification_passed = True
            for key, expected_value in partial_update_data.items():
                actual_value = updated_settings.get(key)
                if actual_value != expected_value:
                    print(f"❌ Field '{key}' not updated correctly. Expected: {expected_value}, Got: {actual_value}")
                    verification_passed = False
            
            # Verify other fields remained unchanged (check a few key ones)
            if updated_settings.get("website") != "https://testacademy2.com":
                print("❌ Website field was unexpectedly changed during partial update")
                verification_passed = False
            
            if verification_passed:
                print("✅ Partial update academy settings PASSED")
                return True
            else:
                print("❌ Partial update academy settings FAILED")
                return False
        else:
            print(f"❌ Partial update academy settings FAILED: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Partial update academy settings FAILED - Connection error: {e}")
        return False

def create_test_image():
    """Create a simple test image for logo upload"""
    # Create a minimal PNG image (1x1 pixel)
    png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x0cIDATx\x9cc```\x00\x00\x00\x04\x00\x01\xdd\x8d\xb4\x1c\x00\x00\x00\x00IEND\xaeB`\x82'
    return io.BytesIO(png_data)

def test_academy_logo_upload(access_token):
    """Test POST /api/academy/logo endpoint"""
    print("\n=== Testing POST /api/academy/logo ===")
    try:
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        # Create test image
        test_image = create_test_image()
        
        files = {
            'file': ('test_logo.png', test_image, 'image/png')
        }
        
        response = requests.post(f"{API_BASE_URL}/academy/logo", headers=headers, files=files, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            upload_response = response.json()
            print(f"Logo Upload Response: {json.dumps(upload_response, indent=2)}")
            
            # Verify response structure
            if 'logo_url' in upload_response and 'message' in upload_response:
                logo_url = upload_response['logo_url']
                print(f"✅ Logo uploaded successfully. URL: {logo_url}")
                
                # Test if logo URL is accessible
                logo_full_url = f"{BACKEND_URL}{logo_url}"
                logo_response = requests.get(logo_full_url, timeout=10)
                
                if logo_response.status_code == 200:
                    print(f"✅ Logo URL is accessible: {logo_full_url}")
                    return True, logo_url
                else:
                    print(f"❌ Logo URL not accessible: {logo_response.status_code}")
                    return False, None
            else:
                print("❌ Logo upload response missing required fields")
                return False, None
        else:
            print(f"❌ Logo upload FAILED: {response.text}")
            return False, None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Logo upload FAILED - Connection error: {e}")
        return False, None

def test_invalid_logo_upload(access_token):
    """Test logo upload with invalid file type"""
    print("\n=== Testing Invalid Logo Upload ===")
    try:
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        # Create test text file (invalid)
        test_file = io.BytesIO(b"This is not an image file")
        
        files = {
            'file': ('test_file.txt', test_file, 'text/plain')
        }
        
        response = requests.post(f"{API_BASE_URL}/academy/logo", headers=headers, files=files, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            error_response = response.json()
            print(f"Error Response: {json.dumps(error_response, indent=2)}")
            print("✅ Invalid file type properly rejected")
            return True
        else:
            print(f"❌ Invalid file type not properly rejected: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Invalid logo upload test FAILED - Connection error: {e}")
        return False

def test_settings_after_logo_upload(access_token, expected_logo_url):
    """Test that logo URL is properly updated in settings after upload"""
    print("\n=== Testing Settings After Logo Upload ===")
    try:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{API_BASE_URL}/academy/settings", headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            settings_data = response.json()
            actual_logo_url = settings_data.get('logo_url')
            
            if actual_logo_url == expected_logo_url:
                print(f"✅ Logo URL properly updated in settings: {actual_logo_url}")
                return True
            else:
                print(f"❌ Logo URL not updated in settings. Expected: {expected_logo_url}, Got: {actual_logo_url}")
                return False
        else:
            print(f"❌ Failed to get settings after logo upload: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Settings check after logo upload FAILED - Connection error: {e}")
        return False

def test_unauthorized_access():
    """Test academy settings endpoints without authentication"""
    print("\n=== Testing Unauthorized Access ===")
    try:
        # Test GET without token
        response = requests.get(f"{API_BASE_URL}/academy/settings", timeout=10)
        print(f"GET without auth - Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ GET endpoint properly protected")
            get_protected = True
        else:
            print("❌ GET endpoint not properly protected")
            get_protected = False
        
        # Test PUT without token
        update_data = {"description": "Unauthorized update attempt"}
        response = requests.put(f"{API_BASE_URL}/academy/settings", json=update_data, timeout=10)
        print(f"PUT without auth - Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ PUT endpoint properly protected")
            put_protected = True
        else:
            print("❌ PUT endpoint not properly protected")
            put_protected = False
        
        # Test POST without token
        test_image = create_test_image()
        files = {'file': ('test.png', test_image, 'image/png')}
        response = requests.post(f"{API_BASE_URL}/academy/logo", files=files, timeout=10)
        print(f"POST without auth - Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ POST endpoint properly protected")
            post_protected = True
        else:
            print("❌ POST endpoint not properly protected")
            post_protected = False
        
        return get_protected and put_protected and post_protected
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Unauthorized access test FAILED - Connection error: {e}")
        return False

def run_all_tests():
    """Run all academy settings tests"""
    print("🚀 STARTING ACADEMY SETTINGS AND PROFILE API TESTING")
    print("=" * 60)
    
    test_results = []
    
    # Authenticate academy user
    access_token = authenticate_academy_user()
    if not access_token:
        print("❌ Cannot proceed without authentication")
        return False
    
    # Test 1: GET academy settings
    success, initial_settings = test_get_academy_settings(access_token)
    test_results.append(("GET /api/academy/settings", success))
    
    # Test 2: PUT academy settings (full update)
    success, updated_settings = test_update_academy_settings(access_token)
    test_results.append(("PUT /api/academy/settings (full update)", success))
    
    # Test 3: PUT academy settings (partial update)
    success = test_partial_update_academy_settings(access_token)
    test_results.append(("PUT /api/academy/settings (partial update)", success))
    
    # Test 4: POST academy logo upload
    success, logo_url = test_academy_logo_upload(access_token)
    test_results.append(("POST /api/academy/logo", success))
    
    # Test 5: Invalid logo upload
    success = test_invalid_logo_upload(access_token)
    test_results.append(("POST /api/academy/logo (invalid file)", success))
    
    # Test 6: Verify logo URL in settings
    if logo_url:
        success = test_settings_after_logo_upload(access_token, logo_url)
        test_results.append(("Logo URL in settings", success))
    
    # Test 7: Unauthorized access
    success = test_unauthorized_access()
    test_results.append(("Unauthorized access protection", success))
    
    # Print summary
    print("\n" + "=" * 60)
    print("🏁 ACADEMY SETTINGS API TESTING SUMMARY")
    print("=" * 60)
    
    passed_tests = 0
    total_tests = len(test_results)
    
    for test_name, success in test_results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{test_name}: {status}")
        if success:
            passed_tests += 1
    
    print(f"\nOverall Result: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 ALL ACADEMY SETTINGS TESTS PASSED!")
        return True
    else:
        print("⚠️ Some academy settings tests failed")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)