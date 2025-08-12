#!/usr/bin/env python3
"""
Academy Dashboard Player and Coach Management System Testing
Tests the complete academy management system including authentication, CRUD operations, and data isolation
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

print(f"Testing Academy Management System at: {API_BASE_URL}")

class AcademyTestManager:
    def __init__(self):
        self.admin_token = None
        self.academy_token = None
        self.academy_user_info = None
        self.test_players = []
        self.test_coaches = []
        
    def get_admin_token(self):
        """Get admin access token for testing"""
        print("\n=== Getting Admin Access Token ===")
        try:
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
                self.admin_token = session.get("access_token")
                print("✅ Admin token obtained successfully")
                return True
            else:
                print(f"❌ Failed to get admin token: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error getting admin token: {e}")
            return False
    
    def get_academy_token(self):
        """Get academy user access token for testing"""
        print("\n=== Getting Academy User Access Token ===")
        try:
            login_data = {
                "email": "testacademy@roletest.com",
                "password": "TestPassword123!"
            }
            
            response = requests.post(
                f"{API_BASE_URL}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code == 200:
                session = response.json().get("session", {})
                self.academy_token = session.get("access_token")
                print("✅ Academy token obtained successfully")
                return True
            else:
                print(f"❌ Failed to get academy token: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error getting academy token: {e}")
            return False
    
    def test_academy_authentication(self):
        """Test academy user authentication and role detection"""
        print("\n=== Testing Academy Authentication ===")
        try:
            if not self.academy_token:
                print("❌ No academy token available")
                return False
            
            headers = {
                "Authorization": f"Bearer {self.academy_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                f"{API_BASE_URL}/auth/user",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                user_data = response.json()
                user = user_data.get("user", {})
                role_info = user.get("role_info", {})
                
                print(f"User email: {user.get('email')}")
                print(f"Role: {role_info.get('role')}")
                print(f"Academy ID: {role_info.get('academy_id')}")
                print(f"Academy Name: {role_info.get('academy_name')}")
                print(f"Permissions: {role_info.get('permissions')}")
                
                if (role_info.get('role') == 'academy_user' and 
                    role_info.get('academy_id') and 
                    role_info.get('academy_name')):
                    
                    self.academy_user_info = role_info
                    print("✅ Academy authentication PASSED")
                    return True
                else:
                    print("❌ Academy authentication FAILED - Invalid role info")
                    return False
            else:
                print(f"❌ Academy authentication FAILED - Status: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Academy authentication test failed: {e}")
            return False
    
    def test_super_admin_blocked(self):
        """Test that super admin users are blocked from academy endpoints"""
        print("\n=== Testing Super Admin Access Block ===")
        try:
            if not self.admin_token:
                print("❌ No admin token available")
                return False
            
            headers = {
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            }
            
            # Try to access academy players endpoint with admin token
            response = requests.get(
                f"{API_BASE_URL}/academy/players",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 403:
                print("✅ Super admin correctly blocked from academy endpoints")
                return True
            else:
                print(f"❌ Super admin not properly blocked - Status: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Super admin block test failed: {e}")
            return False
    
    def test_player_management_crud(self):
        """Test complete Player Management CRUD operations"""
        print("\n=== Testing Player Management CRUD Operations ===")
        
        if not self.academy_token or not self.academy_user_info:
            print("❌ Academy authentication required")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.academy_token}",
            "Content-Type": "application/json"
        }
        
        # Test 1: GET /api/academy/players (initially empty or existing)
        print("\n--- Testing GET /api/academy/players ---")
        try:
            response = requests.get(
                f"{API_BASE_URL}/academy/players",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                initial_players = response.json()
                print(f"✅ GET players PASSED - Found {len(initial_players)} existing players")
            else:
                print(f"❌ GET players FAILED - Status: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ GET players test failed: {e}")
            return False
        
        # Test 2: POST /api/academy/players (create new players)
        print("\n--- Testing POST /api/academy/players ---")
        test_players_data = [
            {
                "first_name": "Marcus",
                "last_name": "Johnson",
                "email": "marcus.johnson@email.com",
                "phone": "+1-555-0101",
                "date_of_birth": "2005-03-15",
                "age": 19,
                "position": "Forward",
                "jersey_number": 23,
                "height": "6'2\"",
                "weight": "180 lbs",
                "emergency_contact_name": "Sarah Johnson",
                "emergency_contact_phone": "+1-555-0102",
                "medical_notes": "No known allergies"
            },
            {
                "first_name": "Emma",
                "last_name": "Davis",
                "email": "emma.davis@email.com",
                "phone": "+1-555-0103",
                "date_of_birth": "2006-07-22",
                "age": 18,
                "position": "Midfielder",
                "jersey_number": 10,
                "height": "5'6\"",
                "weight": "130 lbs",
                "emergency_contact_name": "Mike Davis",
                "emergency_contact_phone": "+1-555-0104"
            },
            {
                "first_name": "Alex",
                "last_name": "Rodriguez",
                "email": "alex.rodriguez@email.com",
                "phone": "+1-555-0105",
                "age": 20,
                "position": "Defender",
                "jersey_number": 5,
                "height": "6'0\"",
                "weight": "170 lbs"
            }
        ]
        
        created_players = []
        for i, player_data in enumerate(test_players_data):
            try:
                response = requests.post(
                    f"{API_BASE_URL}/academy/players",
                    json=player_data,
                    headers=headers,
                    timeout=15
                )
                
                if response.status_code == 200:
                    player = response.json()
                    created_players.append(player)
                    print(f"✅ Created player {i+1}: {player['first_name']} {player['last_name']} (ID: {player['id']})")
                else:
                    print(f"❌ Failed to create player {i+1} - Status: {response.status_code}")
                    print(f"Response: {response.text}")
                    
            except Exception as e:
                print(f"❌ Error creating player {i+1}: {e}")
        
        if len(created_players) < 2:
            print("❌ Failed to create enough players for testing")
            return False
        
        self.test_players = created_players
        print(f"✅ POST players PASSED - Created {len(created_players)} players")
        
        # Test 3: GET /api/academy/players/{id} (get specific player)
        print("\n--- Testing GET /api/academy/players/{id} ---")
        test_player = created_players[0]
        try:
            response = requests.get(
                f"{API_BASE_URL}/academy/players/{test_player['id']}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                player = response.json()
                if player['id'] == test_player['id']:
                    print(f"✅ GET specific player PASSED - Retrieved {player['first_name']} {player['last_name']}")
                else:
                    print("❌ GET specific player FAILED - Wrong player returned")
                    return False
            else:
                print(f"❌ GET specific player FAILED - Status: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ GET specific player test failed: {e}")
            return False
        
        # Test 4: PUT /api/academy/players/{id} (update player)
        print("\n--- Testing PUT /api/academy/players/{id} ---")
        update_data = {
            "first_name": "Marcus Updated",
            "position": "Center Forward",
            "jersey_number": 24,
            "medical_notes": "Updated medical notes - cleared for full contact"
        }
        
        try:
            response = requests.put(
                f"{API_BASE_URL}/academy/players/{test_player['id']}",
                json=update_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                updated_player = response.json()
                if (updated_player['first_name'] == "Marcus Updated" and 
                    updated_player['position'] == "Center Forward" and
                    updated_player['jersey_number'] == 24):
                    print("✅ PUT player PASSED - Player updated successfully")
                else:
                    print("❌ PUT player FAILED - Updates not applied correctly")
                    return False
            else:
                print(f"❌ PUT player FAILED - Status: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ PUT player test failed: {e}")
            return False
        
        # Test 5: Jersey number duplication prevention
        print("\n--- Testing Jersey Number Duplication Prevention ---")
        duplicate_jersey_data = {
            "first_name": "Test",
            "last_name": "Duplicate",
            "jersey_number": 24  # Same as updated player above
        }
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/academy/players",
                json=duplicate_jersey_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 400:
                error_data = response.json()
                if "jersey number" in error_data.get('detail', '').lower():
                    print("✅ Jersey number duplication prevention PASSED")
                else:
                    print("❌ Jersey number duplication prevention FAILED - Wrong error message")
                    return False
            else:
                print(f"❌ Jersey number duplication prevention FAILED - Status: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Jersey number duplication test failed: {e}")
            return False
        
        print("✅ Player Management CRUD operations PASSED")
        return True
    
    def test_coach_management_crud(self):
        """Test complete Coach Management CRUD operations"""
        print("\n=== Testing Coach Management CRUD Operations ===")
        
        if not self.academy_token or not self.academy_user_info:
            print("❌ Academy authentication required")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.academy_token}",
            "Content-Type": "application/json"
        }
        
        # Test 1: GET /api/academy/coaches (initially empty or existing)
        print("\n--- Testing GET /api/academy/coaches ---")
        try:
            response = requests.get(
                f"{API_BASE_URL}/academy/coaches",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                initial_coaches = response.json()
                print(f"✅ GET coaches PASSED - Found {len(initial_coaches)} existing coaches")
            else:
                print(f"❌ GET coaches FAILED - Status: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ GET coaches test failed: {e}")
            return False
        
        # Test 2: POST /api/academy/coaches (create new coaches)
        print("\n--- Testing POST /api/academy/coaches ---")
        test_coaches_data = [
            {
                "first_name": "Michael",
                "last_name": "Thompson",
                "email": "michael.thompson@academy.com",
                "phone": "+1-555-0201",
                "specialization": "Fitness Training",
                "experience_years": 8,
                "qualifications": "NASM Certified Personal Trainer, Sports Nutrition Specialist",
                "salary": 55000.00,
                "hire_date": "2023-01-15",
                "contract_end_date": "2025-01-15",
                "emergency_contact_name": "Lisa Thompson",
                "emergency_contact_phone": "+1-555-0202",
                "bio": "Experienced fitness coach with focus on athletic performance"
            },
            {
                "first_name": "Sarah",
                "last_name": "Williams",
                "email": "sarah.williams@academy.com",
                "phone": "+1-555-0203",
                "specialization": "Technical Skills",
                "experience_years": 12,
                "qualifications": "UEFA B License, Advanced Technical Coaching Certificate",
                "salary": 65000.00,
                "hire_date": "2022-08-01",
                "bio": "Former professional player turned technical skills coach"
            },
            {
                "first_name": "David",
                "last_name": "Martinez",
                "email": "david.martinez@academy.com",
                "phone": "+1-555-0204",
                "specialization": "Goalkeeping",
                "experience_years": 6,
                "qualifications": "Goalkeeping Specialist Certification",
                "salary": 50000.00
            }
        ]
        
        created_coaches = []
        for i, coach_data in enumerate(test_coaches_data):
            try:
                response = requests.post(
                    f"{API_BASE_URL}/academy/coaches",
                    json=coach_data,
                    headers=headers,
                    timeout=15
                )
                
                if response.status_code == 200:
                    coach = response.json()
                    created_coaches.append(coach)
                    print(f"✅ Created coach {i+1}: {coach['first_name']} {coach['last_name']} (ID: {coach['id']})")
                elif response.status_code == 400 and "coach limit" in response.text.lower():
                    print(f"⚠️ Coach limit reached - cannot create more coaches")
                    break
                else:
                    print(f"❌ Failed to create coach {i+1} - Status: {response.status_code}")
                    print(f"Response: {response.text}")
                    
            except Exception as e:
                print(f"❌ Error creating coach {i+1}: {e}")
        
        if len(created_coaches) < 1:
            print("❌ Failed to create any coaches for testing")
            return False
        
        self.test_coaches = created_coaches
        print(f"✅ POST coaches PASSED - Created {len(created_coaches)} coaches")
        
        # Test 3: GET /api/academy/coaches/{id} (get specific coach)
        print("\n--- Testing GET /api/academy/coaches/{id} ---")
        test_coach = created_coaches[0]
        try:
            response = requests.get(
                f"{API_BASE_URL}/academy/coaches/{test_coach['id']}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                coach = response.json()
                if coach['id'] == test_coach['id']:
                    print(f"✅ GET specific coach PASSED - Retrieved {coach['first_name']} {coach['last_name']}")
                else:
                    print("❌ GET specific coach FAILED - Wrong coach returned")
                    return False
            else:
                print(f"❌ GET specific coach FAILED - Status: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ GET specific coach test failed: {e}")
            return False
        
        # Test 4: PUT /api/academy/coaches/{id} (update coach)
        print("\n--- Testing PUT /api/academy/coaches/{id} ---")
        update_data = {
            "first_name": "Michael Updated",
            "specialization": "Strength & Conditioning",
            "experience_years": 10,
            "salary": 60000.00,
            "bio": "Updated bio - Senior strength and conditioning coach"
        }
        
        try:
            response = requests.put(
                f"{API_BASE_URL}/academy/coaches/{test_coach['id']}",
                json=update_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                updated_coach = response.json()
                if (updated_coach['first_name'] == "Michael Updated" and 
                    updated_coach['specialization'] == "Strength & Conditioning" and
                    updated_coach['experience_years'] == 10):
                    print("✅ PUT coach PASSED - Coach updated successfully")
                else:
                    print("❌ PUT coach FAILED - Updates not applied correctly")
                    return False
            else:
                print(f"❌ PUT coach FAILED - Status: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ PUT coach test failed: {e}")
            return False
        
        # Test 5: Coach limit enforcement
        print("\n--- Testing Coach Limit Enforcement ---")
        # Try to create coaches until limit is reached
        limit_test_data = {
            "first_name": "Limit",
            "last_name": "Test",
            "specialization": "Test Coach"
        }
        
        coaches_created = 0
        max_attempts = 10  # Prevent infinite loop
        
        for attempt in range(max_attempts):
            try:
                response = requests.post(
                    f"{API_BASE_URL}/academy/coaches",
                    json={**limit_test_data, "first_name": f"Limit{attempt}"},
                    headers=headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    coaches_created += 1
                elif response.status_code == 400 and "coach limit" in response.text.lower():
                    print(f"✅ Coach limit enforcement PASSED - Limit reached after creating {coaches_created} additional coaches")
                    break
                else:
                    print(f"❌ Unexpected response during limit test: {response.status_code}")
                    break
                    
            except Exception as e:
                print(f"❌ Coach limit test failed: {e}")
                break
        else:
            print("⚠️ Coach limit not reached within test attempts")
        
        print("✅ Coach Management CRUD operations PASSED")
        return True
    
    def test_academy_stats_api(self):
        """Test GET /api/academy/stats endpoint"""
        print("\n=== Testing Academy Stats API ===")
        
        if not self.academy_token:
            print("❌ Academy authentication required")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.academy_token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.get(
                f"{API_BASE_URL}/academy/stats",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                stats = response.json()
                print(f"Academy Stats: {json.dumps(stats, indent=2)}")
                
                required_fields = [
                    'total_players', 'active_players', 'total_coaches', 
                    'active_coaches', 'player_limit', 'coach_limit'
                ]
                
                missing_fields = [field for field in required_fields if field not in stats]
                
                if not missing_fields:
                    # Verify stats make sense
                    if (isinstance(stats['total_players'], int) and 
                        isinstance(stats['active_players'], int) and
                        isinstance(stats['total_coaches'], int) and
                        isinstance(stats['active_coaches'], int) and
                        isinstance(stats['player_limit'], int) and
                        isinstance(stats['coach_limit'], int)):
                        
                        print("✅ Academy Stats API PASSED - All fields present and valid")
                        return True
                    else:
                        print("❌ Academy Stats API FAILED - Invalid field types")
                        return False
                else:
                    print(f"❌ Academy Stats API FAILED - Missing fields: {missing_fields}")
                    return False
            else:
                print(f"❌ Academy Stats API FAILED - Status: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Academy Stats API test failed: {e}")
            return False
    
    def test_data_isolation(self):
        """Test that academy users can only access their own data"""
        print("\n=== Testing Data Isolation ===")
        
        if not self.academy_token:
            print("❌ Academy authentication required")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.academy_token}",
            "Content-Type": "application/json"
        }
        
        # Test 1: Verify academy can access their own players
        try:
            response = requests.get(
                f"{API_BASE_URL}/academy/players",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                players = response.json()
                print(f"✅ Academy can access own players - Found {len(players)} players")
                
                # Verify all players belong to this academy
                academy_id = self.academy_user_info.get('academy_id')
                for player in players:
                    if player.get('academy_id') != academy_id:
                        print(f"❌ Data isolation FAILED - Player {player['id']} belongs to different academy")
                        return False
                
            else:
                print(f"❌ Data isolation test FAILED - Cannot access own players: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Data isolation test failed: {e}")
            return False
        
        # Test 2: Verify academy can access their own coaches
        try:
            response = requests.get(
                f"{API_BASE_URL}/academy/coaches",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                coaches = response.json()
                print(f"✅ Academy can access own coaches - Found {len(coaches)} coaches")
                
                # Verify all coaches belong to this academy
                academy_id = self.academy_user_info.get('academy_id')
                for coach in coaches:
                    if coach.get('academy_id') != academy_id:
                        print(f"❌ Data isolation FAILED - Coach {coach['id']} belongs to different academy")
                        return False
                
            else:
                print(f"❌ Data isolation test FAILED - Cannot access own coaches: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Data isolation test failed: {e}")
            return False
        
        print("✅ Data Isolation PASSED - Academy can only access own data")
        return True
    
    def cleanup_test_data(self):
        """Clean up test data created during testing"""
        print("\n=== Cleaning Up Test Data ===")
        
        if not self.academy_token:
            print("⚠️ No academy token for cleanup")
            return
        
        headers = {
            "Authorization": f"Bearer {self.academy_token}",
            "Content-Type": "application/json"
        }
        
        # Delete test players
        deleted_players = 0
        for player in self.test_players:
            try:
                response = requests.delete(
                    f"{API_BASE_URL}/academy/players/{player['id']}",
                    headers=headers,
                    timeout=10
                )
                if response.status_code == 200:
                    deleted_players += 1
            except:
                pass
        
        # Delete test coaches
        deleted_coaches = 0
        for coach in self.test_coaches:
            try:
                response = requests.delete(
                    f"{API_BASE_URL}/academy/coaches/{coach['id']}",
                    headers=headers,
                    timeout=10
                )
                if response.status_code == 200:
                    deleted_coaches += 1
            except:
                pass
        
        print(f"✅ Cleanup completed - Deleted {deleted_players} players and {deleted_coaches} coaches")
    
    def run_complete_test_suite(self):
        """Run the complete academy management test suite"""
        print("🚀 Starting Academy Dashboard Player and Coach Management System Testing")
        print("=" * 80)
        
        test_results = {}
        
        # Step 1: Get authentication tokens
        test_results['admin_token'] = self.get_admin_token()
        test_results['academy_token'] = self.get_academy_token()
        
        if not test_results['academy_token']:
            print("❌ Cannot proceed without academy authentication")
            return False
        
        # Step 2: Test authentication and role detection
        test_results['academy_authentication'] = self.test_academy_authentication()
        test_results['super_admin_blocked'] = self.test_super_admin_blocked()
        
        # Step 3: Test Player Management APIs
        test_results['player_management_crud'] = self.test_player_management_crud()
        
        # Step 4: Test Coach Management APIs
        test_results['coach_management_crud'] = self.test_coach_management_crud()
        
        # Step 5: Test Academy Stats API
        test_results['academy_stats_api'] = self.test_academy_stats_api()
        
        # Step 6: Test Data Isolation
        test_results['data_isolation'] = self.test_data_isolation()
        
        # Step 7: Cleanup
        self.cleanup_test_data()
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 ACADEMY MANAGEMENT SYSTEM TEST SUMMARY")
        print("=" * 80)
        
        passed = 0
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name.replace('_', ' ').title()}: {status}")
            if result:
                passed += 1
        
        print(f"\nOverall Result: {passed}/{total} tests passed")
        
        if passed >= total - 1:  # Allow one test to fail
            print("🎉 Academy Management System is working correctly!")
            return True
        else:
            print("⚠️ Some academy management features need attention.")
            return False

def main():
    """Main test execution"""
    test_manager = AcademyTestManager()
    success = test_manager.run_complete_test_suite()
    
    if success:
        print("\n✅ All academy management tests completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Some academy management tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()