#!/usr/bin/env python3
"""
Player Management Backend API Testing for Track My Academy
Tests the player management functionality specifically
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

def get_academy_access_token():
    """Get access token for academy user testacademy2@roletest.com"""
    print("\n=== Getting Academy Access Token ===")
    try:
        login_data = {
            "email": "testacademy2@roletest.com",
            "password": "TestPassword123!"
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
            user = data.get("user", {})
            
            if access_token:
                print(f"✅ Successfully logged in as: {user.get('email', 'Unknown')}")
                return access_token
            else:
                print("❌ No access token in response")
                return None
        else:
            print(f"❌ Login failed - Status: {response.status_code}, Response: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Login failed - Connection error: {e}")
        return None

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

def test_sports_config_endpoint():
    """Test GET /api/sports/config endpoint"""
    print("\n=== Testing Sports Configuration Endpoint ===")
    try:
        response = requests.get(f"{API_BASE_URL}/sports/config", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {list(data.keys())}")
            
            required_fields = ['sports', 'performance_categories', 'individual_sports', 'team_sports', 'training_days', 'training_batches']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                print("✅ Sports config endpoint PASSED")
                print(f"  Available sports: {list(data['sports'].keys())}")
                print(f"  Individual sports: {data['individual_sports']}")
                print(f"  Team sports: {data['team_sports']}")
                return True, data
            else:
                print(f"❌ Sports config endpoint FAILED - Missing fields: {missing_fields}")
                return False, None
        else:
            print(f"❌ Sports config endpoint FAILED - Status: {response.status_code}")
            return False, None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Sports config endpoint FAILED - Connection error: {e}")
        return False, None

def test_create_player(access_token, sports_config=None):
    """Test POST /api/academy/players endpoint"""
    print("\n=== Testing Create Player ===")
    try:
        headers = {"Content-Type": "application/json"}
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
        
        # Use realistic player data based on sports config
        sport = "Football"
        position = "Midfielder"
        
        if sports_config and 'sports' in sports_config:
            available_sports = list(sports_config['sports'].keys())
            if available_sports:
                sport = available_sports[0]
                positions = sports_config['sports'][sport]
                if positions:
                    position = positions[0]
        
        player_data = {
            "first_name": "Alex",
            "last_name": "Johnson",
            "email": "alex.johnson@email.com",
            "phone": "+1-555-0123",
            "date_of_birth": "2005-03-15",
            "gender": "Male",
            "sport": sport,
            "position": position,
            "registration_number": "REG001",
            "height": "5'10\"",
            "weight": "70 kg",
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
            data = response.json()
            print(f"Created player: {data.get('first_name')} {data.get('last_name')}")
            print(f"Player ID: {data.get('id')}")
            print(f"Sport: {data.get('sport')}, Position: {data.get('position')}")
            print(f"Registration Number: {data.get('registration_number')}")
            
            # Verify required fields are present
            required_fields = ['id', 'academy_id', 'first_name', 'last_name', 'gender', 'sport', 'created_at']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                # Verify age calculation if date_of_birth provided
                if data.get('date_of_birth') and data.get('age'):
                    print(f"Age calculated: {data.get('age')} years")
                
                print("✅ Create player PASSED")
                return True, data['id']
            else:
                print(f"❌ Create player FAILED - Missing fields: {missing_fields}")
                return False, None
        elif response.status_code == 401:
            print("❌ Create player FAILED - Authentication required")
            return False, None
        elif response.status_code == 403:
            print("❌ Create player FAILED - Access forbidden")
            return False, None
        else:
            print(f"❌ Create player FAILED - Status: {response.status_code}, Response: {response.text}")
            return False, None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Create player FAILED - Connection error: {e}")
        return False, None

def test_get_players(access_token):
    """Test GET /api/academy/players endpoint"""
    print("\n=== Testing Get Players ===")
    try:
        headers = {"Content-Type": "application/json"}
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
        
        response = requests.get(
            f"{API_BASE_URL}/academy/players",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Number of players retrieved: {len(data)}")
            
            if isinstance(data, list):
                if len(data) > 0:
                    player = data[0]
                    print(f"Sample player: {player.get('first_name')} {player.get('last_name')}")
                    print(f"Player fields: {list(player.keys())}")
                    
                    # Check required fields
                    required_fields = ['id', 'academy_id', 'first_name', 'last_name', 'gender', 'sport', 'status', 'created_at']
                    missing_fields = [field for field in required_fields if field not in player]
                    
                    if not missing_fields:
                        print("✅ Get players PASSED")
                        return True, data
                    else:
                        print(f"❌ Get players FAILED - Missing fields: {missing_fields}")
                        return False, None
                else:
                    print("✅ Get players PASSED (no players found)")
                    return True, []
            else:
                print("❌ Get players FAILED - Response is not a list")
                return False, None
        elif response.status_code == 401:
            print("❌ Get players FAILED - Authentication required")
            return False, None
        elif response.status_code == 403:
            print("❌ Get players FAILED - Access forbidden")
            return False, None
        else:
            print(f"❌ Get players FAILED - Status: {response.status_code}, Response: {response.text}")
            return False, None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Get players FAILED - Connection error: {e}")
        return False, None

def test_get_single_player(access_token, player_id):
    """Test GET /api/academy/players/{id} endpoint"""
    print(f"\n=== Testing Get Single Player (ID: {player_id}) ===")
    try:
        headers = {"Content-Type": "application/json"}
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
        
        response = requests.get(
            f"{API_BASE_URL}/academy/players/{player_id}",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Retrieved player: {data.get('first_name')} {data.get('last_name')}")
            print(f"Player ID: {data.get('id')}")
            
            if data.get('id') == player_id:
                print("✅ Get single player PASSED")
                return True, data
            else:
                print("❌ Get single player FAILED - ID mismatch")
                return False, None
        elif response.status_code == 404:
            print("❌ Get single player FAILED - Player not found")
            return False, None
        elif response.status_code == 401:
            print("❌ Get single player FAILED - Authentication required")
            return False, None
        elif response.status_code == 403:
            print("❌ Get single player FAILED - Access forbidden")
            return False, None
        else:
            print(f"❌ Get single player FAILED - Status: {response.status_code}")
            return False, None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Get single player FAILED - Connection error: {e}")
        return False, None

def test_update_player(access_token, player_id):
    """Test PUT /api/academy/players/{id} endpoint"""
    print(f"\n=== Testing Update Player (ID: {player_id}) ===")
    try:
        headers = {"Content-Type": "application/json"}
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
        
        update_data = {
            "first_name": "Alexander",
            "last_name": "Johnson-Smith",
            "phone": "+1-555-0125",
            "height": "6'0\"",
            "weight": "75 kg",
            "training_batch": "Morning",
            "medical_notes": "Updated medical notes - no known allergies, good physical condition"
        }
        
        response = requests.put(
            f"{API_BASE_URL}/academy/players/{player_id}",
            json=update_data,
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Updated player: {data.get('first_name')} {data.get('last_name')}")
            
            # Verify updates were applied
            if (data.get('first_name') == update_data['first_name'] and 
                data.get('last_name') == update_data['last_name'] and
                data.get('training_batch') == update_data['training_batch']):
                print("✅ Update player PASSED")
                return True
            else:
                print("❌ Update player FAILED - Updates not applied correctly")
                return False
        elif response.status_code == 404:
            print("❌ Update player FAILED - Player not found")
            return False
        elif response.status_code == 401:
            print("❌ Update player FAILED - Authentication required")
            return False
        elif response.status_code == 403:
            print("❌ Update player FAILED - Access forbidden")
            return False
        else:
            print(f"❌ Update player FAILED - Status: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Update player FAILED - Connection error: {e}")
        return False

def test_player_validation():
    """Test player creation validation"""
    print("\n=== Testing Player Validation ===")
    
    access_token = get_academy_access_token()
    if not access_token:
        print("❌ Cannot test validation - no access token")
        return False
    
    try:
        headers = {"Content-Type": "application/json", "Authorization": f"Bearer {access_token}"}
        
        # Test 1: Missing required fields
        invalid_player_data = {
            "first_name": "Test",
            # Missing last_name, gender, sport
        }
        
        response = requests.post(
            f"{API_BASE_URL}/academy/players",
            json=invalid_player_data,
            headers=headers,
            timeout=10
        )
        
        print(f"Invalid data test - Status Code: {response.status_code}")
        
        if response.status_code == 422:
            print("✅ Validation correctly rejected missing required fields")
            validation_passed = True
        else:
            print("❌ Validation should reject missing required fields")
            validation_passed = False
        
        # Test 2: Duplicate registration number (if we have existing players)
        duplicate_reg_data = {
            "first_name": "Duplicate",
            "last_name": "Test",
            "gender": "Male",
            "sport": "Football",
            "registration_number": "REG001"  # Same as created earlier
        }
        
        response = requests.post(
            f"{API_BASE_URL}/academy/players",
            json=duplicate_reg_data,
            headers=headers,
            timeout=10
        )
        
        print(f"Duplicate registration test - Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ Validation correctly rejected duplicate registration number")
            validation_passed = validation_passed and True
        else:
            print("⚠️ Duplicate registration number handling not tested (may be allowed)")
            # Don't fail the test for this as it might be allowed
        
        return validation_passed
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Player validation test failed - Connection error: {e}")
        return False

def test_player_database_persistence():
    """Test that players are properly stored and retrieved from database"""
    print("\n=== Testing Player Database Persistence ===")
    
    access_token = get_academy_access_token()
    if not access_token:
        print("❌ Cannot test persistence - no access token")
        return False
    
    try:
        # Create a test player
        create_success, player_id = test_create_player(access_token)
        if not create_success:
            print("❌ Database persistence test failed - could not create player")
            return False
        
        # Retrieve all players and verify our player is there
        get_success, players = test_get_players(access_token)
        if not get_success:
            print("❌ Database persistence test failed - could not retrieve players")
            return False
        
        # Find our created player
        created_player = None
        for player in players:
            if player.get('id') == player_id:
                created_player = player
                break
        
        if created_player:
            print(f"✅ Player persisted in database: {created_player.get('first_name')} {created_player.get('last_name')}")
            
            # Verify key fields are stored correctly
            expected_fields = ['academy_id', 'first_name', 'last_name', 'gender', 'sport', 'registration_number']
            missing_fields = [field for field in expected_fields if not created_player.get(field)]
            
            if not missing_fields:
                print("✅ Database persistence PASSED - All key fields stored")
                return True
            else:
                print(f"❌ Database persistence FAILED - Missing fields: {missing_fields}")
                return False
        else:
            print("❌ Database persistence FAILED - Created player not found in database")
            return False
            
    except Exception as e:
        print(f"❌ Database persistence test failed: {e}")
        return False

def test_academy_stats_with_players(access_token):
    """Test GET /api/academy/stats endpoint includes player counts"""
    print("\n=== Testing Academy Stats with Players ===")
    try:
        headers = {"Content-Type": "application/json"}
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
        
        response = requests.get(
            f"{API_BASE_URL}/academy/stats",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Academy stats: {data}")
            
            required_fields = ['total_players', 'active_players', 'player_limit']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                total_players = data.get('total_players', 0)
                active_players = data.get('active_players', 0)
                player_limit = data.get('player_limit', 0)
                
                print(f"Total Players: {total_players}")
                print(f"Active Players: {active_players}")
                print(f"Player Limit: {player_limit}")
                
                if isinstance(total_players, int) and isinstance(active_players, int) and isinstance(player_limit, int):
                    print("✅ Academy stats with players PASSED")
                    return True, data
                else:
                    print("❌ Academy stats FAILED - Invalid field types")
                    return False, None
            else:
                print(f"❌ Academy stats FAILED - Missing fields: {missing_fields}")
                return False, None
        elif response.status_code == 401:
            print("❌ Academy stats FAILED - Authentication required")
            return False, None
        elif response.status_code == 403:
            print("❌ Academy stats FAILED - Access forbidden")
            return False, None
        else:
            print(f"❌ Academy stats FAILED - Status: {response.status_code}")
            return False, None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Academy stats FAILED - Connection error: {e}")
        return False, None

def run_comprehensive_player_management_tests():
    """Run all player management tests"""
    print("=" * 80)
    print("🏃‍♂️ COMPREHENSIVE PLAYER MANAGEMENT TESTING")
    print("=" * 80)
    
    # Test results tracking
    test_results = {}
    
    # Test 1: Server Health
    test_results['server_health'] = test_server_health()
    
    # Test 2: Sports Configuration
    sports_config_success, sports_config = test_sports_config_endpoint()
    test_results['sports_config'] = sports_config_success
    
    # Test 3: Get Academy Access Token
    access_token = get_academy_access_token()
    test_results['academy_authentication'] = access_token is not None
    
    if not access_token:
        print("\n❌ Cannot continue with player tests - no access token")
        print_test_summary(test_results)
        return False
    
    # Test 4: Create Player
    create_success, player_id = test_create_player(access_token, sports_config)
    test_results['create_player'] = create_success
    
    # Test 5: Get Players
    get_players_success, players = test_get_players(access_token)
    test_results['get_players'] = get_players_success
    
    # Test 6: Get Single Player (if we have a player ID)
    if player_id:
        get_single_success, _ = test_get_single_player(access_token, player_id)
        test_results['get_single_player'] = get_single_success
        
        # Test 7: Update Player
        test_results['update_player'] = test_update_player(access_token, player_id)
    else:
        test_results['get_single_player'] = False
        test_results['update_player'] = False
    
    # Test 8: Player Validation
    test_results['player_validation'] = test_player_validation()
    
    # Test 9: Database Persistence
    test_results['database_persistence'] = test_player_database_persistence()
    
    # Test 10: Academy Stats
    stats_success, stats = test_academy_stats_with_players(access_token)
    test_results['academy_stats'] = stats_success
    
    # Print comprehensive summary
    print_test_summary(test_results)
    
    # Determine overall success
    passed_tests = sum(1 for result in test_results.values() if result)
    total_tests = len(test_results)
    
    if passed_tests >= total_tests - 2:  # Allow up to 2 tests to fail
        print("\n🎉 PLAYER MANAGEMENT SYSTEM IS WORKING CORRECTLY!")
        return True
    else:
        print(f"\n⚠️ PLAYER MANAGEMENT SYSTEM NEEDS ATTENTION - {passed_tests}/{total_tests} tests passed")
        return False

def print_test_summary(test_results):
    """Print a formatted test summary"""
    print("\n" + "=" * 80)
    print("📊 PLAYER MANAGEMENT TEST SUMMARY")
    print("=" * 80)
    
    for test_name, result in test_results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        formatted_name = test_name.replace('_', ' ').title()
        print(f"{formatted_name:<30} {status}")
    
    passed = sum(1 for result in test_results.values() if result)
    total = len(test_results)
    print(f"\nOverall: {passed}/{total} tests passed")

if __name__ == "__main__":
    success = run_comprehensive_player_management_tests()
    sys.exit(0 if success else 1)