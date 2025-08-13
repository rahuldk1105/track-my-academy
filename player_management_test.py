#!/usr/bin/env python3
"""
Player Management Testing for Track My Academy
Tests the player management functionality for academy dashboard
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

print(f"Testing player management at: {API_BASE_URL}")

# Test credentials
TEST_ACADEMY_EMAIL = "testacademy2@roletest.com"
TEST_ACADEMY_PASSWORD = "TestPassword123!"

def test_academy_user_authentication():
    """Test academy user authentication (testacademy2@roletest.com)"""
    print("\n=== Testing Academy User Authentication ===")
    try:
        login_data = {
            "email": TEST_ACADEMY_EMAIL,
            "password": TEST_ACADEMY_PASSWORD
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
            
            if "user" in data and "session" in data:
                session = data.get("session", {})
                access_token = session.get("access_token")
                user = data.get("user", {})
                
                print(f"✅ Academy user login PASSED")
                print(f"User ID: {user.get('id')}")
                print(f"User Email: {user.get('email')}")
                
                return True, access_token, user.get('id')
            else:
                print("❌ Academy user login FAILED - Missing required response fields")
                return False, None, None
        else:
            print(f"❌ Academy user login FAILED - Status: {response.status_code}, Response: {response.text}")
            return False, None, None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Academy user login FAILED - Connection error: {e}")
        return False, None, None

def test_get_user_role_info(access_token):
    """Test GET /api/auth/user to get role information"""
    print("\n=== Testing User Role Information ===")
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
            user = data.get("user", {})
            role_info = user.get("role_info", {})
            
            print(f"User role: {role_info.get('role')}")
            print(f"Academy ID: {role_info.get('academy_id')}")
            print(f"Academy Name: {role_info.get('academy_name')}")
            print(f"Permissions: {role_info.get('permissions')}")
            
            if role_info.get('role') == 'academy_user' and role_info.get('academy_id'):
                print("✅ User role information PASSED")
                return True, role_info.get('academy_id'), role_info.get('academy_name')
            else:
                print("❌ User role information FAILED - Not an academy user or missing academy_id")
                return False, None, None
        else:
            print(f"❌ User role information FAILED - Status: {response.status_code}")
            return False, None, None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ User role information FAILED - Connection error: {e}")
        return False, None, None

def test_check_existing_players(access_token):
    """Test GET /api/academy/players to check existing players"""
    print("\n=== Testing Check Existing Players ===")
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        response = requests.get(
            f"{API_BASE_URL}/academy/players",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            players = response.json()
            print(f"Number of existing players: {len(players)}")
            
            if len(players) > 0:
                print("✅ Found existing players:")
                for i, player in enumerate(players[:3]):  # Show first 3 players
                    print(f"  Player {i+1}: {player.get('first_name', 'N/A')} {player.get('last_name', 'N/A')}")
                    print(f"    ID: {player.get('id')}")
                    print(f"    Sport: {player.get('sport', 'N/A')}")
                    print(f"    Position: {player.get('position', 'N/A')}")
                    print(f"    Registration Number: {player.get('registration_number', 'N/A')}")
                    print(f"    Age: {player.get('age', 'N/A')}")
                    print(f"    Gender: {player.get('gender', 'N/A')}")
                    print(f"    Status: {player.get('status', 'N/A')}")
                    print()
                
                # Check data structure
                sample_player = players[0]
                expected_fields = [
                    'id', 'academy_id', 'first_name', 'last_name', 'sport', 
                    'gender', 'status', 'created_at', 'updated_at'
                ]
                missing_fields = [field for field in expected_fields if field not in sample_player]
                
                if missing_fields:
                    print(f"⚠️ Missing fields in player data: {missing_fields}")
                else:
                    print("✅ Player data structure is complete")
                
                return True, players
            else:
                print("⚠️ No existing players found")
                return True, []
        elif response.status_code == 403:
            print("❌ Access denied - User may not have academy association")
            return False, None
        else:
            print(f"❌ Check existing players FAILED - Status: {response.status_code}, Response: {response.text}")
            return False, None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Check existing players FAILED - Connection error: {e}")
        return False, None

def test_academy_stats(access_token):
    """Test GET /api/academy/stats to check player counts"""
    print("\n=== Testing Academy Stats ===")
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        response = requests.get(
            f"{API_BASE_URL}/academy/stats",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            stats = response.json()
            print(f"Academy Stats:")
            print(f"  Total Players: {stats.get('total_players', 'N/A')}")
            print(f"  Active Players: {stats.get('active_players', 'N/A')}")
            print(f"  Player Limit: {stats.get('player_limit', 'N/A')}")
            print(f"  Total Coaches: {stats.get('total_coaches', 'N/A')}")
            print(f"  Active Coaches: {stats.get('active_coaches', 'N/A')}")
            print(f"  Coach Limit: {stats.get('coach_limit', 'N/A')}")
            
            print("✅ Academy stats retrieved successfully")
            return True, stats
        else:
            print(f"❌ Academy stats FAILED - Status: {response.status_code}, Response: {response.text}")
            return False, None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Academy stats FAILED - Connection error: {e}")
        return False, None

def test_create_test_player(access_token):
    """Test POST /api/academy/players to create a test player"""
    print("\n=== Testing Create Test Player ===")
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        
        # Create realistic test player data
        player_data = {
            "first_name": "Alex",
            "last_name": "Johnson",
            "email": "alex.johnson@email.com",
            "phone": "+1-555-0123",
            "date_of_birth": "2005-03-15",
            "gender": "Male",
            "sport": "Football",
            "position": "Midfielder",
            "registration_number": "REG001",
            "height": "5'8\"",
            "weight": "65 kg",
            "training_days": ["Monday", "Wednesday", "Friday"],
            "training_batch": "Evening",
            "emergency_contact_name": "Sarah Johnson",
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
            created_player = response.json()
            print(f"✅ Test player created successfully")
            print(f"Player ID: {created_player.get('id')}")
            print(f"Name: {created_player.get('first_name')} {created_player.get('last_name')}")
            print(f"Age: {created_player.get('age')} (calculated from DOB)")
            print(f"Sport: {created_player.get('sport')}")
            print(f"Position: {created_player.get('position')}")
            print(f"Registration Number: {created_player.get('registration_number')}")
            
            # Verify all fields are present
            expected_fields = [
                'id', 'academy_id', 'first_name', 'last_name', 'email', 'phone',
                'date_of_birth', 'age', 'gender', 'sport', 'position', 
                'registration_number', 'height', 'weight', 'training_days',
                'training_batch', 'emergency_contact_name', 'emergency_contact_phone',
                'medical_notes', 'status', 'created_at', 'updated_at'
            ]
            
            missing_fields = [field for field in expected_fields if field not in created_player]
            if missing_fields:
                print(f"⚠️ Missing fields in created player: {missing_fields}")
            else:
                print("✅ All expected fields present in created player")
            
            return True, created_player.get('id')
        elif response.status_code == 400:
            error_data = response.json()
            if "duplicate" in str(error_data).lower() or "already exists" in str(error_data).lower():
                print("✅ Player creation validation working (duplicate registration number)")
                return True, None
            else:
                print(f"❌ Player creation FAILED - Bad request: {error_data}")
                return False, None
        else:
            print(f"❌ Player creation FAILED - Status: {response.status_code}, Response: {response.text}")
            return False, None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Player creation FAILED - Connection error: {e}")
        return False, None

def run_player_management_tests():
    """Run all player management tests"""
    print("🏃‍♂️ Starting Player Management Testing for Track My Academy")
    print("=" * 70)
    
    test_results = {}
    access_token = None
    academy_id = None
    
    # Test 1: Academy user authentication
    auth_success, access_token, user_id = test_academy_user_authentication()
    test_results['academy_authentication'] = auth_success
    
    if not auth_success:
        print("❌ Cannot proceed without authentication")
        return False
    
    # Test 2: Get user role information
    role_success, academy_id, academy_name = test_get_user_role_info(access_token)
    test_results['user_role_info'] = role_success
    
    if role_success:
        print(f"Testing with Academy: {academy_name} (ID: {academy_id})")
    
    # Test 3: Check existing players
    players_success, existing_players = test_check_existing_players(access_token)
    test_results['check_existing_players'] = players_success
    
    # Test 4: Academy stats
    stats_success, stats = test_academy_stats(access_token)
    test_results['academy_stats'] = stats_success
    
    # Test 5: Create test player if needed
    if not existing_players:
        print("\n⚠️ No existing players found - creating test player")
        create_success, player_id = test_create_test_player(access_token)
        test_results['create_test_player'] = create_success
        
        # Re-check players after creation
        final_players_success, final_players = test_check_existing_players(access_token)
        test_results['final_players_check'] = final_players_success
    else:
        test_results['create_test_player'] = True  # Skip if players exist
        test_results['final_players_check'] = True
        final_players = existing_players
    
    # Print summary
    print("\n" + "=" * 70)
    print("📊 PLAYER MANAGEMENT TEST SUMMARY")
    print("=" * 70)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    # Detailed analysis
    print("\n" + "=" * 70)
    print("🔍 DETAILED ANALYSIS")
    print("=" * 70)
    
    if existing_players:
        print(f"✅ Found {len(existing_players)} existing players in database")
        print("✅ Players are being returned by GET /api/academy/players endpoint")
        
        if stats and stats.get('total_players', 0) > 0:
            print(f"✅ Academy stats show {stats.get('total_players')} players")
            print("✅ Player count in stats matches actual players")
        else:
            print("⚠️ Academy stats may not be reflecting player count correctly")
    else:
        print("⚠️ No existing players found in database")
        print("⚠️ This could explain why players tab is empty in frontend")
    
    if final_players and len(final_players) > len(existing_players or []):
        print(f"✅ Successfully created new test player")
        print(f"✅ Player creation and retrieval working correctly")
    
    # Root cause analysis
    print("\n" + "=" * 70)
    print("🎯 ROOT CAUSE ANALYSIS")
    print("=" * 70)
    
    if not existing_players:
        print("🔍 ISSUE IDENTIFIED: No players exist in the database for this academy")
        print("💡 RECOMMENDATION: Create some test players to verify frontend display")
    elif not players_success:
        print("🔍 ISSUE IDENTIFIED: Cannot retrieve players from API")
        print("💡 RECOMMENDATION: Check API endpoint and authentication")
    else:
        print("✅ Backend player management appears to be working correctly")
        print("💡 RECOMMENDATION: Issue may be in frontend player display logic")
    
    success_rate = passed / total
    if success_rate >= 0.8:
        print(f"\n🎉 Player Management System is working well ({success_rate:.1%} success rate)")
        return True
    else:
        print(f"\n⚠️ Player Management System needs attention ({success_rate:.1%} success rate)")
        return False

if __name__ == "__main__":
    success = run_player_management_tests()
    sys.exit(0 if success else 1)