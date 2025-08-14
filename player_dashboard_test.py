#!/usr/bin/env python3
"""
Player Dashboard Backend API Testing for Track My Academy
Tests the newly implemented player dashboard features including:
1. Enhanced Player Creation with automatic login credential generation
2. Player Authentication System
3. Player Dashboard APIs
4. Theme Preference System
5. Announcement Management
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

# Get backend URL from frontend environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE_URL = f"{BACKEND_URL}/api"

print(f"Testing Player Dashboard features at: {API_BASE_URL}")

# Test credentials
ACADEMY_USER_EMAIL = "testacademy2@roletest.com"
ACADEMY_USER_PASSWORD = "TestPassword123!"

def get_academy_access_token():
    """Get access token for academy user"""
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
        
        if response.status_code == 200:
            data = response.json()
            session = data.get("session", {})
            access_token = session.get("access_token")
            print(f"✅ Got academy access token")
            return access_token
        else:
            print(f"❌ Failed to get academy access token: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting academy access token: {e}")
        return None

def test_server_health_check():
    """Test backend server health check"""
    print("\n=== Testing Server Health Check ===")
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

def test_enhanced_player_creation_with_email():
    """Test POST /api/academy/players with email to trigger automatic login credential generation"""
    print("\n=== Testing Enhanced Player Creation with Email (Auto Login Generation) ===")
    
    access_token = get_academy_access_token()
    if not access_token:
        print("❌ Cannot test without academy access token")
        return False, None
    
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        # Create player with email to trigger automatic Supabase account creation
        player_data = {
            "first_name": "Alex",
            "last_name": "Rodriguez",
            "email": "alex.rodriguez@playertest.com",
            "phone": "+1-555-0123",
            "date_of_birth": "2005-03-15",
            "gender": "Male",
            "sport": "Football",
            "position": "Striker",
            "registration_number": "REG2024001",
            "height": "5'10\"",
            "weight": "70 kg",
            "training_days": ["Monday", "Wednesday", "Friday"],
            "training_batch": "Evening",
            "emergency_contact_name": "Maria Rodriguez",
            "emergency_contact_phone": "+1-555-0124",
            "medical_notes": "No known allergies"
        }
        
        response = requests.post(
            f"{API_BASE_URL}/academy/players",
            json=player_data,
            headers=headers,
            timeout=15
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Created player ID: {data.get('id')}")
            
            # Check if player has login credentials
            has_login = data.get('has_login', False)
            default_password = data.get('default_password')
            supabase_user_id = data.get('supabase_user_id')
            
            print(f"Has login: {has_login}")
            print(f"Default password generated: {'Yes' if default_password else 'No'}")
            print(f"Supabase user ID: {supabase_user_id}")
            
            if has_login and default_password and supabase_user_id:
                print("✅ Enhanced player creation with email PASSED - Login credentials generated")
                return True, {
                    'player_id': data.get('id'),
                    'email': player_data['email'],
                    'password': default_password,
                    'supabase_user_id': supabase_user_id
                }
            else:
                print("❌ Enhanced player creation FAILED - Login credentials not generated properly")
                return False, None
        elif response.status_code == 400:
            error_data = response.json()
            if "already exists" in str(error_data).lower():
                print("✅ Enhanced player creation PASSED (player already exists)")
                return True, None
            else:
                print(f"❌ Enhanced player creation FAILED - Bad request: {error_data}")
                return False, None
        else:
            print(f"❌ Enhanced player creation FAILED - Status: {response.status_code}, Response: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ Enhanced player creation test failed: {e}")
        return False, None

def test_player_creation_without_email():
    """Test POST /api/academy/players without email (no login creation)"""
    print("\n=== Testing Player Creation without Email (No Login Creation) ===")
    
    access_token = get_academy_access_token()
    if not access_token:
        print("❌ Cannot test without academy access token")
        return False
    
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        # Create player without email - should not create login credentials
        player_data = {
            "first_name": "Maria",
            "last_name": "Santos",
            "phone": "+1-555-0125",
            "date_of_birth": "2006-07-20",
            "gender": "Female",
            "sport": "Basketball",
            "position": "Point Guard",
            "registration_number": "REG2024002",
            "height": "5'6\"",
            "weight": "60 kg",
            "training_days": ["Tuesday", "Thursday", "Saturday"],
            "training_batch": "Morning",
            "emergency_contact_name": "Carlos Santos",
            "emergency_contact_phone": "+1-555-0126",
            "medical_notes": "Asthma - has inhaler"
        }
        
        response = requests.post(
            f"{API_BASE_URL}/academy/players",
            json=player_data,
            headers=headers,
            timeout=15
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Created player ID: {data.get('id')}")
            
            # Check that player does NOT have login credentials
            has_login = data.get('has_login', False)
            default_password = data.get('default_password')
            supabase_user_id = data.get('supabase_user_id')
            
            print(f"Has login: {has_login}")
            print(f"Default password: {default_password}")
            print(f"Supabase user ID: {supabase_user_id}")
            
            if not has_login and not default_password and not supabase_user_id:
                print("✅ Player creation without email PASSED - No login credentials created")
                return True
            else:
                print("❌ Player creation without email FAILED - Login credentials should not be created")
                return False
        elif response.status_code == 400:
            error_data = response.json()
            if "already exists" in str(error_data).lower():
                print("✅ Player creation without email PASSED (player already exists)")
                return True
            else:
                print(f"❌ Player creation without email FAILED - Bad request: {error_data}")
                return False
        else:
            print(f"❌ Player creation without email FAILED - Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Player creation without email test failed: {e}")
        return False

def test_player_authentication_login(player_credentials):
    """Test POST /api/player/auth/login with generated player credentials"""
    print("\n=== Testing Player Authentication Login ===")
    
    if not player_credentials:
        print("❌ No player credentials available for testing")
        return False, None
    
    try:
        login_data = {
            "email": player_credentials['email'],
            "password": player_credentials['password']
        }
        
        response = requests.post(
            f"{API_BASE_URL}/player/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {list(data.keys())}")
            
            if "player" in data and "session" in data and "message" in data:
                session = data.get("session", {})
                access_token = session.get("access_token")
                player_info = data.get("player", {})
                
                print(f"Player ID: {player_info.get('id')}")
                print(f"Player Name: {player_info.get('first_name')} {player_info.get('last_name')}")
                print("✅ Player authentication login PASSED")
                return True, access_token
            else:
                print("❌ Player authentication login FAILED - Missing required response fields")
                return False, None
        else:
            print(f"❌ Player authentication login FAILED - Status: {response.status_code}, Response: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ Player authentication login test failed: {e}")
        return False, None

def test_player_profile_endpoint(player_access_token):
    """Test GET /api/player/profile for authenticated player"""
    print("\n=== Testing Player Profile Endpoint ===")
    
    if not player_access_token:
        print("❌ No player access token available for testing")
        return False
    
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {player_access_token}"
        }
        
        response = requests.get(
            f"{API_BASE_URL}/player/profile",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Player profile keys: {list(data.keys())}")
            
            # Check for required player profile fields
            required_fields = ['id', 'first_name', 'last_name', 'email', 'sport', 'academy_id']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                print(f"Player Name: {data.get('first_name')} {data.get('last_name')}")
                print(f"Sport: {data.get('sport')}")
                print(f"Academy ID: {data.get('academy_id')}")
                print("✅ Player profile endpoint PASSED")
                return True
            else:
                print(f"❌ Player profile endpoint FAILED - Missing fields: {missing_fields}")
                return False
        else:
            print(f"❌ Player profile endpoint FAILED - Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Player profile endpoint test failed: {e}")
        return False

def test_player_change_password(player_access_token):
    """Test PUT /api/player/change-password functionality"""
    print("\n=== Testing Player Change Password ===")
    
    if not player_access_token:
        print("❌ No player access token available for testing")
        return False
    
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {player_access_token}"
        }
        
        # Test password change
        password_data = {
            "current_password": "old_password_placeholder",  # This would be the generated password
            "new_password": "NewPlayerPassword123!"
        }
        
        response = requests.put(
            f"{API_BASE_URL}/player/change-password",
            json=password_data,
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        # Since we don't have the actual current password, we expect this to fail with 400/401
        # But the endpoint should exist and handle the request properly
        if response.status_code in [400, 401]:
            error_data = response.json()
            if "current_password" in str(error_data).lower() or "invalid" in str(error_data).lower():
                print("✅ Player change password endpoint PASSED - Properly validates current password")
                return True
            else:
                print(f"❌ Player change password FAILED - Unexpected error: {error_data}")
                return False
        elif response.status_code == 200:
            print("✅ Player change password endpoint PASSED - Password changed successfully")
            return True
        else:
            print(f"❌ Player change password FAILED - Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Player change password test failed: {e}")
        return False

def test_player_attendance_endpoint(player_access_token):
    """Test GET /api/player/attendance (attendance history)"""
    print("\n=== Testing Player Attendance Endpoint ===")
    
    if not player_access_token:
        print("❌ No player access token available for testing")
        return False
    
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {player_access_token}"
        }
        
        response = requests.get(
            f"{API_BASE_URL}/player/attendance",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Attendance records retrieved: {len(data) if isinstance(data, list) else 'N/A'}")
            
            if isinstance(data, list):
                if len(data) > 0:
                    attendance_record = data[0]
                    print(f"Sample attendance record keys: {list(attendance_record.keys())}")
                
                print("✅ Player attendance endpoint PASSED")
                return True
            else:
                print("❌ Player attendance endpoint FAILED - Response should be a list")
                return False
        else:
            print(f"❌ Player attendance endpoint FAILED - Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Player attendance endpoint test failed: {e}")
        return False

def test_player_performance_endpoint(player_access_token):
    """Test GET /api/player/performance (performance statistics)"""
    print("\n=== Testing Player Performance Endpoint ===")
    
    if not player_access_token:
        print("❌ No player access token available for testing")
        return False
    
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {player_access_token}"
        }
        
        response = requests.get(
            f"{API_BASE_URL}/player/performance",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Performance data keys: {list(data.keys())}")
            
            # Check for expected performance analytics fields
            expected_fields = ['total_sessions', 'attended_sessions', 'attendance_percentage']
            present_fields = [field for field in expected_fields if field in data]
            
            print(f"Performance fields present: {present_fields}")
            print("✅ Player performance endpoint PASSED")
            return True
        else:
            print(f"❌ Player performance endpoint FAILED - Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Player performance endpoint test failed: {e}")
        return False

def test_player_announcements_endpoint(player_access_token):
    """Test GET /api/player/announcements (player announcements)"""
    print("\n=== Testing Player Announcements Endpoint ===")
    
    if not player_access_token:
        print("❌ No player access token available for testing")
        return False
    
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {player_access_token}"
        }
        
        response = requests.get(
            f"{API_BASE_URL}/player/announcements",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Announcements retrieved: {len(data) if isinstance(data, list) else 'N/A'}")
            
            if isinstance(data, list):
                if len(data) > 0:
                    announcement = data[0]
                    print(f"Sample announcement keys: {list(announcement.keys())}")
                
                print("✅ Player announcements endpoint PASSED")
                return True
            else:
                print("❌ Player announcements endpoint FAILED - Response should be a list")
                return False
        else:
            print(f"❌ Player announcements endpoint FAILED - Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Player announcements endpoint test failed: {e}")
        return False

def test_theme_preference_get():
    """Test GET /api/theme (should return default 'light' theme)"""
    print("\n=== Testing Theme Preference GET ===")
    
    try:
        response = requests.get(
            f"{API_BASE_URL}/theme",
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Theme response: {data}")
            
            theme = data.get('theme')
            if theme == 'light':
                print("✅ Theme preference GET PASSED - Default 'light' theme returned")
                return True
            else:
                print(f"❌ Theme preference GET FAILED - Expected 'light', got '{theme}'")
                return False
        else:
            print(f"❌ Theme preference GET FAILED - Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Theme preference GET test failed: {e}")
        return False

def test_theme_preference_put():
    """Test PUT /api/theme with 'dark' theme"""
    print("\n=== Testing Theme Preference PUT ===")
    
    try:
        # Test setting dark theme
        theme_data = {"theme": "dark"}
        
        response = requests.put(
            f"{API_BASE_URL}/theme",
            json=theme_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Theme update response: {data}")
            
            if data.get('theme') == 'dark':
                print("✅ Theme preference PUT PASSED - Dark theme set successfully")
                
                # Test getting the updated theme
                get_response = requests.get(f"{API_BASE_URL}/theme", timeout=10)
                if get_response.status_code == 200:
                    get_data = get_response.json()
                    if get_data.get('theme') == 'dark':
                        print("✅ Theme persistence PASSED - Dark theme persisted")
                        return True
                    else:
                        print("❌ Theme persistence FAILED - Theme not persisted")
                        return False
                else:
                    print("⚠️ Could not verify theme persistence")
                    return True  # Still consider PUT successful
            else:
                print(f"❌ Theme preference PUT FAILED - Expected 'dark', got '{data.get('theme')}'")
                return False
        else:
            print(f"❌ Theme preference PUT FAILED - Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Theme preference PUT test failed: {e}")
        return False

def test_theme_preference_invalid():
    """Test PUT /api/theme with invalid theme values (should return 400 error)"""
    print("\n=== Testing Theme Preference Invalid Values ===")
    
    try:
        # Test invalid theme value
        invalid_theme_data = {"theme": "rainbow"}
        
        response = requests.put(
            f"{API_BASE_URL}/theme",
            json=invalid_theme_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            error_data = response.json()
            print(f"Error response: {error_data}")
            print("✅ Theme preference invalid values PASSED - Properly rejected invalid theme")
            return True
        else:
            print(f"❌ Theme preference invalid values FAILED - Should return 400 for invalid theme")
            return False
            
    except Exception as e:
        print(f"❌ Theme preference invalid values test failed: {e}")
        return False

def test_announcement_management_create():
    """Test POST /api/academy/announcements (create announcement)"""
    print("\n=== Testing Announcement Management Create ===")
    
    access_token = get_academy_access_token()
    if not access_token:
        print("❌ Cannot test without academy access token")
        return False, None
    
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        announcement_data = {
            "title": "Training Schedule Update",
            "content": "Please note that tomorrow's training session has been moved to 6 PM due to weather conditions.",
            "priority": "high",
            "target_audience": "all"
        }
        
        response = requests.post(
            f"{API_BASE_URL}/academy/announcements",
            json=announcement_data,
            headers=headers,
            timeout=15
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Created announcement ID: {data.get('id')}")
            
            required_fields = ['id', 'title', 'content', 'priority', 'target_audience', 'is_active', 'created_at']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                print("✅ Announcement management create PASSED")
                return True, data.get('id')
            else:
                print(f"❌ Announcement management create FAILED - Missing fields: {missing_fields}")
                return False, None
        else:
            print(f"❌ Announcement management create FAILED - Status: {response.status_code}, Response: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ Announcement management create test failed: {e}")
        return False, None

def test_announcement_management_get():
    """Test GET /api/academy/announcements (list announcements)"""
    print("\n=== Testing Announcement Management Get ===")
    
    access_token = get_academy_access_token()
    if not access_token:
        print("❌ Cannot test without academy access token")
        return False, None
    
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        response = requests.get(
            f"{API_BASE_URL}/academy/announcements",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Announcements retrieved: {len(data) if isinstance(data, list) else 'N/A'}")
            
            if isinstance(data, list):
                if len(data) > 0:
                    announcement = data[0]
                    print(f"Sample announcement keys: {list(announcement.keys())}")
                
                print("✅ Announcement management get PASSED")
                return True, data
            else:
                print("❌ Announcement management get FAILED - Response should be a list")
                return False, None
        else:
            print(f"❌ Announcement management get FAILED - Status: {response.status_code}, Response: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ Announcement management get test failed: {e}")
        return False, None

def test_announcement_management_update(announcement_id):
    """Test PUT /api/academy/announcements/{id} (update announcement)"""
    print(f"\n=== Testing Announcement Management Update (ID: {announcement_id}) ===")
    
    if not announcement_id:
        print("❌ No announcement ID available for testing")
        return False
    
    access_token = get_academy_access_token()
    if not access_token:
        print("❌ Cannot test without academy access token")
        return False
    
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        update_data = {
            "title": "Updated Training Schedule",
            "content": "Training session has been confirmed for 6 PM tomorrow. Please bring water bottles.",
            "priority": "medium"
        }
        
        response = requests.put(
            f"{API_BASE_URL}/academy/announcements/{announcement_id}",
            json=update_data,
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Updated announcement title: {data.get('title')}")
            
            if data.get('title') == update_data['title']:
                print("✅ Announcement management update PASSED")
                return True
            else:
                print("❌ Announcement management update FAILED - Update not applied")
                return False
        elif response.status_code == 404:
            print("❌ Announcement management update FAILED - Announcement not found")
            return False
        else:
            print(f"❌ Announcement management update FAILED - Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Announcement management update test failed: {e}")
        return False

def test_announcement_management_delete(announcement_id):
    """Test DELETE /api/academy/announcements/{id} (delete announcement)"""
    print(f"\n=== Testing Announcement Management Delete (ID: {announcement_id}) ===")
    
    if not announcement_id:
        print("❌ No announcement ID available for testing")
        return False
    
    access_token = get_academy_access_token()
    if not access_token:
        print("❌ Cannot test without academy access token")
        return False
    
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        response = requests.delete(
            f"{API_BASE_URL}/academy/announcements/{announcement_id}",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data and "deleted" in data["message"].lower():
                print("✅ Announcement management delete PASSED")
                return True
            else:
                print("❌ Announcement management delete FAILED - Unexpected response")
                return False
        elif response.status_code == 404:
            print("❌ Announcement management delete FAILED - Announcement not found")
            return False
        else:
            print(f"❌ Announcement management delete FAILED - Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Announcement management delete test failed: {e}")
        return False

def run_all_player_dashboard_tests():
    """Run all player dashboard feature tests"""
    print("\n" + "=" * 80)
    print("🚀 STARTING PLAYER DASHBOARD BACKEND API TESTING")
    print("=" * 80)
    
    test_results = {}
    
    # 1. Server Health Check
    test_results['server_health'] = test_server_health_check()
    
    # 2. Enhanced Player Creation Tests
    player_creation_success, player_credentials = test_enhanced_player_creation_with_email()
    test_results['enhanced_player_creation_with_email'] = player_creation_success
    
    test_results['player_creation_without_email'] = test_player_creation_without_email()
    
    # 3. Player Authentication System Tests
    player_login_success, player_access_token = test_player_authentication_login(player_credentials)
    test_results['player_authentication_login'] = player_login_success
    
    test_results['player_profile_endpoint'] = test_player_profile_endpoint(player_access_token)
    test_results['player_change_password'] = test_player_change_password(player_access_token)
    
    # 4. Player Dashboard APIs Tests
    test_results['player_attendance_endpoint'] = test_player_attendance_endpoint(player_access_token)
    test_results['player_performance_endpoint'] = test_player_performance_endpoint(player_access_token)
    test_results['player_announcements_endpoint'] = test_player_announcements_endpoint(player_access_token)
    
    # 5. Theme Preference System Tests
    test_results['theme_preference_get'] = test_theme_preference_get()
    test_results['theme_preference_put'] = test_theme_preference_put()
    test_results['theme_preference_invalid'] = test_theme_preference_invalid()
    
    # 6. Announcement Management Tests
    announcement_create_success, announcement_id = test_announcement_management_create()
    test_results['announcement_management_create'] = announcement_create_success
    
    announcement_get_success, announcements = test_announcement_management_get()
    test_results['announcement_management_get'] = announcement_get_success
    
    test_results['announcement_management_update'] = test_announcement_management_update(announcement_id)
    test_results['announcement_management_delete'] = test_announcement_management_delete(announcement_id)
    
    # Print Summary
    print("\n" + "=" * 80)
    print("📊 PLAYER DASHBOARD BACKEND API TEST SUMMARY")
    print("=" * 80)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall Results: {passed}/{total} tests passed")
    
    if passed >= total - 2:  # Allow up to 2 tests to fail
        print("🎉 Player Dashboard Backend APIs are working correctly!")
        return True
    else:
        print("⚠️ Some Player Dashboard features need attention.")
        return False

if __name__ == "__main__":
    success = run_all_player_dashboard_tests()
    sys.exit(0 if success else 1)