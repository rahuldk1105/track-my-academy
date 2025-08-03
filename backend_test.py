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
    def __init__(self, base_url: str = "https://ecc844d5-4606-4f71-a31d-9ea64a764d36.preview.emergentagent.com"):
        self.base_url = base_url
        self.tokens = {}  # Store tokens for different users
        self.test_data = {}  # Store created test data
        self.tests_run = 0
        self.tests_passed = 0
        
        # Demo account credentials including super admin
        self.demo_accounts = {
            "super_admin": {"email": "superadmin@trackmyacademy.com", "password": "SuperAdmin123!"},
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

    def test_supabase_signin(self, role: str) -> bool:
        """Test Supabase signin for specific role"""
        if role not in self.demo_accounts:
            return self.log_test(f"Supabase Signin {role}", False, "- Invalid role")
        
        account = self.demo_accounts[role]
        signin_data = {
            "email": account['email'],
            "password": account['password']
        }
        
        success, response = self.make_request('POST', '/api/auth/signin', signin_data)
        
        if success and response.get('success') and response.get('user', {}).get('access_token'):
            self.tokens[role] = response['user']['access_token']
            user_role = response['user'].get('role', 'unknown')
            return self.log_test(f"Supabase Signin {role}", True, 
                               f"- Token received, Role: {user_role}")
        else:
            return self.log_test(f"Supabase Signin {role}", False, f"- {response}")

    def test_create_super_admin(self) -> bool:
        """Test creating super admin user"""
        success, response = self.make_request('POST', '/api/create-super-admin')
        
        if success:
            return self.log_test("Create Super Admin", True, 
                               f"- {response.get('message', 'Success')}")
        else:
            return self.log_test("Create Super Admin", False, f"- {response}")

    def test_super_admin_get_academies(self) -> bool:
        """Test super admin getting all academies"""
        if 'super_admin' not in self.tokens:
            return self.log_test("Super Admin Get Academies", False, "- No super admin token")
        
        success, response = self.make_request('GET', '/api/super-admin/academies', 
                                            token=self.tokens['super_admin'])
        
        if success:
            academies_count = len(response) if isinstance(response, list) else 0
            return self.log_test("Super Admin Get Academies", True, 
                               f"- Found {academies_count} academies")
        else:
            return self.log_test("Super Admin Get Academies", False, f"- {response}")

    def test_super_admin_create_academy(self) -> bool:
        """Test super admin creating academy with auto admin user"""
        if 'super_admin' not in self.tokens:
            return self.log_test("Super Admin Create Academy", False, "- No super admin token")
        
        academy_data = {
            "academy_name": f"Test Academy {datetime.now().strftime('%H%M%S')}",
            "academy_location": "Test City",
            "owner_name": "Test Owner",
            "admin_contact": "+1234567890",
            "admin_email": f"testadmin{datetime.now().strftime('%H%M%S')}@academy.com",
            "student_limit": 100,
            "coach_limit": 10,
            "subscription_start_date": "2025-01-01T00:00:00Z",
            "subscription_expiry_date": "2025-12-31T23:59:59Z",
            "branches": ["Main Branch"],
            "academy_logo_url": "https://example.com/logo.png"
        }
        
        success, response = self.make_request('POST', '/api/super-admin/academies', 
                                            academy_data, token=self.tokens['super_admin'])
        
        if success and response.get('academy', {}).get('academy_id'):
            academy_id = response['academy']['academy_id']
            admin_creds = response.get('admin_credentials', {})
            self.test_data['super_admin_academy_id'] = academy_id
            return self.log_test("Super Admin Create Academy", True, 
                               f"- Academy ID: {academy_id}, Admin: {admin_creds.get('email', 'N/A')}")
        else:
            return self.log_test("Super Admin Create Academy", False, f"- {response}")

    def test_super_admin_get_academy_by_id(self) -> bool:
        """Test super admin getting specific academy"""
        if 'super_admin' not in self.tokens:
            return self.log_test("Super Admin Get Academy by ID", False, "- No super admin token")
        
        academy_id = self.test_data.get('super_admin_academy_id')
        if not academy_id:
            return self.log_test("Super Admin Get Academy by ID", False, "- No academy ID available")
        
        success, response = self.make_request('GET', f'/api/super-admin/academies/{academy_id}', 
                                            token=self.tokens['super_admin'])
        
        if success and response.get('academy_id'):
            return self.log_test("Super Admin Get Academy by ID", True, 
                               f"- Academy: {response.get('academy_name', 'unknown')}")
        else:
            return self.log_test("Super Admin Get Academy by ID", False, f"- {response}")

    def test_super_admin_update_academy(self) -> bool:
        """Test super admin updating academy"""
        if 'super_admin' not in self.tokens:
            return self.log_test("Super Admin Update Academy", False, "- No super admin token")
        
        academy_id = self.test_data.get('super_admin_academy_id')
        if not academy_id:
            return self.log_test("Super Admin Update Academy", False, "- No academy ID available")
        
        update_data = {
            "academy_name": f"Updated Test Academy {datetime.now().strftime('%H%M%S')}",
            "student_limit": 150
        }
        
        success, response = self.make_request('PUT', f'/api/super-admin/academies/{academy_id}', 
                                            update_data, token=self.tokens['super_admin'])
        
        if success and response.get('academy_id'):
            return self.log_test("Super Admin Update Academy", True, 
                               f"- Updated: {response.get('academy_name', 'unknown')}")
        else:
            return self.log_test("Super Admin Update Academy", False, f"- {response}")

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

    # Session Management Tests
    def test_create_session(self, role: str) -> bool:
        """Test creating training session"""
        if role not in self.tokens:
            return self.log_test(f"Create Session {role}", False, "- No token available")
        
        # Only admins and coaches can create sessions
        if role not in ['admin', 'coach']:
            success, response = self.make_request('POST', '/api/sessions', 
                                                {}, token=self.tokens[role], expected_status=403)
            return self.log_test(f"Create Session {role}", success, "- Properly denied access")
        
        academy_id = self.test_data.get('academy_id') or self.test_data.get('test_academy_id')
        coach_id = self.test_data.get('coach_id') or self.test_data.get('test_coach_id')
        
        if not academy_id:
            return self.log_test(f"Create Session {role}", False, "- No academy ID available")
        
        # For coach role, use their own coach_id if available
        if role == 'coach' and not coach_id:
            # Try to get coach info from coaches endpoint
            success, coaches = self.make_request('GET', '/api/coaches', token=self.tokens[role])
            if success and coaches:
                coach_id = coaches[0]['coach_id']
        
        if not coach_id:
            return self.log_test(f"Create Session {role}", False, "- No coach ID available")
        
        session_data = {
            "session_name": f"Basketball Training {datetime.now().strftime('%H%M%S')}",
            "description": "Advanced basketball training session",
            "session_date": "2025-01-30T10:00:00",
            "start_time": "10:00",
            "end_time": "12:00",
            "location": "Main Court",
            "max_participants": 20,
            "session_type": "training",
            "academy_id": academy_id,
            "coach_id": coach_id,
            "assigned_students": []
        }
        
        success, response = self.make_request('POST', '/api/sessions', 
                                            session_data, token=self.tokens[role])
        
        if success and 'session_id' in response:
            self.test_data[f'session_id_{role}'] = response['session_id']
            return self.log_test(f"Create Session {role}", True, 
                               f"- Session ID: {response['session_id']}")
        else:
            return self.log_test(f"Create Session {role}", False, f"- {response}")

    def test_get_sessions(self, role: str) -> bool:
        """Test getting sessions for different roles"""
        if role not in self.tokens:
            return self.log_test(f"Get Sessions {role}", False, "- No token available")
        
        success, response = self.make_request('GET', '/api/sessions', token=self.tokens[role])
        
        if success:
            sessions_count = len(response) if isinstance(response, list) else 0
            if sessions_count > 0 and 'session_id' not in self.test_data:
                self.test_data['session_id'] = response[0]['session_id']
            return self.log_test(f"Get Sessions {role}", True, 
                               f"- Found {sessions_count} sessions")
        else:
            return self.log_test(f"Get Sessions {role}", False, f"- {response}")

    def test_get_session_by_id(self, role: str) -> bool:
        """Test getting specific session by ID"""
        if role not in self.tokens:
            return self.log_test(f"Get Session by ID {role}", False, "- No token available")
        
        session_id = (self.test_data.get('session_id') or 
                     self.test_data.get(f'session_id_{role}') or
                     self.test_data.get('session_id_admin'))
        
        if not session_id:
            return self.log_test(f"Get Session by ID {role}", False, "- No session ID available")
        
        success, response = self.make_request('GET', f'/api/sessions/{session_id}', 
                                            token=self.tokens[role])
        
        if success and 'session_id' in response:
            return self.log_test(f"Get Session by ID {role}", True, 
                               f"- Session: {response.get('session_name', 'unknown')}")
        else:
            return self.log_test(f"Get Session by ID {role}", False, f"- {response}")

    def test_update_session(self, role: str) -> bool:
        """Test updating session"""
        if role not in self.tokens:
            return self.log_test(f"Update Session {role}", False, "- No token available")
        
        # Only admins and coaches can update sessions
        if role not in ['admin', 'coach']:
            return self.log_test(f"Update Session {role}", True, "- Skipped (not authorized)")
        
        session_id = (self.test_data.get(f'session_id_{role}') or 
                     self.test_data.get('session_id_admin') or
                     self.test_data.get('session_id'))
        
        if not session_id:
            return self.log_test(f"Update Session {role}", False, "- No session ID available")
        
        academy_id = self.test_data.get('academy_id') or self.test_data.get('test_academy_id')
        coach_id = self.test_data.get('coach_id') or self.test_data.get('test_coach_id')
        
        update_data = {
            "session_name": f"Updated Basketball Training {datetime.now().strftime('%H%M%S')}",
            "description": "Updated advanced basketball training session",
            "session_date": "2025-01-30T14:00:00",
            "start_time": "14:00",
            "end_time": "16:00",
            "location": "Updated Court",
            "max_participants": 25,
            "session_type": "training",
            "academy_id": academy_id,
            "coach_id": coach_id,
            "assigned_students": []
        }
        
        success, response = self.make_request('PUT', f'/api/sessions/{session_id}', 
                                            update_data, token=self.tokens[role])
        
        if success and 'session_id' in response:
            return self.log_test(f"Update Session {role}", True, 
                               f"- Updated: {response.get('session_name', 'unknown')}")
        else:
            return self.log_test(f"Update Session {role}", False, f"- {response}")

    # Attendance Management Tests
    def test_mark_attendance(self, role: str) -> bool:
        """Test marking student attendance"""
        if role not in self.tokens:
            return self.log_test(f"Mark Attendance {role}", False, "- No token available")
        
        # Only coaches can mark attendance
        if role != 'coach':
            success, response = self.make_request('POST', '/api/attendance', 
                                                {}, token=self.tokens[role], expected_status=403)
            return self.log_test(f"Mark Attendance {role}", success, "- Properly denied access")
        
        session_id = (self.test_data.get('session_id') or 
                     self.test_data.get('session_id_admin') or
                     self.test_data.get('session_id_coach'))
        student_id = self.test_data.get('student_id') or self.test_data.get('test_student_id')
        
        if not session_id or not student_id:
            return self.log_test(f"Mark Attendance {role}", False, 
                               "- Missing session or student ID")
        
        attendance_data = {
            "session_id": session_id,
            "student_id": student_id,
            "status": "present",
            "notes": "Attended full session"
        }
        
        success, response = self.make_request('POST', '/api/attendance', 
                                            attendance_data, token=self.tokens[role])
        
        if success and 'attendance_id' in response:
            self.test_data['attendance_id'] = response['attendance_id']
            return self.log_test(f"Mark Attendance {role}", True, 
                               f"- Attendance ID: {response['attendance_id']}")
        else:
            return self.log_test(f"Mark Attendance {role}", False, f"- {response}")

    def test_get_session_attendance(self, role: str) -> bool:
        """Test getting session attendance"""
        if role not in self.tokens:
            return self.log_test(f"Get Session Attendance {role}", False, "- No token available")
        
        # Only admins and coaches can view attendance
        if role not in ['admin', 'coach']:
            session_id = self.test_data.get('session_id', 'dummy')
            success, response = self.make_request('GET', f'/api/sessions/{session_id}/attendance', 
                                                token=self.tokens[role], expected_status=403)
            return self.log_test(f"Get Session Attendance {role}", success, "- Properly denied access")
        
        session_id = (self.test_data.get('session_id') or 
                     self.test_data.get('session_id_admin') or
                     self.test_data.get('session_id_coach'))
        
        if not session_id:
            return self.log_test(f"Get Session Attendance {role}", False, "- No session ID available")
        
        success, response = self.make_request('GET', f'/api/sessions/{session_id}/attendance', 
                                            token=self.tokens[role])
        
        if success:
            attendance_count = len(response) if isinstance(response, list) else 0
            return self.log_test(f"Get Session Attendance {role}", True, 
                               f"- Found {attendance_count} attendance records")
        else:
            return self.log_test(f"Get Session Attendance {role}", False, f"- {response}")

    # Performance History Tests
    def test_create_performance_record(self, role: str) -> bool:
        """Test creating performance record"""
        if role not in self.tokens:
            return self.log_test(f"Create Performance Record {role}", False, "- No token available")
        
        # Only coaches can create performance records
        if role != 'coach':
            success, response = self.make_request('POST', '/api/performance-history', 
                                                {}, token=self.tokens[role], expected_status=403)
            return self.log_test(f"Create Performance Record {role}", success, "- Properly denied access")
        
        student_id = self.test_data.get('student_id') or self.test_data.get('test_student_id')
        session_id = (self.test_data.get('session_id') or 
                     self.test_data.get('session_id_admin') or
                     self.test_data.get('session_id_coach'))
        
        if not student_id:
            return self.log_test(f"Create Performance Record {role}", False, "- No student ID available")
        
        performance_data = {
            "student_id": student_id,
            "session_id": session_id,
            "performance_score": 8.5,
            "performance_notes": "Excellent improvement in shooting accuracy",
            "assessment_type": "session",
            "assessed_by": "coach_id_placeholder"  # This will be set by the backend
        }
        
        success, response = self.make_request('POST', '/api/performance-history', 
                                            performance_data, token=self.tokens[role])
        
        if success and 'performance_id' in response:
            self.test_data['performance_id'] = response['performance_id']
            return self.log_test(f"Create Performance Record {role}", True, 
                               f"- Performance ID: {response['performance_id']}")
        else:
            return self.log_test(f"Create Performance Record {role}", False, f"- {response}")

    def test_get_student_performance_history(self, role: str) -> bool:
        """Test getting student performance history"""
        if role not in self.tokens:
            return self.log_test(f"Get Performance History {role}", False, "- No token available")
        
        student_id = self.test_data.get('student_id') or self.test_data.get('test_student_id')
        
        if not student_id:
            return self.log_test(f"Get Performance History {role}", False, "- No student ID available")
        
        success, response = self.make_request('GET', f'/api/students/{student_id}/performance-history', 
                                            token=self.tokens[role])
        
        if success:
            history_count = len(response) if isinstance(response, list) else 0
            return self.log_test(f"Get Performance History {role}", True, 
                               f"- Found {history_count} performance records")
        else:
            return self.log_test(f"Get Performance History {role}", False, f"- {response}")

    # Analytics Tests
    def test_get_attendance_analytics(self, role: str) -> bool:
        """Test getting attendance analytics"""
        if role not in self.tokens:
            return self.log_test(f"Get Attendance Analytics {role}", False, "- No token available")
        
        student_id = self.test_data.get('student_id') or self.test_data.get('test_student_id')
        
        if not student_id:
            return self.log_test(f"Get Attendance Analytics {role}", False, "- No student ID available")
        
        success, response = self.make_request('GET', f'/api/analytics/attendance/{student_id}', 
                                            token=self.tokens[role])
        
        if success and 'student_id' in response:
            return self.log_test(f"Get Attendance Analytics {role}", True, 
                               f"- Student: {response.get('student_name', 'unknown')}, "
                               f"Attendance: {response.get('attendance_percentage', 0)}%")
        else:
            return self.log_test(f"Get Attendance Analytics {role}", False, f"- {response}")

    def test_get_performance_analytics(self, role: str) -> bool:
        """Test getting performance analytics"""
        if role not in self.tokens:
            return self.log_test(f"Get Performance Analytics {role}", False, "- No token available")
        
        student_id = self.test_data.get('student_id') or self.test_data.get('test_student_id')
        
        if not student_id:
            return self.log_test(f"Get Performance Analytics {role}", False, "- No student ID available")
        
        success, response = self.make_request('GET', f'/api/analytics/performance/{student_id}', 
                                            token=self.tokens[role])
        
        if success and 'student_id' in response:
            return self.log_test(f"Get Performance Analytics {role}", True, 
                               f"- Student: {response.get('student_name', 'unknown')}, "
                               f"Score: {response.get('current_score', 0)}, "
                               f"Trend: {response.get('score_trend', 'unknown')}")
        else:
            return self.log_test(f"Get Performance Analytics {role}", False, f"- {response}")

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
        
        # Session Management tests
        print("\n📅 Testing Session Management...")
        for role in ['admin', 'coach', 'student']:
            if role in self.tokens:
                self.test_create_session(role)
                self.test_get_sessions(role)
                self.test_get_session_by_id(role)
                self.test_update_session(role)
        
        # Attendance Management tests
        print("\n✅ Testing Attendance Management...")
        for role in ['admin', 'coach', 'student']:
            if role in self.tokens:
                self.test_mark_attendance(role)
                self.test_get_session_attendance(role)
        
        # Performance History tests
        print("\n📈 Testing Performance History...")
        for role in ['admin', 'coach', 'student']:
            if role in self.tokens:
                self.test_create_performance_record(role)
                self.test_get_student_performance_history(role)
        
        # Analytics tests
        print("\n📊 Testing Analytics...")
        for role in ['admin', 'coach', 'student']:
            if role in self.tokens:
                self.test_get_attendance_analytics(role)
                self.test_get_performance_analytics(role)
        
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