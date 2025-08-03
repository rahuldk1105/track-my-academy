import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Import new components
import LandingPage from './components/LandingPage';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import { PerformanceTrendChart, AttendanceChart, AttendanceSummaryChart, AcademyOverviewChart, PerformanceDistributionChart } from './components/Charts';
import { CreateSessionModal, SessionList, AttendanceMarking } from './components/SessionManagement';

// Import enhanced auth components
import { AuthProvider, useAuth } from './contexts/AuthContext';
import EnhancedLoginForm from './components/auth/EnhancedLoginForm';
import EnhancedSignupForm from './components/auth/EnhancedSignupForm';
import CheckEmailPage from './components/auth/CheckEmailPage';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';

// Toast notifications
import { Toaster } from 'react-hot-toast';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Enhanced API Service with Supabase auth
class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('supabase_access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async login(email, password) {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await this.api.post('/api/token', formData);
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.api.get('/api/users/me');
    return response.data;
  }

  async getAcademies() {
    const response = await this.api.get('/api/academies');
    return response.data;
  }

  async createAcademy(academyData) {
    const response = await this.api.post('/api/academies', academyData);
    return response.data;
  }

  async getCoaches() {
    const response = await this.api.get('/api/coaches');
    return response.data;
  }

  async createCoach(coachData) {
    const response = await this.api.post('/api/coaches', coachData);
    return response.data;
  }

  async getStudents() {
    const response = await this.api.get('/api/students');
    return response.data;
  }

  async createStudent(studentData) {
    const response = await this.api.post('/api/students', studentData);
    return response.data;
  }

  async assignCoachToStudent(studentId, coachId) {
    const response = await this.api.post(`/api/students/${studentId}/assign-coach/${coachId}`);
    return response.data;
  }

  // Session Management
  async createSession(sessionData) {
    const response = await this.api.post('/api/sessions', sessionData);
    return response.data;
  }

  async getSessions() {
    const response = await this.api.get('/api/sessions');
    return response.data;
  }

  async getSession(sessionId) {
    const response = await this.api.get(`/api/sessions/${sessionId}`);
    return response.data;
  }

  async updateSession(sessionId, sessionData) {
    const response = await this.api.put(`/api/sessions/${sessionId}`, sessionData);
    return response.data;
  }

  // Attendance Management
  async markAttendance(attendanceData) {
    const response = await this.api.post('/api/attendance', attendanceData);
    return response.data;
  }

  async getSessionAttendance(sessionId) {
    const response = await this.api.get(`/api/sessions/${sessionId}/attendance`);
    return response.data;
  }

  // Performance History
  async createPerformanceRecord(performanceData) {
    const response = await this.api.post('/api/performance-history', performanceData);
    return response.data;
  }

  async getStudentPerformanceHistory(studentId) {
    const response = await this.api.get(`/api/students/${studentId}/performance-history`);
    return response.data;
  }

  // Analytics
  async getStudentAttendanceAnalytics(studentId) {
    const response = await this.api.get(`/api/analytics/attendance/${studentId}`);
    return response.data;
  }

  async getStudentPerformanceAnalytics(studentId) {
    const response = await this.api.get(`/api/analytics/performance/${studentId}`);
    return response.data;
  }
}

const apiService = new ApiService();

// Export apiService for use in other files
export { apiService };

// Components
const LoginForm = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const tokenData = await apiService.login(email, password);
      localStorage.setItem('token', tokenData.access_token);
      
      const user = await apiService.getCurrentUser();
      onLogin(user);
    } catch (error) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Track My Academy
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                className="input-field rounded-t-md"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="input-field rounded-b-md"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center btn-primary"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="mt-6 text-sm text-gray-600">
            <p>Demo Accounts (will be created after first academy setup):</p>
            <ul className="mt-2 space-y-1">
              <li>• Admin: admin@academy.com / password123</li>
              <li>• Coach: coach@academy.com / password123</li>
              <li>• Student: student@academy.com / password123</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
};

const DashboardHeader = ({ user, onLogout }) => {
  const getRoleDisplayName = (role) => {
    const roleNames = {
      'super_admin': 'Super Admin',
      'admin': 'Admin',
      'coach': 'Coach',
      'student': 'Student'
    };
    return roleNames[role] || role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">Track My Academy</h1>
            <span className="ml-4 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
              {getRoleDisplayName(user.role)}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {user.name}</span>
            <button
              onClick={onLogout}
              className="btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const AdminDashboard = ({ user }) => {
  const [academies, setAcademies] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showCreateAcademy, setShowCreateAcademy] = useState(false);
  const [showCreateCoach, setShowCreateCoach] = useState(false);
  const [showCreateStudent, setShowCreateStudent] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [academiesData, coachesData, studentsData, sessionsData] = await Promise.all([
        apiService.getAcademies(),
        apiService.getCoaches(),
        apiService.getStudents(),
        apiService.getSessions()
      ]);
      
      setAcademies(academiesData);
      setCoaches(coachesData);
      setStudents(studentsData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const academyOverviewData = {
    academies: academies.length,
    coaches: coaches.length,
    students: students.length,
    sessions: sessions.length
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Tab Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sessions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sessions
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="stats-card">
              <div className="text-2xl font-bold">{academies.length}</div>
              <div className="text-primary-100">Academies</div>
            </div>
            <div className="stats-card">
              <div className="text-2xl font-bold">{coaches.length}</div>
              <div className="text-primary-100">Coaches</div>
            </div>
            <div className="stats-card">
              <div className="text-2xl font-bold">{students.length}</div>
              <div className="text-primary-100">Students</div>
            </div>
            <div className="stats-card">
              <div className="text-2xl font-bold">{sessions.length}</div>
              <div className="text-primary-100">Sessions</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setShowCreateAcademy(true)}
                className="btn-primary"
              >
                Create Academy
              </button>
              {academies.length > 0 && (
                <>
                  <button
                    onClick={() => setShowCreateCoach(true)}
                    className="btn-primary"
                  >
                    Add Coach
                  </button>
                  <button
                    onClick={() => setShowCreateStudent(true)}
                    className="btn-primary"
                  >
                    Add Student
                  </button>
                  <button
                    onClick={() => setShowCreateSession(true)}
                    className="btn-primary"
                  >
                    Create Session
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Subscription Warnings */}
          {academies.some(academy => {
            const expiryDate = new Date(academy.subscription_expiry_date);
            const today = new Date();
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry <= 10 && daysUntilExpiry > 0;
          }) && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h4 className="text-lg font-semibold text-yellow-800">Subscription Warning</h4>
              </div>
              <div className="mt-2 space-y-2">
                {academies.filter(academy => {
                  const expiryDate = new Date(academy.subscription_expiry_date);
                  const today = new Date();
                  const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                  return daysUntilExpiry <= 10 && daysUntilExpiry > 0;
                }).map(academy => {
                  const expiryDate = new Date(academy.subscription_expiry_date);
                  const today = new Date();
                  const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                  return (
                    <p key={academy.academy_id} className="text-sm text-yellow-800">
                      <strong>{academy.academy_name}</strong> subscription expires in <strong>{daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}</strong> ({expiryDate.toLocaleDateString()})
                    </p>
                  );
                })}
              </div>
            </div>
          )}

          {/* Data Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Academies */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Academies</h3>
              {academies.length === 0 ? (
                <p className="text-gray-500">No academies yet. Create your first academy to get started.</p>
              ) : (
                <div className="space-y-4">
                  {academies.map((academy) => {
                    const expiryDate = new Date(academy.subscription_expiry_date);
                    const today = new Date();
                    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                    const isExpiringSoon = daysUntilExpiry <= 10 && daysUntilExpiry > 0;
                    const isExpired = daysUntilExpiry <= 0;

                    return (
                      <div key={academy.academy_id} className="border border-gray-200 rounded p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{academy.academy_name}</h4>
                            <p className="text-sm text-gray-600">{academy.academy_location}</p>
                            <p className="text-sm text-gray-600">{academy.admin_email}</p>
                            {academy.subscription_expiry_date && (
                              <p className="text-sm text-gray-600 mt-1">
                                Expires: {expiryDate.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="ml-4">
                            {isExpired ? (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                ❌ Expired
                              </span>
                            ) : isExpiringSoon ? (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                ⚠️ Expiring Soon
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                ✅ Active
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">{coaches.length} coaches registered</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">{students.length} students enrolled</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">{sessions.length} sessions scheduled</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Training Sessions</h2>
            <button
              onClick={() => setShowCreateSession(true)}
              className="btn-primary"
              disabled={academies.length === 0}
            >
              Create Session
            </button>
          </div>
          <SessionList sessions={sessions} userRole="admin" />
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics Dashboard</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card">
              <AcademyOverviewChart academyData={academyOverviewData} />
            </div>
            <div className="card">
              <PerformanceDistributionChart students={students} />
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateAcademy && (
        <CreateAcademyModal 
          onClose={() => setShowCreateAcademy(false)} 
          onSuccess={loadData}
        />
      )}

      {showCreateCoach && academies.length > 0 && (
        <CreateCoachModal 
          academies={academies}
          onClose={() => setShowCreateCoach(false)} 
          onSuccess={loadData}
        />
      )}

      {showCreateStudent && academies.length > 0 && (
        <CreateStudentModal 
          academies={academies}
          coaches={coaches}
          onClose={() => setShowCreateStudent(false)} 
          onSuccess={loadData}
        />
      )}

      {showCreateSession && academies.length > 0 && (
        <CreateSessionModal 
          academies={academies}
          coaches={coaches}
          students={students}
          onClose={() => setShowCreateSession(false)} 
          onSuccess={loadData}
        />
      )}
    </div>
  );
};

const CoachDashboard = ({ user }) => {
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState('students');
  const [selectedSession, setSelectedSession] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsData, sessionsData] = await Promise.all([
        apiService.getStudents(),
        apiService.getSessions()
      ]);
      setStudents(studentsData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (session) => {
    setSelectedSession(session);
    setShowAttendanceModal(true);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Tab Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('students')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'students'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Students
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sessions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Training Sessions
          </button>
        </nav>
      </div>

      {/* Students Tab */}
      {activeTab === 'students' && (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">My Students</h2>
            <p className="text-gray-600">Manage and track your assigned students</p>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No students assigned yet.</p>
              <p className="text-gray-400">Contact your academy admin to assign students to you.</p>
            </div>
          ) : (
            <div className="dashboard-grid">
              {students.map((student) => (
                <div key={student.student_id} className="card">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-gray-600">
                        {student.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">{student.enrolled_program}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Age:</span>
                      <span className="text-sm font-medium">{student.age} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Performance:</span>
                      <span className={`performance-badge ${getPerformanceBadgeClass(student.performance_score)}`}>
                        {student.performance_score}/10
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Parent Contact:</span>
                      <span className="text-sm font-medium">{student.parent_contact}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Training Sessions</h2>
            <p className="text-gray-600">Manage your training sessions and mark attendance</p>
          </div>

          <SessionList 
            sessions={sessions} 
            onSessionClick={handleSessionClick}
            userRole="coach" 
          />
        </>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && selectedSession && (
        <AttendanceMarking
          session={selectedSession}
          students={students}
          onClose={() => {
            setShowAttendanceModal(false);
            setSelectedSession(null);
          }}
          onSuccess={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
};

const StudentDashboard = ({ user }) => {
  const [studentData, setStudentData] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendanceAnalytics, setAttendanceAnalytics] = useState(null);
  const [performanceAnalytics, setPerformanceAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsData, coachesData, sessionsData] = await Promise.all([
        apiService.getStudents(),
        apiService.getCoaches(),
        apiService.getSessions()
      ]);
      
      // Find current student's data
      const currentStudent = studentsData.find(s => s.email === user.email);
      setStudentData(currentStudent);
      setCoaches(coachesData);
      setSessions(sessionsData);

      // Load analytics if student found
      if (currentStudent) {
        try {
          const [attendanceData, performanceData] = await Promise.all([
            apiService.getStudentAttendanceAnalytics(currentStudent.student_id),
            apiService.getStudentPerformanceAnalytics(currentStudent.student_id)
          ]);
          setAttendanceAnalytics(attendanceData);
          setPerformanceAnalytics(performanceData);
        } catch (error) {
          console.warn('Analytics data not available yet:', error);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!studentData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Student profile not found.</p>
          <p className="text-gray-400">Please contact your academy admin.</p>
        </div>
      </div>
    );
  }

  const assignedCoaches = coaches.filter(coach => 
    studentData.assigned_coaches.includes(coach.coach_id)
  );

  const studentSessions = sessions.filter(session =>
    session.assigned_students?.includes(studentData.student_id)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Tab Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Profile
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sessions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Sessions
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Analytics
          </button>
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
            <p className="text-gray-600">View your personal information and progress</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Student Profile */}
            <div className="lg:col-span-2">
              <div className="card mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="text-gray-900">{studentData.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Age</label>
                    <p className="text-gray-900">{studentData.age} years</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Program</label>
                    <p className="text-gray-900">{studentData.enrolled_program}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Performance Score</label>
                    <p className={`performance-badge ${getPerformanceBadgeClass(studentData.performance_score)}`}>
                      {studentData.performance_score}/10
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{assignedCoaches.length}</div>
                    <div className="text-sm text-gray-600">Coaches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{studentSessions.length}</div>
                    <div className="text-sm text-gray-600">Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {attendanceAnalytics?.attendance_percentage || 0}%
                    </div>
                    <div className="text-sm text-gray-600">Attendance</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* My Coaches */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">My Coaches</h3>
                {assignedCoaches.length === 0 ? (
                  <p className="text-gray-500">No coaches assigned yet.</p>
                ) : (
                  <div className="space-y-3">
                    {assignedCoaches.map((coach) => (
                      <div key={coach.coach_id} className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {coach.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{coach.name}</p>
                          <p className="text-xs text-gray-600">{coach.specialization}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">My Training Sessions</h2>
            <p className="text-gray-600">View your assigned training sessions</p>
          </div>

          <SessionList sessions={studentSessions} userRole="student" />
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">My Analytics</h2>
            <p className="text-gray-600">Track your progress and performance</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Performance Chart */}
            {performanceAnalytics && performanceAnalytics.performance_history.length > 0 ? (
              <div className="card">
                <PerformanceTrendChart data={performanceAnalytics.performance_history} />
              </div>
            ) : (
              <div className="card">
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Performance data will appear after assessments</p>
                </div>
              </div>
            )}

            {/* Attendance Summary */}
            {attendanceAnalytics ? (
              <div className="card">
                <AttendanceSummaryChart data={attendanceAnalytics} />
              </div>
            ) : (
              <div className="card">
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Attendance data will appear after sessions</p>
                </div>
              </div>
            )}

            {/* Recent Attendance */}
            {attendanceAnalytics && attendanceAnalytics.recent_attendance.length > 0 ? (
              <div className="card lg:col-span-2">
                <AttendanceChart data={attendanceAnalytics} />
              </div>
            ) : (
              <div className="card lg:col-span-2">
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Recent attendance chart will appear after sessions</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Modal Components
const CreateAcademyModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    academy_name: '',
    academy_location: '',
    academy_logo_url: '',
    admin_email: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiService.createAcademy(formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating academy:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Create Academy</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Academy Name"
            className="input-field"
            value={formData.academy_name}
            onChange={(e) => setFormData({...formData, academy_name: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Location"
            className="input-field"
            value={formData.academy_location}
            onChange={(e) => setFormData({...formData, academy_location: e.target.value})}
            required
          />
          <input
            type="url"
            placeholder="Logo URL (optional)"
            className="input-field"
            value={formData.academy_logo_url}
            onChange={(e) => setFormData({...formData, academy_logo_url: e.target.value})}
          />
          <input
            type="email"
            placeholder="Admin Email"
            className="input-field"
            value={formData.admin_email}
            onChange={(e) => setFormData({...formData, admin_email: e.target.value})}
            required
          />
          <div className="flex space-x-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateCoachModal = ({ academies, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    specialization: '',
    profile_pic: '',
    bio: '',
    academy_id: academies[0]?.academy_id || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiService.createCoach(formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating coach:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Add Coach</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            className="input-field"
            value={formData.academy_id}
            onChange={(e) => setFormData({...formData, academy_id: e.target.value})}
            required
          >
            {academies.map(academy => (
              <option key={academy.academy_id} value={academy.academy_id}>
                {academy.academy_name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Name"
            className="input-field"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="input-field"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Specialization (e.g., Basketball, Football)"
            className="input-field"
            value={formData.specialization}
            onChange={(e) => setFormData({...formData, specialization: e.target.value})}
            required
          />
          <input
            type="url"
            placeholder="Profile Picture URL (optional)"
            className="input-field"
            value={formData.profile_pic}
            onChange={(e) => setFormData({...formData, profile_pic: e.target.value})}
          />
          <textarea
            placeholder="Bio (optional)"
            className="input-field"
            rows="3"
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
          />
          <div className="flex space-x-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Adding...' : 'Add Coach'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateStudentModal = ({ academies, coaches, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    parent_contact: '',
    enrolled_program: '',
    photo: '',
    academy_id: academies[0]?.academy_id || '',
    assigned_coaches: []
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const studentData = {
        ...formData,
        age: parseInt(formData.age)
      };
      await apiService.createStudent(studentData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating student:', error);
    } finally {
      setLoading(false);
    }
  };

  const academyCoaches = coaches.filter(coach => coach.academy_id === formData.academy_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Add Student</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            className="input-field"
            value={formData.academy_id}
            onChange={(e) => setFormData({...formData, academy_id: e.target.value, assigned_coaches: []})}
            required
          >
            {academies.map(academy => (
              <option key={academy.academy_id} value={academy.academy_id}>
                {academy.academy_name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Name"
            className="input-field"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="input-field"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <input
            type="number"
            placeholder="Age"
            className="input-field"
            value={formData.age}
            onChange={(e) => setFormData({...formData, age: e.target.value})}
            required
          />
          <input
            type="tel"
            placeholder="Parent Contact"
            className="input-field"
            value={formData.parent_contact}
            onChange={(e) => setFormData({...formData, parent_contact: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Enrolled Program (e.g., Junior Basketball)"
            className="input-field"
            value={formData.enrolled_program}
            onChange={(e) => setFormData({...formData, enrolled_program: e.target.value})}
            required
          />
          <input
            type="url"
            placeholder="Photo URL (optional)"
            className="input-field"
            value={formData.photo}
            onChange={(e) => setFormData({...formData, photo: e.target.value})}
          />
          
          {academyCoaches.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Coaches (optional)
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {academyCoaches.map(coach => (
                  <label key={coach.coach_id} className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={formData.assigned_coaches.includes(coach.coach_id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData, 
                            assigned_coaches: [...formData.assigned_coaches, coach.coach_id]
                          });
                        } else {
                          setFormData({
                            ...formData, 
                            assigned_coaches: formData.assigned_coaches.filter(id => id !== coach.coach_id)
                          });
                        }
                      }}
                    />
                    <span className="text-sm">{coach.name} - {coach.specialization}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex space-x-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Utility function
const getPerformanceBadgeClass = (score) => {
  if (score >= 8) return 'performance-excellent';
  if (score >= 6) return 'performance-good';
  if (score >= 4) return 'performance-average';
  return 'performance-poor';
};

// Main App Component with Routing
const AppContent = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      apiService.getCurrentUser()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={
        user ? <Navigate to="/dashboard" replace /> : <LoginForm onLogin={handleLogin} />
      } />
      <Route path="/dashboard" element={
        user ? (
          <AuthContext.Provider value={{ user, logout: handleLogout }}>
            <div className="min-h-screen bg-gray-50">
              <DashboardHeader user={user} onLogout={handleLogout} />
              
              {user.role === 'super_admin' && <SuperAdminDashboard user={user} />}
              {user.role === 'admin' && <AdminDashboard user={user} />}
              {user.role === 'coach' && <CoachDashboard user={user} />}
              {user.role === 'student' && <StudentDashboard user={user} />}
            </div>
          </AuthContext.Provider>
        ) : <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;