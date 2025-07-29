#!/usr/bin/env python3
"""
Backend API Testing for Track My Academy
Tests all API endpoints with proper authentication and role-based access control
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class TrackMyAcademyAPITester:
    def __init__(self, base_url: str = "http://localhost:8001"):
        self.base_url = base_url
        self.tokens = {}  # Store tokens for different users
        self.test_data = {}  # Store created test data
        self.tests_run = 0
        self.tests_passed = 0
        
        # Demo account credentials
        self.demo_accounts = {
            "admin": {"email": "admin@academy.com", "password": "password123"},
            "coach": {"email": "coach@academy.com", "password": "password123"},
            "student": {"email": "student@academy.com", "password": "password123"}
        }

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def make_request(self, method: str, endpoint: str, data: Any = None, 
                    token: str = None, expected_status: int = 200) -> tuple[bool, Dict]:
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                if endpoint.endswith('/token'):
                    # Special handling for login endpoint (form data)
                    form_data = {'username': data['username'], 'password': data['password']}
                    response = requests.post(url, data=form_data, timeout=10)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, {"error": f"Unsupported method: {method}"}
            
            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}
            
            return success, response_data
            
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}

    def test_health_check(self) -> bool:
        """Test health endpoint"""
        success, response = self.make_request('GET', '/api/health')
        return self.log_test("Health Check", success, 
                           f"- Status: {response.get('status', 'unknown')}")

    def test_login(self, role: str) -> bool:
        """Test login for specific role"""
        if role not in self.demo_accounts:
            return self.log_test(f"Login {role}", False, "- Invalid role")
        
        account = self.demo_accounts[role]
        success, response = self.make_request('POST', '/api/token', 
                                            {'username': account['email'], 'password': account['password']})
        
        if success and 'access_token' in response:
            self.tokens[role] = response['access_token']
            return self.log_test(f"Login {role}", True, f"- Token received")
        else:
            return self.log_test(f"Login {role}", False, f"- {response}")

    def test_get_current_user(self, role: str) -> bool:
        """Test getting current user info"""
        if role not in self.tokens:
            return self.log_test(f"Get Current User {role}", False, "- No token available")
        
        success, response = self.make_request('GET', '/api/users/me', token=self.tokens[role])
        
        if success and response.get('role') == role:
            return self.log_test(f"Get Current User {role}", True, 
                               f"- User: {response.get('name', 'unknown')}")
        else:
            return self.log_test(f"Get Current User {role}", False, f"- {response}")

    def test_get_academies(self, role: str) -> bool:
        """Test getting academies for different roles"""
        if role not in self.tokens:
            return self.log_test(f"Get Academies {role}", False, "- No token available")
        
        success, response = self.make_request('GET', '/api/academies', token=self.tokens[role])
        
        if success:
            academies_count = len(response) if isinstance(response, list) else 0
            if role == 'admin' and academies_count > 0:
                self.test_data['academy_id'] = response[0]['academy_id']
            return self.log_test(f"Get Academies {role}", True, 
                               f"- Found {academies_count} academies")
        else:
            return self.log_test(f"Get Academies {role}", False, f"- {response}")

    def test_create_academy(self) -> bool:
        """Test creating academy (admin only)"""
        if 'admin' not in self.tokens:
            return self.log_test("Create Academy", False, "- No admin token")
        
        academy_data = {
            "academy_name": f"Test Academy {datetime.now().strftime('%H%M%S')}",
            "academy_location": "Test City",
            "academy_logo_url": "https://example.com/logo.png",
            "admin_email": self.demo_accounts['admin']['email']
        }
        
        success, response = self.make_request('POST', '/api/academies', 
                                            academy_data, token=self.tokens['admin'], 
                                            expected_status=200)
        
        if success and 'academy_id' in response:
            self.test_data['test_academy_id'] = response['academy_id']
            return self.log_test("Create Academy", True, 
                               f"- Academy ID: {response['academy_id']}")
        else:
            return self.log_test("Create Academy", False, f"- {response}")

    def test_get_coaches(self, role: str) -> bool:
        """Test getting coaches for different roles"""
        if role not in self.tokens:
            return self.log_test(f"Get Coaches {role}", False, "- No token available")
        
        success, response = self.make_request('GET', '/api/coaches', token=self.tokens[role])
        
        if success:
            coaches_count = len(response) if isinstance(response, list) else 0
            if coaches_count > 0 and 'coach_id' not in self.test_data:
                self.test_data['coach_id'] = response[0]['coach_id']
            return self.log_test(f"Get Coaches {role}", True, 
                               f"- Found {coaches_count} coaches")
        else:
            return self.log_test(f"Get Coaches {role}", False, f"- {response}")

    def test_create_coach(self) -> bool:
        """Test creating coach (admin only)"""
        if 'admin' not in self.tokens:
            return self.log_test("Create Coach", False, "- No admin token")
        
        academy_id = self.test_data.get('academy_id') or self.test_data.get('test_academy_id')
        if not academy_id:
            return self.log_test("Create Coach", False, "- No academy ID available")
        
        coach_data = {
            "name": f"Test Coach {datetime.now().strftime('%H%M%S')}",
            "email": f"testcoach{datetime.now().strftime('%H%M%S')}@academy.com",
            "password": "testpass123",
            "specialization": "Basketball",
            "profile_pic": "https://example.com/coach.jpg",
            "bio": "Test coach bio",
            "academy_id": academy_id
        }
        
        success, response = self.make_request('POST', '/api/coaches', 
                                            coach_data, token=self.tokens['admin'])
        
        if success and 'coach_id' in response:
            self.test_data['test_coach_id'] = response['coach_id']
            return self.log_test("Create Coach", True, 
                               f"- Coach ID: {response['coach_id']}")
        else:
            return self.log_test("Create Coach", False, f"- {response}")

    def test_get_students(self, role: str) -> bool:
        """Test getting students for different roles"""
        if role not in self.tokens:
            return self.log_test(f"Get Students {role}", False, "- No token available")
        
        success, response = self.make_request('GET', '/api/students', token=self.tokens[role])
        
        if success:
            students_count = len(response) if isinstance(response, list) else 0
            if students_count > 0 and 'student_id' not in self.test_data:
                self.test_data['student_id'] = response[0]['student_id']
            return self.log_test(f"Get Students {role}", True, 
                               f"- Found {students_count} students")
        else:
            return self.log_test(f"Get Students {role}", False, f"- {response}")

    def test_create_student(self) -> bool:
        """Test creating student (admin only)"""
        if 'admin' not in self.tokens:
            return self.log_test("Create Student", False, "- No admin token")
        
        academy_id = self.test_data.get('academy_id') or self.test_data.get('test_academy_id')
        if not academy_id:
            return self.log_test("Create Student", False, "- No academy ID available")
        
        student_data = {
            "name": f"Test Student {datetime.now().strftime('%H%M%S')}",
            "email": f"teststudent{datetime.now().strftime('%H%M%S')}@academy.com",
            "password": "testpass123",
            "age": 16,
            "parent_contact": "+1234567890",
            "enrolled_program": "Junior Basketball",
            "performance_score": 7.5,
            "photo": "https://example.com/student.jpg",
            "academy_id": academy_id,
            "assigned_coaches": []
        }
        
        success, response = self.make_request('POST', '/api/students', 
                                            student_data, token=self.tokens['admin'])
        
        if success and 'student_id' in response:
            self.test_data['test_student_id'] = response['student_id']
            return self.log_test("Create Student", True, 
                               f"- Student ID: {response['student_id']}")
        else:
            return self.log_test("Create Student", False, f"- {response}")

    def test_assign_coach_to_student(self) -> bool:
        """Test assigning coach to student (admin only)"""
        if 'admin' not in self.tokens:
            return self.log_test("Assign Coach to Student", False, "- No admin token")
        
        student_id = self.test_data.get('student_id') or self.test_data.get('test_student_id')
        coach_id = self.test_data.get('coach_id') or self.test_data.get('test_coach_id')
        
        if not student_id or not coach_id:
            return self.log_test("Assign Coach to Student", False, 
                               "- Missing student or coach ID")
        
        success, response = self.make_request('POST', 
                                            f'/api/students/{student_id}/assign-coach/{coach_id}',
                                            token=self.tokens['admin'])
        
        if success:
            return self.log_test("Assign Coach to Student", True, 
                               f"- Assignment successful")
        else:
            return self.log_test("Assign Coach to Student", False, f"- {response}")

    def test_unauthorized_access(self) -> bool:
        """Test that endpoints properly reject unauthorized access"""
        success, response = self.make_request('GET', '/api/users/me', expected_status=401)
        return self.log_test("Unauthorized Access", success, "- Properly rejected")

    def run_all_tests(self) -> bool:
        """Run comprehensive test suite"""
        print("🚀 Starting Track My Academy API Tests")
        print("=" * 50)
        
        # Basic connectivity
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False
        
        # Test unauthorized access
        self.test_unauthorized_access()
        
        # Authentication tests
        print("\n📝 Testing Authentication...")
        for role in ['admin', 'coach', 'student']:
            if not self.test_login(role):
                print(f"❌ Login failed for {role} - continuing with other tests")
                continue
            self.test_get_current_user(role)
        
        # Academy tests
        print("\n🏫 Testing Academy Operations...")
        for role in ['admin', 'coach', 'student']:
            if role in self.tokens:
                self.test_get_academies(role)
        
        if 'admin' in self.tokens:
            self.test_create_academy()
        
        # Coach tests
        print("\n👨‍🏫 Testing Coach Operations...")
        for role in ['admin', 'coach', 'student']:
            if role in self.tokens:
                self.test_get_coaches(role)
        
        if 'admin' in self.tokens:
            self.test_create_coach()
        
        # Student tests
        print("\n👨‍🎓 Testing Student Operations...")
        for role in ['admin', 'coach', 'student']:
            if role in self.tokens:
                self.test_get_students(role)
        
        if 'admin' in self.tokens:
            self.test_create_student()
            self.test_assign_coach_to_student()
        
        # Final results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    """Main test runner"""
    # Check if we should use the public endpoint
    import os
    backend_url = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')
    
    print(f"Testing backend at: {backend_url}")
    
    tester = TrackMyAcademyAPITester(backend_url)
    success = tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())