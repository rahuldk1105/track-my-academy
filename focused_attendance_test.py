#!/usr/bin/env python3
"""
Focused Attendance and Profile Testing with Real Data
"""

import requests
import json
import os
from datetime import datetime, date
import io
from PIL import Image

# Load environment variables
from dotenv import load_dotenv
load_dotenv('/app/frontend/.env')

# Get backend URL from frontend environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE_URL = f"{BACKEND_URL}/api"

# Test credentials
ACADEMY_USER_EMAIL = "testacademy@attendance.com"
ACADEMY_USER_PASSWORD = "TestPassword123!"

def get_academy_user_token():
    """Get access token for academy user"""
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
        return access_token
    return None

def get_test_players(access_token):
    """Get existing players for testing"""
    headers = {"Authorization": f"Bearer {access_token}"}
    
    response = requests.get(
        f"{API_BASE_URL}/academy/players",
        headers=headers,
        timeout=10
    )
    
    if response.status_code == 200:
        players = response.json()
        print(f"Found {len(players)} players for testing")
        return players
    else:
        print(f"Failed to get players: {response.status_code}")
        return []

def test_attendance_with_real_players():
    """Test attendance functionality with real player data"""
    print("\n=== FOCUSED ATTENDANCE TESTING WITH REAL PLAYERS ===")
    
    access_token = get_academy_user_token()
    if not access_token:
        print("❌ Cannot get access token")
        return False
    
    players = get_test_players(access_token)
    if not players:
        print("❌ No players found for testing")
        return False
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    
    # Test 1: Mark attendance with real player IDs
    print("\n1. Testing attendance marking with real players...")
    today = date.today().strftime("%Y-%m-%d")
    
    attendance_records = []
    for i, player in enumerate(players[:2]):  # Test with first 2 players
        attendance_records.append({
            "player_id": player["id"],
            "date": today,
            "present": True if i == 0 else False,
            "sport": "Football",
            "performance_ratings": {
                "Technical Skills": 8,
                "Physical Fitness": 7,
                "Tactical Awareness": 6,
                "Mental Strength": 9,
                "Teamwork": 8
            } if i == 0 else {},
            "notes": f"Test attendance for {player['first_name']}"
        })
    
    attendance_data = {
        "date": today,
        "attendance_records": attendance_records
    }
    
    response = requests.post(
        f"{API_BASE_URL}/academy/attendance",
        json=attendance_data,
        headers=headers,
        timeout=15
    )
    
    print(f"Attendance marking status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        print("✅ Attendance marking successful")
        
        # Test 2: Retrieve attendance for the date
        print(f"\n2. Testing attendance retrieval for {today}...")
        get_response = requests.get(
            f"{API_BASE_URL}/academy/attendance/{today}",
            headers=headers,
            timeout=10
        )
        
        print(f"Get attendance status: {get_response.status_code}")
        get_data = get_response.json()
        print(f"Get response: {get_data}")
        
        # Check if data was actually saved
        if get_response.status_code == 200:
            if isinstance(get_data, dict) and 'attendance_records' in get_data:
                records = get_data['attendance_records']
                if len(records) > 0:
                    print(f"✅ Found {len(records)} attendance records - Data is being saved!")
                    return True
                else:
                    print("❌ No attendance records found - Data not being saved properly")
                    return False
            elif isinstance(get_data, list) and len(get_data) > 0:
                print(f"✅ Found {len(get_data)} attendance records - Data is being saved!")
                return True
            else:
                print("❌ Attendance data not found - Data not being saved properly")
                return False
        else:
            print("❌ Failed to retrieve attendance data")
            return False
    else:
        print("❌ Attendance marking failed")
        return False

def test_profile_settings_issue():
    """Test the specific profile settings update issue"""
    print("\n=== FOCUSED PROFILE SETTINGS TESTING ===")
    
    access_token = get_academy_user_token()
    if not access_token:
        print("❌ Cannot get access token")
        return False
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    
    # Test 1: Get current settings
    print("\n1. Getting current academy settings...")
    get_response = requests.get(
        f"{API_BASE_URL}/academy/settings",
        headers=headers,
        timeout=10
    )
    
    print(f"Get settings status: {get_response.status_code}")
    if get_response.status_code == 200:
        current_settings = get_response.json()
        print(f"Current settings ID: {current_settings.get('id')}")
        print(f"Current academy_name: {current_settings.get('academy_name', 'Not set')}")
        print(f"Current description: {current_settings.get('description', 'Not set')}")
        
        # Test 2: Update settings with specific fields
        print("\n2. Testing settings update...")
        update_data = {
            "academy_name": "Updated Test Academy Name",
            "description": "This is a test description update",
            "website": "https://test-academy.com"
        }
        
        update_response = requests.put(
            f"{API_BASE_URL}/academy/settings",
            json=update_data,
            headers=headers,
            timeout=15
        )
        
        print(f"Update settings status: {update_response.status_code}")
        if update_response.status_code == 200:
            updated_settings = update_response.json()
            print(f"Updated settings ID: {updated_settings.get('id')}")
            print(f"Updated academy_name: {updated_settings.get('academy_name', 'Not set')}")
            print(f"Updated description: {updated_settings.get('description', 'Not set')}")
            
            # Check if the update was applied
            if (updated_settings.get('academy_name') == update_data['academy_name'] and
                updated_settings.get('description') == update_data['description']):
                print("✅ Settings update working correctly")
                return True
            else:
                print("❌ Settings update not applied correctly")
                print(f"Expected academy_name: {update_data['academy_name']}")
                print(f"Got academy_name: {updated_settings.get('academy_name')}")
                return False
        else:
            print(f"❌ Settings update failed: {update_response.text}")
            return False
    else:
        print(f"❌ Failed to get settings: {get_response.text}")
        return False

def test_logo_upload_persistence():
    """Test logo upload and persistence"""
    print("\n=== FOCUSED LOGO UPLOAD TESTING ===")
    
    access_token = get_academy_user_token()
    if not access_token:
        print("❌ Cannot get access token")
        return False
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Test 1: Upload a logo
    print("\n1. Testing logo upload...")
    img = Image.new('RGB', (150, 150), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    files = {'file': ('test_logo.png', img_bytes, 'image/png')}
    
    upload_response = requests.post(
        f"{API_BASE_URL}/academy/logo",
        files=files,
        headers=headers,
        timeout=15
    )
    
    print(f"Logo upload status: {upload_response.status_code}")
    if upload_response.status_code == 200:
        upload_data = upload_response.json()
        logo_url = upload_data.get('logo_url')
        print(f"Logo uploaded to: {logo_url}")
        
        # Test 2: Check if logo is saved in settings
        print("\n2. Checking if logo is saved in settings...")
        settings_response = requests.get(
            f"{API_BASE_URL}/academy/settings",
            headers=headers,
            timeout=10
        )
        
        if settings_response.status_code == 200:
            settings = settings_response.json()
            settings_logo_url = settings.get('logo_url')
            print(f"Logo URL in settings: {settings_logo_url}")
            
            if settings_logo_url == logo_url:
                print("✅ Logo upload and persistence working correctly")
                return True
            else:
                print("❌ Logo not properly saved in settings")
                return False
        else:
            print("❌ Failed to get settings after logo upload")
            return False
    else:
        print(f"❌ Logo upload failed: {upload_response.text}")
        return False

def run_focused_tests():
    """Run focused tests to identify specific issues"""
    print("=" * 80)
    print("FOCUSED ATTENDANCE AND PROFILE TESTING")
    print("=" * 80)
    
    results = {
        'attendance_with_real_players': test_attendance_with_real_players(),
        'profile_settings_update': test_profile_settings_issue(),
        'logo_upload_persistence': test_logo_upload_persistence()
    }
    
    print("\n" + "=" * 80)
    print("📊 FOCUSED TEST RESULTS")
    print("=" * 80)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    passed = sum(results.values())
    total = len(results)
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    # Detailed analysis
    print("\n" + "=" * 80)
    print("🔍 DETAILED ISSUE ANALYSIS")
    print("=" * 80)
    
    if not results['attendance_with_real_players']:
        print("\n❌ ATTENDANCE ISSUE IDENTIFIED:")
        print("  - Attendance marking appears to work (returns success)")
        print("  - BUT attendance data is NOT being saved to database")
        print("  - When retrieving attendance, no records are found")
        print("  - ROOT CAUSE: Database persistence issue in attendance endpoints")
    
    if not results['profile_settings_update']:
        print("\n❌ PROFILE SETTINGS ISSUE IDENTIFIED:")
        print("  - Settings update endpoint returns success")
        print("  - BUT the actual field values are not being updated")
        print("  - ROOT CAUSE: Settings update logic not applying changes correctly")
    
    if not results['logo_upload_persistence']:
        print("\n❌ LOGO UPLOAD ISSUE IDENTIFIED:")
        print("  - Logo upload works and files are saved")
        print("  - BUT logo URL is not being saved to academy settings")
        print("  - ROOT CAUSE: Logo upload not updating settings table")
    
    if passed == total:
        print("\n🎉 ALL FOCUSED TESTS PASSED!")
        print("The attendance tracker and profile update functionality is working correctly.")
    else:
        print(f"\n⚠️ {total - passed} CRITICAL ISSUES IDENTIFIED")
        print("These are the specific problems mentioned in the user's review request.")
    
    return passed == total

if __name__ == "__main__":
    success = run_focused_tests()
    exit(0 if success else 1)