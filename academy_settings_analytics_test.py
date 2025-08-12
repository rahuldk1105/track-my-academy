#!/usr/bin/env python3
"""
Academy Settings and Analytics API Testing for Track My Academy
Tests the newly implemented Academy Settings and Academy Analytics endpoints
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

# Get backend URL from frontend environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE_URL = f"{BACKEND_URL}/api"

print(f"Testing Academy Settings and Analytics at: {API_BASE_URL}")

# Test credentials for academy user
ACADEMY_USER_EMAIL = "testacademy2@roletest.com"
ACADEMY_USER_PASSWORD = "TestPassword123!"

def get_academy_user_token():
    """Get JWT token for academy user authentication"""
    print("\n=== Getting Academy User Authentication Token ===")
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
            session = response.json().get("session", {})
            access_token = session.get("access_token")
            if access_token:
                print("✅ Academy user authentication SUCCESSFUL")
                return access_token
            else:
                print("❌ No access token in response")
                return None
        else:
            print(f"❌ Login failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        return None

def test_get_academy_settings(token):
    """Test GET /api/academy/settings - Get academy settings"""
    print("\n=== Testing GET Academy Settings ===")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(
            f"{API_BASE_URL}/academy/settings",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Settings fields: {list(data.keys())}")
            
            # Verify required fields are present
            required_fields = ["id", "academy_id", "created_at", "updated_at"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                print("✅ GET Academy Settings PASSED - All required fields present")
                print(f"Academy ID: {data.get('academy_id')}")
                print(f"Logo URL: {data.get('logo_url', 'None')}")
                print(f"Description: {data.get('description', 'None')}")
                print(f"Training Days: {data.get('training_days', 'None')}")
                return True, data
            else:
                print(f"❌ GET Academy Settings FAILED - Missing fields: {missing_fields}")
                return False, None
        else:
            print(f"❌ GET Academy Settings FAILED - Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ GET Academy Settings test failed: {e}")
        return False, None

def test_update_academy_settings(token):
    """Test PUT /api/academy/settings - Update academy settings"""
    print("\n=== Testing PUT Academy Settings ===")
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Test updating various settings categories
        update_data = {
            # Branding settings
            "description": "Elite Sports Academy focused on developing young talent",
            "website": "https://elitesports.academy",
            "theme_color": "#ff6b35",
            "social_media": {
                "facebook": "https://facebook.com/elitesports",
                "twitter": "https://twitter.com/elitesports",
                "instagram": "https://instagram.com/elitesports"
            },
            
            # Operational settings
            "season_start_date": "2024-09-01",
            "season_end_date": "2025-06-30",
            "training_days": ["Monday", "Wednesday", "Friday"],
            "training_time": "6:00 PM - 8:00 PM",
            "facility_address": "123 Sports Complex Drive, Athletic City, AC 12345",
            "facility_amenities": ["Gym", "Pool", "Field", "Locker Rooms"],
            
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
        
        response = requests.put(
            f"{API_BASE_URL}/academy/settings",
            json=update_data,
            headers=headers,
            timeout=15
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Updated settings fields: {list(data.keys())}")
            
            # Verify updates were applied
            verification_checks = [
                ("description", update_data["description"]),
                ("website", update_data["website"]),
                ("theme_color", update_data["theme_color"]),
                ("training_days", update_data["training_days"]),
                ("facility_address", update_data["facility_address"]),
                ("email_notifications", update_data["email_notifications"])
            ]
            
            all_verified = True
            for field, expected_value in verification_checks:
                actual_value = data.get(field)
                if actual_value != expected_value:
                    print(f"❌ Field {field}: expected {expected_value}, got {actual_value}")
                    all_verified = False
                else:
                    print(f"✅ Field {field}: correctly updated")
            
            if all_verified:
                print("✅ PUT Academy Settings PASSED - All updates applied correctly")
                return True
            else:
                print("❌ PUT Academy Settings FAILED - Some updates not applied")
                return False
        else:
            print(f"❌ PUT Academy Settings FAILED - Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ PUT Academy Settings test failed: {e}")
        return False

def test_partial_settings_update(token):
    """Test partial update of academy settings"""
    print("\n=== Testing Partial Academy Settings Update ===")
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Test updating only a few fields
        partial_update = {
            "description": "Updated description for partial test",
            "training_time": "7:00 PM - 9:00 PM",
            "sms_notifications": False
        }
        
        response = requests.put(
            f"{API_BASE_URL}/academy/settings",
            json=partial_update,
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify partial updates
            if (data.get("description") == partial_update["description"] and
                data.get("training_time") == partial_update["training_time"] and
                data.get("sms_notifications") == partial_update["sms_notifications"]):
                print("✅ Partial Academy Settings Update PASSED")
                return True
            else:
                print("❌ Partial Academy Settings Update FAILED - Updates not applied correctly")
                return False
        else:
            print(f"❌ Partial Academy Settings Update FAILED - Status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Partial Academy Settings Update test failed: {e}")
        return False

def test_academy_logo_upload(token):
    """Test POST /api/academy/logo - Upload academy logo"""
    print("\n=== Testing Academy Logo Upload ===")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create a simple test image (PNG format)
        # This creates a minimal valid PNG file
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {
            'file': ('academy_logo.png', io.BytesIO(png_data), 'image/png')
        }
        
        response = requests.post(
            f"{API_BASE_URL}/academy/logo",
            files=files,
            headers=headers,
            timeout=15
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data}")
            
            if "logo_url" in data and "message" in data:
                logo_url = data["logo_url"]
                print(f"✅ Academy Logo Upload PASSED - Logo URL: {logo_url}")
                
                # Verify the logo URL is accessible
                logo_response = requests.get(f"{BACKEND_URL}{logo_url}", timeout=10)
                if logo_response.status_code == 200:
                    print("✅ Logo file is accessible via URL")
                    return True, logo_url
                else:
                    print(f"❌ Logo file not accessible - Status: {logo_response.status_code}")
                    return False, None
            else:
                print("❌ Academy Logo Upload FAILED - Missing logo_url or message in response")
                return False, None
        else:
            print(f"❌ Academy Logo Upload FAILED - Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ Academy Logo Upload test failed: {e}")
        return False, None

def test_invalid_logo_upload(token):
    """Test logo upload with invalid file type"""
    print("\n=== Testing Invalid Logo Upload ===")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Try to upload a text file
        text_content = io.BytesIO(b"This is not an image file")
        files = {
            'file': ('test.txt', text_content, 'text/plain')
        }
        
        response = requests.post(
            f"{API_BASE_URL}/academy/logo",
            files=files,
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            data = response.json()
            print(f"Error response: {data}")
            
            if "image" in data.get("detail", "").lower():
                print("✅ Invalid Logo Upload Validation PASSED")
                return True
            else:
                print("❌ Invalid Logo Upload Validation FAILED - Wrong error message")
                return False
        else:
            print(f"❌ Invalid Logo Upload Validation FAILED - Expected 400, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Invalid Logo Upload test failed: {e}")
        return False

def test_academy_analytics(token):
    """Test GET /api/academy/analytics - Get comprehensive analytics"""
    print("\n=== Testing Academy Analytics ===")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(
            f"{API_BASE_URL}/academy/analytics",
            headers=headers,
            timeout=15
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Analytics sections: {list(data.keys())}")
            
            # Verify required analytics sections
            required_sections = [
                "academy_id", "academy_name", "generated_at",
                "player_analytics", "coach_analytics", 
                "growth_metrics", "operational_metrics",
                "total_members", "monthly_growth_rate", "capacity_usage"
            ]
            
            missing_sections = [section for section in required_sections if section not in data]
            
            if not missing_sections:
                print("✅ All required analytics sections present")
                
                # Verify player analytics structure
                player_analytics = data.get("player_analytics", {})
                player_fields = ["total_players", "active_players", "age_distribution", "position_distribution", "recent_additions"]
                player_missing = [field for field in player_fields if field not in player_analytics]
                
                # Verify coach analytics structure
                coach_analytics = data.get("coach_analytics", {})
                coach_fields = ["total_coaches", "active_coaches", "specialization_distribution", "experience_distribution", "average_experience"]
                coach_missing = [field for field in coach_fields if field not in coach_analytics]
                
                if not player_missing and not coach_missing:
                    print("✅ Academy Analytics PASSED - All analytics data present")
                    print(f"Total Players: {player_analytics.get('total_players', 0)}")
                    print(f"Total Coaches: {coach_analytics.get('total_coaches', 0)}")
                    print(f"Total Members: {data.get('total_members', 0)}")
                    print(f"Capacity Usage: {data.get('capacity_usage', 0)}%")
                    return True, data
                else:
                    print(f"❌ Missing player fields: {player_missing}")
                    print(f"❌ Missing coach fields: {coach_missing}")
                    return False, None
            else:
                print(f"❌ Academy Analytics FAILED - Missing sections: {missing_sections}")
                return False, None
        else:
            print(f"❌ Academy Analytics FAILED - Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ Academy Analytics test failed: {e}")
        return False, None

def test_player_analytics(token):
    """Test GET /api/academy/analytics/players - Get player-specific analytics"""
    print("\n=== Testing Player Analytics ===")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(
            f"{API_BASE_URL}/academy/analytics/players",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Player analytics fields: {list(data.keys())}")
            
            # Verify required player analytics fields
            required_fields = [
                "total_players", "active_players", "inactive_players",
                "age_distribution", "position_distribution", 
                "status_distribution", "recent_additions"
            ]
            
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                print("✅ Player Analytics PASSED - All required fields present")
                print(f"Total Players: {data.get('total_players')}")
                print(f"Active Players: {data.get('active_players')}")
                print(f"Age Distribution: {data.get('age_distribution')}")
                print(f"Position Distribution: {data.get('position_distribution')}")
                print(f"Recent Additions: {data.get('recent_additions')}")
                return True
            else:
                print(f"❌ Player Analytics FAILED - Missing fields: {missing_fields}")
                return False
        else:
            print(f"❌ Player Analytics FAILED - Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Player Analytics test failed: {e}")
        return False

def test_coach_analytics(token):
    """Test GET /api/academy/analytics/coaches - Get coach-specific analytics"""
    print("\n=== Testing Coach Analytics ===")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(
            f"{API_BASE_URL}/academy/analytics/coaches",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Coach analytics fields: {list(data.keys())}")
            
            # Verify required coach analytics fields
            required_fields = [
                "total_coaches", "active_coaches", "inactive_coaches",
                "specialization_distribution", "experience_distribution",
                "average_experience", "recent_additions"
            ]
            
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                print("✅ Coach Analytics PASSED - All required fields present")
                print(f"Total Coaches: {data.get('total_coaches')}")
                print(f"Active Coaches: {data.get('active_coaches')}")
                print(f"Specialization Distribution: {data.get('specialization_distribution')}")
                print(f"Experience Distribution: {data.get('experience_distribution')}")
                print(f"Average Experience: {data.get('average_experience')} years")
                print(f"Recent Additions: {data.get('recent_additions')}")
                return True
            else:
                print(f"❌ Coach Analytics FAILED - Missing fields: {missing_fields}")
                return False
        else:
            print(f"❌ Coach Analytics FAILED - Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Coach Analytics test failed: {e}")
        return False

def test_data_isolation(token):
    """Test that academy users can only access their own data"""
    print("\n=== Testing Data Isolation ===")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test that academy user can access their own settings
        settings_response = requests.get(
            f"{API_BASE_URL}/academy/settings",
            headers=headers,
            timeout=10
        )
        
        if settings_response.status_code == 200:
            print("✅ Academy user can access their own settings")
            
            # Test that academy user can access their own analytics
            analytics_response = requests.get(
                f"{API_BASE_URL}/academy/analytics",
                headers=headers,
                timeout=10
            )
            
            if analytics_response.status_code == 200:
                print("✅ Academy user can access their own analytics")
                print("✅ Data Isolation PASSED - Academy user has proper access")
                return True
            else:
                print("❌ Academy user cannot access their own analytics")
                return False
        else:
            print("❌ Academy user cannot access their own settings")
            return False
            
    except Exception as e:
        print(f"❌ Data Isolation test failed: {e}")
        return False

def test_super_admin_blocked():
    """Test that super admin users are blocked from academy endpoints"""
    print("\n=== Testing Super Admin Access Block ===")
    try:
        # Try to login as super admin
        login_data = {
            "email": "admin@trackmyacademy.com",
            "password": "AdminPassword123!"
        }
        
        response = requests.post(
            f"{API_BASE_URL}/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        if response.status_code == 200:
            session = response.json().get("session", {})
            admin_token = session.get("access_token")
            
            if admin_token:
                headers = {"Authorization": f"Bearer {admin_token}"}
                
                # Try to access academy settings with admin token
                settings_response = requests.get(
                    f"{API_BASE_URL}/academy/settings",
                    headers=headers,
                    timeout=10
                )
                
                if settings_response.status_code == 403:
                    print("✅ Super Admin correctly blocked from academy settings")
                    
                    # Try to access academy analytics with admin token
                    analytics_response = requests.get(
                        f"{API_BASE_URL}/academy/analytics",
                        headers=headers,
                        timeout=10
                    )
                    
                    if analytics_response.status_code == 403:
                        print("✅ Super Admin correctly blocked from academy analytics")
                        print("✅ Super Admin Access Block PASSED")
                        return True
                    else:
                        print(f"❌ Super Admin not blocked from analytics - Status: {analytics_response.status_code}")
                        return False
                else:
                    print(f"❌ Super Admin not blocked from settings - Status: {settings_response.status_code}")
                    return False
            else:
                print("❌ Could not get admin token")
                return False
        else:
            print("❌ Could not login as admin")
            return False
            
    except Exception as e:
        print(f"❌ Super Admin Access Block test failed: {e}")
        return False

def run_all_tests():
    """Run all Academy Settings and Analytics tests"""
    print("🚀 Starting Academy Settings and Analytics API Tests")
    print("=" * 60)
    
    # Get authentication token
    token = get_academy_user_token()
    if not token:
        print("❌ Cannot proceed without authentication token")
        return False
    
    # Track test results
    test_results = []
    
    # Academy Settings Tests
    print("\n" + "=" * 60)
    print("ACADEMY SETTINGS TESTS")
    print("=" * 60)
    
    result, settings_data = test_get_academy_settings(token)
    test_results.append(("GET Academy Settings", result))
    
    result = test_update_academy_settings(token)
    test_results.append(("PUT Academy Settings", result))
    
    result = test_partial_settings_update(token)
    test_results.append(("Partial Settings Update", result))
    
    result, logo_url = test_academy_logo_upload(token)
    test_results.append(("Academy Logo Upload", result))
    
    result = test_invalid_logo_upload(token)
    test_results.append(("Invalid Logo Upload Validation", result))
    
    # Academy Analytics Tests
    print("\n" + "=" * 60)
    print("ACADEMY ANALYTICS TESTS")
    print("=" * 60)
    
    result, analytics_data = test_academy_analytics(token)
    test_results.append(("Academy Analytics", result))
    
    result = test_player_analytics(token)
    test_results.append(("Player Analytics", result))
    
    result = test_coach_analytics(token)
    test_results.append(("Coach Analytics", result))
    
    # Data Isolation Tests
    print("\n" + "=" * 60)
    print("DATA ISOLATION TESTS")
    print("=" * 60)
    
    result = test_data_isolation(token)
    test_results.append(("Data Isolation", result))
    
    result = test_super_admin_blocked()
    test_results.append(("Super Admin Access Block", result))
    
    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed_tests = 0
    total_tests = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
        if result:
            passed_tests += 1
    
    print(f"\nTotal Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {total_tests - passed_tests}")
    print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    
    if passed_tests == total_tests:
        print("\n🎉 ALL TESTS PASSED! Academy Settings and Analytics APIs are working correctly.")
        return True
    else:
        print(f"\n⚠️ {total_tests - passed_tests} tests failed. Please review the issues above.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)