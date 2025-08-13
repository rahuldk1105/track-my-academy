#!/usr/bin/env python3
"""
Player Display Issue Debug Test for Track My Academy
Specifically tests the player creation and retrieval issue where players are created but not displayed
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

print(f"🔍 DEBUGGING PLAYER DISPLAY ISSUE")
print(f"Testing backend at: {API_BASE_URL}")
print("=" * 60)

def test_academy_user_authentication():
    """Test academy user authentication with testacademy2@roletest.com"""
    print("\n=== 1. TESTING ACADEMY USER AUTHENTICATION ===")
    
    try:
        # Login with academy user
        login_data = {
            "email": "testacademy2@roletest.com",
            "password": "TestPassword123!"
        }
        
        print(f"🔐 Attempting login with: {login_data['email']}")
        response = requests.post(f"{API_BASE_URL}/auth/login", json=login_data, timeout=10)
        print(f"Login Status Code: {response.status_code}")
        
        if response.status_code == 200:
            login_result = response.json()
            access_token = login_result.get('session', {}).get('access_token')
            
            if access_token:
                print("✅ Login successful - Access token received")
                
                # Get user info to check academy association
                headers = {"Authorization": f"Bearer {access_token}"}
                user_response = requests.get(f"{API_BASE_URL}/auth/user", headers=headers, timeout=10)
                
                if user_response.status_code == 200:
                    user_data = user_response.json()
                    user_info = user_data.get('user', {})
                    role_info = user_info.get('role_info', {})
                    
                    print(f"✅ User info retrieved successfully")
                    print(f"   Role: {role_info.get('role')}")
                    print(f"   Academy ID: {role_info.get('academy_id')}")
                    print(f"   Academy Name: {role_info.get('academy_name')}")
                    print(f"   Permissions: {role_info.get('permissions')}")
                    
                    if role_info.get('role') == 'academy_user' and role_info.get('academy_id'):
                        print("✅ ACADEMY USER AUTHENTICATION: PASSED")
                        return access_token, role_info.get('academy_id')
                    else:
                        print("❌ ACADEMY USER AUTHENTICATION: FAILED - Missing academy association")
                        return None, None
                else:
                    print(f"❌ Failed to get user info: {user_response.status_code}")
                    return None, None
            else:
                print("❌ Login failed - No access token received")
                return None, None
        else:
            print(f"❌ Login failed with status: {response.status_code}")
            if response.text:
                print(f"Error: {response.text}")
            return None, None
            
    except Exception as e:
        print(f"❌ Authentication test failed: {e}")
        return None, None

def test_player_creation_api(access_token, academy_id):
    """Test player creation API"""
    print("\n=== 2. TESTING PLAYER CREATION API ===")
    
    if not access_token or not academy_id:
        print("❌ Cannot test player creation - missing authentication")
        return None
    
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Create a test player
        player_data = {
            "first_name": "Debug",
            "last_name": "TestPlayer",
            "email": "debug.player@test.com",
            "phone": "+1234567890",
            "date_of_birth": "2000-01-15",
            "gender": "Male",
            "sport": "Football",
            "position": "Central Midfielder",
            "registration_number": "DBG001",
            "height": "5'10\"",
            "weight": "70 kg",
            "training_days": ["Monday", "Wednesday", "Friday"],
            "training_batch": "Evening",
            "emergency_contact_name": "Debug Parent",
            "emergency_contact_phone": "+1234567891",
            "medical_notes": "No known allergies"
        }
        
        print(f"🏃 Creating test player: {player_data['first_name']} {player_data['last_name']}")
        response = requests.post(f"{API_BASE_URL}/academy/players", json=player_data, headers=headers, timeout=10)
        print(f"Player Creation Status Code: {response.status_code}")
        
        if response.status_code == 200:
            created_player = response.json()
            player_id = created_player.get('id')
            created_academy_id = created_player.get('academy_id')
            
            print("✅ Player created successfully")
            print(f"   Player ID: {player_id}")
            print(f"   Academy ID in player: {created_academy_id}")
            print(f"   Expected Academy ID: {academy_id}")
            print(f"   Name: {created_player.get('first_name')} {created_player.get('last_name')}")
            print(f"   Sport: {created_player.get('sport')}")
            print(f"   Position: {created_player.get('position')}")
            print(f"   Registration Number: {created_player.get('registration_number')}")
            
            # Verify academy_id linkage
            if created_academy_id == academy_id:
                print("✅ PLAYER CREATION: PASSED - Correct academy_id linkage")
                return player_id
            else:
                print(f"❌ PLAYER CREATION: FAILED - Academy ID mismatch!")
                print(f"   Expected: {academy_id}")
                print(f"   Got: {created_academy_id}")
                return player_id
        else:
            print(f"❌ Player creation failed: {response.status_code}")
            if response.text:
                print(f"Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Player creation test failed: {e}")
        return None

def test_player_retrieval_api(access_token, academy_id):
    """Test player retrieval API - THIS IS LIKELY WHERE THE BUG IS"""
    print("\n=== 3. TESTING PLAYER RETRIEVAL API (CRITICAL) ===")
    
    if not access_token or not academy_id:
        print("❌ Cannot test player retrieval - missing authentication")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        
        print(f"🔍 Retrieving players for academy: {academy_id}")
        response = requests.get(f"{API_BASE_URL}/academy/players", headers=headers, timeout=10)
        print(f"Player Retrieval Status Code: {response.status_code}")
        
        if response.status_code == 200:
            players = response.json()
            print(f"✅ Player retrieval API responded successfully")
            print(f"   Number of players returned: {len(players)}")
            
            if len(players) > 0:
                print("✅ PLAYERS FOUND - Displaying player details:")
                for i, player in enumerate(players, 1):
                    print(f"   Player {i}:")
                    print(f"     ID: {player.get('id')}")
                    print(f"     Name: {player.get('first_name')} {player.get('last_name')}")
                    print(f"     Academy ID: {player.get('academy_id')}")
                    print(f"     Sport: {player.get('sport')}")
                    print(f"     Position: {player.get('position')}")
                    print(f"     Registration Number: {player.get('registration_number')}")
                    print(f"     Status: {player.get('status')}")
                    print(f"     Created At: {player.get('created_at')}")
                
                print("✅ PLAYER RETRIEVAL: PASSED - Players are being returned")
                return True
            else:
                print("❌ PLAYER RETRIEVAL: CRITICAL ISSUE - NO PLAYERS RETURNED!")
                print("   This is likely the root cause of the display issue")
                return False
        else:
            print(f"❌ Player retrieval failed: {response.status_code}")
            if response.text:
                print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Player retrieval test failed: {e}")
        return False

def test_academy_stats_api(access_token, academy_id):
    """Test academy stats API to see if player count is correct"""
    print("\n=== 4. TESTING ACADEMY STATS API ===")
    
    if not access_token or not academy_id:
        print("❌ Cannot test academy stats - missing authentication")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        
        print(f"📊 Getting academy stats for: {academy_id}")
        response = requests.get(f"{API_BASE_URL}/academy/stats", headers=headers, timeout=10)
        print(f"Academy Stats Status Code: {response.status_code}")
        
        if response.status_code == 200:
            stats = response.json()
            print("✅ Academy stats retrieved successfully")
            print(f"   Total Players: {stats.get('total_players')}")
            print(f"   Active Players: {stats.get('active_players')}")
            print(f"   Player Limit: {stats.get('player_limit')}")
            print(f"   Total Coaches: {stats.get('total_coaches')}")
            print(f"   Active Coaches: {stats.get('active_coaches')}")
            print(f"   Coach Limit: {stats.get('coach_limit')}")
            
            # Check if stats show players but retrieval doesn't
            total_players = stats.get('total_players', 0)
            if total_players > 0:
                print(f"✅ ACADEMY STATS: Shows {total_players} players exist")
                return True
            else:
                print("❌ ACADEMY STATS: Shows 0 players")
                return False
        else:
            print(f"❌ Academy stats failed: {response.status_code}")
            if response.text:
                print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Academy stats test failed: {e}")
        return False

def test_data_isolation_check(access_token, academy_id):
    """Test data isolation to ensure academy_id filtering is working correctly"""
    print("\n=== 5. TESTING DATA ISOLATION ===")
    
    if not access_token or not academy_id:
        print("❌ Cannot test data isolation - missing authentication")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Test with a different academy user if available
        print(f"🔒 Testing data isolation for academy: {academy_id}")
        
        # First, let's see what happens if we try to access a specific player
        # We'll create another player first
        player_data = {
            "first_name": "Isolation",
            "last_name": "TestPlayer",
            "email": "isolation.player@test.com",
            "gender": "Female",
            "sport": "Basketball",
            "position": "Point Guard",
            "registration_number": "ISO001"
        }
        
        print("🏃 Creating isolation test player...")
        create_response = requests.post(f"{API_BASE_URL}/academy/players", json=player_data, headers=headers, timeout=10)
        
        if create_response.status_code == 200:
            created_player = create_response.json()
            player_id = created_player.get('id')
            print(f"✅ Isolation test player created: {player_id}")
            
            # Now try to retrieve this specific player
            get_response = requests.get(f"{API_BASE_URL}/academy/players/{player_id}", headers=headers, timeout=10)
            
            if get_response.status_code == 200:
                retrieved_player = get_response.json()
                retrieved_academy_id = retrieved_player.get('academy_id')
                
                print(f"✅ Individual player retrieval works")
                print(f"   Player Academy ID: {retrieved_academy_id}")
                print(f"   Expected Academy ID: {academy_id}")
                
                if retrieved_academy_id == academy_id:
                    print("✅ DATA ISOLATION: PASSED - Academy ID linkage correct")
                    return True
                else:
                    print("❌ DATA ISOLATION: FAILED - Academy ID mismatch")
                    return False
            else:
                print(f"❌ Individual player retrieval failed: {get_response.status_code}")
                return False
        else:
            print(f"❌ Failed to create isolation test player: {create_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Data isolation test failed: {e}")
        return False

def main():
    """Main test function to debug player display issue"""
    print("🚀 STARTING PLAYER DISPLAY ISSUE DEBUG")
    
    # Step 1: Test academy user authentication
    access_token, academy_id = test_academy_user_authentication()
    
    if not access_token or not academy_id:
        print("\n❌ CRITICAL: Cannot proceed without valid authentication")
        return False
    
    # Step 2: Test player creation
    created_player_id = test_player_creation_api(access_token, academy_id)
    
    # Step 3: Test player retrieval (CRITICAL TEST)
    retrieval_success = test_player_retrieval_api(access_token, academy_id)
    
    # Step 4: Test academy stats
    stats_success = test_academy_stats_api(access_token, academy_id)
    
    # Step 5: Test data isolation
    isolation_success = test_data_isolation_check(access_token, academy_id)
    
    # Summary
    print("\n" + "=" * 60)
    print("🔍 PLAYER DISPLAY ISSUE DEBUG SUMMARY")
    print("=" * 60)
    
    print(f"✅ Academy Authentication: {'PASSED' if access_token else 'FAILED'}")
    print(f"✅ Player Creation: {'PASSED' if created_player_id else 'FAILED'}")
    print(f"🔍 Player Retrieval: {'PASSED' if retrieval_success else 'FAILED - ROOT CAUSE!'}")
    print(f"📊 Academy Stats: {'PASSED' if stats_success else 'FAILED'}")
    print(f"🔒 Data Isolation: {'PASSED' if isolation_success else 'FAILED'}")
    
    if not retrieval_success:
        print("\n🚨 ROOT CAUSE IDENTIFIED:")
        print("   The GET /api/academy/players endpoint is not returning players")
        print("   even though they are being created successfully.")
        print("   This explains why players show in stats but not in the players tab.")
        
        if stats_success:
            print("\n💡 ADDITIONAL EVIDENCE:")
            print("   Academy stats show players exist, confirming they are being created")
            print("   but the retrieval API is not finding/returning them.")
    
    return retrieval_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)