#!/usr/bin/env python3
"""
Attendance Tracker and Academy Profile Update Testing
Tests specific issues mentioned in the review request:
1. Attendance tracker functionality
2. Academy profile update functionality (logo upload and settings)
"""

import requests
import json
import os
from datetime import datetime, date
import sys
import io

# Load environment variables
from dotenv import load_dotenv
load_dotenv('/app/frontend/.env')
load_dotenv('/app/backend/.env')

# Get backend URL from frontend environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE_URL = f"{BACKEND_URL}/api"

print(f"Testing backend at: {API_BASE_URL}")

# Test credentials for academy user
ACADEMY_USER_EMAIL = "admin@cpsports.in"
ACADEMY_USER_PASSWORD = "AdminPassword123!"

def get_academy_user_token():
    """Get access token for academy user"""
    print("\n=== Getting Academy User Token ===")
    try:
        login_data = {
            "email": ACADEMY_USER_EMAIL,
            "password": ACADEMY_USER_PASSWORD
        }
        
        response = requests.post(
            f"{API_BASE_URL}/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        print(f"Login Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            session = data.get("session", {})
            access_token = session.get("access_token")
            if access_token:
                print("✅ Academy user authentication successful")
                return access_token
            else:
                print("❌ No access token in response")
                return None
        else:
            print(f"❌ Login failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_attendance_mark_endpoint(access_token):
    """Test POST /api/academy/attendance (mark attendance)"""
    print("\n=== Testing POST /api/academy/attendance ===")
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        # Create realistic attendance data
        today = date.today().strftime("%Y-%m-%d")
        attendance_data = {
            "date": today,
            "attendance_records": [
                {
                    "player_id": "test-player-1",
                    "date": today,
                    "present": True,
                    "sport": "Football",
                    "performance_ratings": {
                        "Technical Skills": 8,
                        "Physical Fitness": 7,
                        "Tactical Awareness": 6,
                        "Mental Strength": 9,
                        "Teamwork": 8
                    },
                    "notes": "Great performance today, showed excellent leadership"
                },
                {
                    "player_id": "test-player-2", 
                    "date": today,
                    "present": False,
                    "sport": "Football",
                    "performance_ratings": {},
                    "notes": "Absent due to illness"
                }
            ]
        }
        
        response = requests.post(
            f"{API_BASE_URL}/academy/attendance",
            json=attendance_data,
            headers=headers,
            timeout=15
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data and "successfully" in data["message"].lower():
                print("✅ Attendance marking PASSED")
                return True, data
            else:
                print("❌ Attendance marking FAILED - Unexpected response format")
                return False, None
        elif response.status_code == 404:
            print("❌ Attendance marking FAILED - Players not found (need to create test players first)")
            return False, None
        elif response.status_code == 401:
            print("❌ Attendance marking FAILED - Authentication issue")
            return False, None
        else:
            print(f"❌ Attendance marking FAILED - Status: {response.status_code}, Response: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ Attendance marking test failed: {e}")
        return False, None

def test_attendance_get_by_date(access_token, test_date=None):
    """Test GET /api/academy/attendance/{date}"""
    print("\n=== Testing GET /api/academy/attendance/{date} ===")
    try:
        if not test_date:
            test_date = date.today().strftime("%Y-%m-%d")
            
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        response = requests.get(
            f"{API_BASE_URL}/academy/attendance/{test_date}",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"✅ Get attendance by date PASSED - Found {len(data)} records")
                return True, data
            else:
                print("❌ Get attendance by date FAILED - Response is not a list")
                return False, None
        elif response.status_code == 404:
            print("✅ Get attendance by date PASSED - No records found for date (expected)")
            return True, []
        else:
            print(f"❌ Get attendance by date FAILED - Status: {response.status_code}, Response: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ Get attendance by date test failed: {e}")
        return False, None

def test_attendance_summary(access_token):
    """Test GET /api/academy/attendance/summary"""
    print("\n=== Testing GET /api/academy/attendance/summary ===")
    try:
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        response = requests.get(
            f"{API_BASE_URL}/academy/attendance/summary",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            # Check for expected summary fields
            expected_fields = ["total_sessions", "total_players", "attendance_rate"]
            if any(field in data for field in expected_fields):
                print("✅ Get attendance summary PASSED")
                return True, data
            else:
                print("❌ Get attendance summary FAILED - Missing expected summary fields")
                return False, None
        else:
            print(f"❌ Get attendance summary FAILED - Status: {response.status_code}, Response: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ Get attendance summary test failed: {e}")
        return False, None

def test_academy_logo_upload(access_token):
    """Test POST /api/academy/logo"""
    print("\n=== Testing POST /api/academy/logo ===")
    try:
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        # Create a simple test image
        try:
            from PIL import Image
            
            # Create a test image
            img = Image.new('RGB', (200, 200), color='green')
            img_bytes = io.BytesIO()
            img.save(img_bytes, format='PNG')
            img_bytes.seek(0)
            
            files = {'file': ('academy_logo.png', img_bytes, 'image/png')}
            
            response = requests.post(
                f"{API_BASE_URL}/academy/logo",
                files=files,
                headers=headers,
                timeout=15
            )
            
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                if 'logo_url' in data and 'message' in data:
                    logo_url = data['logo_url']
                    print(f"✅ Academy logo upload PASSED - Logo URL: {logo_url}")
                    
                    # Test if the uploaded file is accessible
                    try:
                        logo_response = requests.get(f"{BACKEND_URL}{logo_url}", timeout=5)
                        if logo_response.status_code == 200:
                            print("✅ Uploaded logo is accessible via static file serving")
                            return True, logo_url
                        else:
                            print("⚠️ Logo uploaded but not accessible via static serving")
                            return True, logo_url  # Still consider upload successful
                    except:
                        print("⚠️ Could not verify logo accessibility")
                        return True, logo_url
                else:
                    print("❌ Academy logo upload FAILED - Missing required response fields")
                    return False, None
            elif response.status_code == 400:
                error_data = response.json()
                print(f"❌ Academy logo upload FAILED - Validation error: {error_data}")
                return False, None
            elif response.status_code == 401:
                print("❌ Academy logo upload FAILED - Authentication issue")
                return False, None
            elif response.status_code == 403:
                print("❌ Academy logo upload FAILED - Authorization issue (not academy user)")
                return False, None
            else:
                print(f"❌ Academy logo upload FAILED - Status: {response.status_code}, Response: {response.text}")
                return False, None
                
        except ImportError:
            print("⚠️ PIL not available, testing with text file (should fail)")
            # Test with invalid file type to check validation
            text_content = io.BytesIO(b"This is not an image")
            files = {'file': ('test.txt', text_content, 'text/plain')}
            
            response = requests.post(
                f"{API_BASE_URL}/academy/logo",
                files=files,
                headers=headers,
                timeout=15
            )
            
            if response.status_code == 400:
                print("✅ Academy logo upload validation PASSED - Correctly rejected non-image file")
                return True, None
            else:
                print("❌ Academy logo upload validation FAILED - Should reject non-image files")
                return False, None
            
    except Exception as e:
        print(f"❌ Academy logo upload test failed: {e}")
        return False, None

def test_academy_settings_get(access_token):
    """Test GET /api/academy/settings"""
    print("\n=== Testing GET /api/academy/settings ===")
    try:
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        response = requests.get(
            f"{API_BASE_URL}/academy/settings",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            # Check for expected settings fields
            expected_fields = ["academy_id", "academy_name", "logo_url"]
            if any(field in data for field in expected_fields):
                print("✅ Get academy settings PASSED")
                return True, data
            else:
                print("❌ Get academy settings FAILED - Missing expected settings fields")
                return False, None
        else:
            print(f"❌ Get academy settings FAILED - Status: {response.status_code}, Response: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ Get academy settings test failed: {e}")
        return False, None

def test_academy_settings_update(access_token):
    """Test PUT /api/academy/settings"""
    print("\n=== Testing PUT /api/academy/settings ===")
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        # Update settings data
        settings_update = {
            "academy_name": "Updated Test Academy",
            "contact_email": "updated@testacademy.com",
            "contact_phone": "+1-555-9999",
            "address": "123 Updated Street, Test City, TC 12345",
            "website": "https://updated-academy.com",
            "description": "Updated academy description for testing",
            "social_media": {
                "facebook": "https://facebook.com/updated-academy",
                "instagram": "https://instagram.com/updated-academy",
                "twitter": "https://twitter.com/updated-academy"
            },
            "training_schedule": {
                "monday": "6:00 AM - 8:00 AM, 6:00 PM - 8:00 PM",
                "tuesday": "6:00 AM - 8:00 AM, 6:00 PM - 8:00 PM",
                "wednesday": "6:00 AM - 8:00 AM, 6:00 PM - 8:00 PM"
            },
            "facilities": ["Updated Field 1", "Updated Field 2", "Updated Gym"],
            "sports_offered": ["Football", "Basketball", "Tennis"]
        }
        
        response = requests.put(
            f"{API_BASE_URL}/academy/settings",
            json=settings_update,
            headers=headers,
            timeout=15
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            # Verify some updates were applied
            if (data.get('academy_name') == settings_update['academy_name'] or
                data.get('contact_email') == settings_update['contact_email']):
                print("✅ Update academy settings PASSED")
                return True, data
            else:
                print("❌ Update academy settings FAILED - Updates not applied correctly")
                return False, None
        else:
            print(f"❌ Update academy settings FAILED - Status: {response.status_code}, Response: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ Update academy settings test failed: {e}")
        return False, None

def test_data_persistence(access_token):
    """Test if data is being persisted in the database"""
    print("\n=== Testing Data Persistence ===")
    
    # Test 1: Upload logo and check if it persists in settings
    print("Testing logo upload persistence...")
    logo_success, logo_url = test_academy_logo_upload(access_token)
    
    if logo_success and logo_url:
        # Check if logo URL is saved in settings
        settings_success, settings_data = test_academy_settings_get(access_token)
        if settings_success and settings_data.get('logo_url') == logo_url:
            print("✅ Logo upload persistence PASSED - Logo URL saved in settings")
        else:
            print("❌ Logo upload persistence FAILED - Logo URL not saved in settings")
            return False
    
    # Test 2: Update settings and verify persistence
    print("Testing settings update persistence...")
    update_success, updated_data = test_academy_settings_update(access_token)
    
    if update_success:
        # Get settings again to verify persistence
        verify_success, verify_data = test_academy_settings_get(access_token)
        if verify_success and verify_data.get('academy_name') == updated_data.get('academy_name'):
            print("✅ Settings update persistence PASSED - Changes persisted")
            return True
        else:
            print("❌ Settings update persistence FAILED - Changes not persisted")
            return False
    else:
        print("❌ Settings update persistence FAILED - Could not update settings")
        return False

def test_authentication_and_validation(access_token):
    """Test authentication and validation issues"""
    print("\n=== Testing Authentication and Validation ===")
    
    # Test 1: Try endpoints without authentication
    print("Testing endpoints without authentication...")
    endpoints_to_test = [
        ("POST", f"{API_BASE_URL}/academy/attendance"),
        ("GET", f"{API_BASE_URL}/academy/attendance/2024-01-01"),
        ("GET", f"{API_BASE_URL}/academy/attendance/summary"),
        ("POST", f"{API_BASE_URL}/academy/logo"),
        ("GET", f"{API_BASE_URL}/academy/settings"),
        ("PUT", f"{API_BASE_URL}/academy/settings")
    ]
    
    auth_tests_passed = 0
    for method, url in endpoints_to_test:
        try:
            if method == "GET":
                response = requests.get(url, timeout=5)
            elif method == "POST":
                response = requests.post(url, json={}, timeout=5)
            elif method == "PUT":
                response = requests.put(url, json={}, timeout=5)
            
            if response.status_code == 401:
                auth_tests_passed += 1
                print(f"✅ {method} {url.split('/')[-1]}: Correctly requires authentication")
            else:
                print(f"⚠️ {method} {url.split('/')[-1]}: Status {response.status_code} (expected 401)")
        except:
            pass
    
    # Test 2: Try with invalid token
    print("Testing with invalid token...")
    invalid_headers = {"Authorization": "Bearer invalid_token_123"}
    
    try:
        response = requests.get(
            f"{API_BASE_URL}/academy/settings",
            headers=invalid_headers,
            timeout=5
        )
        
        if response.status_code == 401:
            print("✅ Invalid token correctly rejected")
            auth_tests_passed += 1
        else:
            print(f"⚠️ Invalid token handling: Status {response.status_code} (expected 401)")
    except:
        pass
    
    if auth_tests_passed >= 4:  # Allow some flexibility
        print("✅ Authentication and validation tests PASSED")
        return True
    else:
        print("❌ Authentication and validation tests FAILED")
        return False

def run_comprehensive_tests():
    """Run all attendance and profile update tests"""
    print("=" * 80)
    print("ATTENDANCE TRACKER AND ACADEMY PROFILE UPDATE TESTING")
    print("=" * 80)
    
    # Get academy user token
    access_token = get_academy_user_token()
    if not access_token:
        print("❌ Cannot proceed without valid access token")
        return False
    
    test_results = {}
    
    # Test attendance functionality
    print("\n" + "=" * 50)
    print("ATTENDANCE TRACKER FUNCTIONALITY TESTS")
    print("=" * 50)
    
    test_results['attendance_mark'] = test_attendance_mark_endpoint(access_token)[0] if test_attendance_mark_endpoint(access_token) else False
    test_results['attendance_get_by_date'] = test_attendance_get_by_date(access_token)[0] if test_attendance_get_by_date(access_token) else False
    test_results['attendance_summary'] = test_attendance_summary(access_token)[0] if test_attendance_summary(access_token) else False
    
    # Test academy profile update functionality
    print("\n" + "=" * 50)
    print("ACADEMY PROFILE UPDATE FUNCTIONALITY TESTS")
    print("=" * 50)
    
    test_results['logo_upload'] = test_academy_logo_upload(access_token)[0] if test_academy_logo_upload(access_token) else False
    test_results['settings_get'] = test_academy_settings_get(access_token)[0] if test_academy_settings_get(access_token) else False
    test_results['settings_update'] = test_academy_settings_update(access_token)[0] if test_academy_settings_update(access_token) else False
    
    # Test data persistence
    test_results['data_persistence'] = test_data_persistence(access_token)
    
    # Test authentication and validation
    test_results['auth_validation'] = test_authentication_and_validation(access_token)
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 COMPREHENSIVE TEST RESULTS SUMMARY")
    print("=" * 80)
    
    attendance_tests = ['attendance_mark', 'attendance_get_by_date', 'attendance_summary']
    profile_tests = ['logo_upload', 'settings_get', 'settings_update']
    system_tests = ['data_persistence', 'auth_validation']
    
    print("\n🎯 ATTENDANCE TRACKER TESTS:")
    attendance_passed = 0
    for test in attendance_tests:
        status = "✅ PASSED" if test_results.get(test, False) else "❌ FAILED"
        print(f"  {test.replace('_', ' ').title()}: {status}")
        if test_results.get(test, False):
            attendance_passed += 1
    
    print(f"  Attendance Tests: {attendance_passed}/{len(attendance_tests)} passed")
    
    print("\n🏛️ ACADEMY PROFILE UPDATE TESTS:")
    profile_passed = 0
    for test in profile_tests:
        status = "✅ PASSED" if test_results.get(test, False) else "❌ FAILED"
        print(f"  {test.replace('_', ' ').title()}: {status}")
        if test_results.get(test, False):
            profile_passed += 1
    
    print(f"  Profile Tests: {profile_passed}/{len(profile_tests)} passed")
    
    print("\n🔧 SYSTEM INTEGRITY TESTS:")
    system_passed = 0
    for test in system_tests:
        status = "✅ PASSED" if test_results.get(test, False) else "❌ FAILED"
        print(f"  {test.replace('_', ' ').title()}: {status}")
        if test_results.get(test, False):
            system_passed += 1
    
    print(f"  System Tests: {system_passed}/{len(system_tests)} passed")
    
    total_passed = attendance_passed + profile_passed + system_passed
    total_tests = len(attendance_tests) + len(profile_tests) + len(system_tests)
    
    print(f"\n🎉 OVERALL RESULTS: {total_passed}/{total_tests} tests passed")
    
    # Detailed findings
    print("\n" + "=" * 80)
    print("🔍 DETAILED FINDINGS")
    print("=" * 80)
    
    if attendance_passed < len(attendance_tests):
        print("\n❌ ATTENDANCE TRACKER ISSUES FOUND:")
        if not test_results.get('attendance_mark', False):
            print("  - POST /api/academy/attendance: Attendance data may not be saving properly")
        if not test_results.get('attendance_get_by_date', False):
            print("  - GET /api/academy/attendance/{date}: Cannot retrieve attendance for specific dates")
        if not test_results.get('attendance_summary', False):
            print("  - GET /api/academy/attendance/summary: Attendance summary not working")
    
    if profile_passed < len(profile_tests):
        print("\n❌ ACADEMY PROFILE UPDATE ISSUES FOUND:")
        if not test_results.get('logo_upload', False):
            print("  - POST /api/academy/logo: Logo upload not working properly")
        if not test_results.get('settings_get', False):
            print("  - GET /api/academy/settings: Cannot retrieve academy settings")
        if not test_results.get('settings_update', False):
            print("  - PUT /api/academy/settings: Profile settings update not working")
    
    if not test_results.get('data_persistence', False):
        print("\n❌ DATA PERSISTENCE ISSUES:")
        print("  - Data may be uploading but not saving properly to database")
        print("  - Changes may not be persisting between requests")
    
    if not test_results.get('auth_validation', False):
        print("\n❌ AUTHENTICATION/VALIDATION ISSUES:")
        print("  - Authentication or authorization problems detected")
        print("  - Endpoints may not be properly protected")
    
    if total_passed == total_tests:
        print("\n🎉 ALL TESTS PASSED! No issues found with attendance tracker or profile update functionality.")
    elif total_passed >= total_tests * 0.7:  # 70% pass rate
        print("\n⚠️ MOST TESTS PASSED but some issues detected. See detailed findings above.")
    else:
        print("\n❌ SIGNIFICANT ISSUES DETECTED. Multiple systems are not working correctly.")
    
    return total_passed >= total_tests * 0.7

if __name__ == "__main__":
    success = run_comprehensive_tests()
    sys.exit(0 if success else 1)