import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

const PlayerDashboard = () => {
  const { user, signOut, token } = useAuth();
  const { theme, isLight } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [playerData, setPlayerData] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [performanceStats, setPerformanceStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadPlayerDashboardData();
  }, []);

  const loadPlayerDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPlayerProfile(),
        loadAttendanceHistory(),
        loadPerformanceStats(),
        loadAnnouncements()
      ]);
    } catch (error) {
      console.error('Error loading player dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayerProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/player/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPlayerData(data);
      } else {
        console.error('Failed to load player profile');
      }
    } catch (error) {
      console.error('Error loading player profile:', error);
    }
  };

  const loadAttendanceHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/player/attendance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAttendanceHistory(data);
      } else {
        console.error('Failed to load attendance history');
      }
    } catch (error) {
      console.error('Error loading attendance history:', error);
    }
  };

  const loadPerformanceStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/player/performance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPerformanceStats(data);
      } else {
        console.error('Failed to load performance stats');
      }
    } catch (error) {
      console.error('Error loading performance stats:', error);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/player/announcements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      } else {
        console.error('Failed to load announcements');
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const TabButton = ({ id, label, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
        active
          ? 'bg-sky-500 text-white shadow-lg'
          : isLight 
            ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );

  const StatCard = ({ title, value, icon, color }) => (
    <div className={`${isLight ? 'bg-white/80 border-gray-200' : 'bg-white/5 border-white/10'} backdrop-blur-md rounded-xl p-6 border`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color.replace('text', 'bg').replace('-400', '-400/20')}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`min-h-screen ${isLight ? 'bg-gradient-to-br from-gray-50 via-white to-gray-100' : 'bg-gradient-to-br from-black via-gray-900 to-black'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isLight ? 'bg-gradient-to-br from-gray-50 via-white to-gray-100' : 'bg-gradient-to-br from-black via-gray-900 to-black'}`}>
      {/* Header */}
      <header className={`${isLight ? 'bg-white/80 border-gray-200' : 'bg-white/5 border-white/10'} backdrop-blur-md border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img 
                src="https://i.ibb.co/1tLZ0Dp1/TMA-LOGO-without-bg.png" 
                alt="Track My Academy" 
                className="h-10 w-auto mr-4"
              />
              <div>
                <h1 className={`text-2xl font-bold ${isLight ? 'bg-gradient-to-r from-sky-600 to-gray-800 bg-clip-text text-transparent' : 'bg-gradient-to-r from-sky-400 to-white bg-clip-text text-transparent'}`}>
                  Player Dashboard
                </h1>
                <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>
                  Welcome, {playerData?.first_name} {playerData?.last_name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={handleSignOut}
                className={`${isLight ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'} border px-4 py-2 rounded-lg transition-all duration-300`}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Player Info Card */}
        {playerData && (
          <div className={`${isLight ? 'bg-white/80 border-gray-200' : 'bg-white/5 border-white/10'} backdrop-blur-md rounded-xl p-6 border mb-8`}>
            <div className="flex items-center">
              <div className={`w-20 h-20 rounded-full ${isLight ? 'bg-gray-200' : 'bg-white/10'} flex items-center justify-center mr-6`}>
                <svg className={`w-10 h-10 ${isLight ? 'text-gray-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-800' : 'text-white'} mb-2`}>
                  {playerData.first_name} {playerData.last_name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Sport</p>
                    <p className={`${isLight ? 'text-gray-800' : 'text-white'} font-medium`}>{playerData.sport}</p>
                  </div>
                  <div>
                    <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Position</p>
                    <p className={`${isLight ? 'text-gray-800' : 'text-white'} font-medium`}>{playerData.position || 'N/A'}</p>
                  </div>
                  <div>
                    <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Registration No.</p>
                    <p className={`${isLight ? 'text-gray-800' : 'text-white'} font-medium`}>{playerData.registration_number}</p>
                  </div>
                  <div>
                    <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Academy</p>
                    <p className={`${isLight ? 'text-gray-800' : 'text-white'} font-medium`}>{playerData.academy_name}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Stats */}
        {performanceStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Attendance Rate"
              value={`${Math.round((performanceStats.attendance_rate || 0) * 100)}%`}
              color="text-green-400"
              icon={
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              }
            />
            <StatCard
              title="Training Sessions"
              value={performanceStats.total_sessions || 0}
              color="text-blue-400"
              icon={
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              title="Performance Score"
              value={`${Math.round(performanceStats.overall_performance || 0)}/100`}
              color="text-sky-400"
              icon={
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              }
            />
            <StatCard
              title="Goals This Month"
              value={performanceStats.monthly_goals || 0}
              color="text-orange-400"
              icon={
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
              }
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 overflow-x-auto">
          <TabButton
            id="profile"
            label="Profile"
            active={activeTab === 'profile'}
            onClick={setActiveTab}
          />
          <TabButton
            id="attendance"
            label="Attendance"
            active={activeTab === 'attendance'}
            onClick={setActiveTab}
          />
          <TabButton
            id="performance"
            label="Performance"
            active={activeTab === 'performance'}
            onClick={setActiveTab}
          />
          <TabButton
            id="announcements"
            label="Announcements"
            active={activeTab === 'announcements'}
            onClick={setActiveTab}
          />
        </div>

        {/* Content */}
        <div className={`${isLight ? 'bg-white/80 border-gray-200' : 'bg-white/5 border-white/10'} backdrop-blur-md rounded-xl border overflow-hidden`}>
          {activeTab === 'profile' && playerData && (
            <div className="p-6">
              <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-800' : 'text-white'} mb-6`}>Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className={`font-semibold ${isLight ? 'text-gray-700' : 'text-gray-300'} mb-4`}>Basic Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Full Name</p>
                      <p className={`${isLight ? 'text-gray-800' : 'text-white'}`}>{playerData.first_name} {playerData.last_name}</p>
                    </div>
                    <div>
                      <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Email</p>
                      <p className={`${isLight ? 'text-gray-800' : 'text-white'}`}>{playerData.email}</p>
                    </div>
                    <div>
                      <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Phone</p>
                      <p className={`${isLight ? 'text-gray-800' : 'text-white'}`}>{playerData.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Date of Birth</p>
                      <p className={`${isLight ? 'text-gray-800' : 'text-white'}`}>{playerData.date_of_birth ? new Date(playerData.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
                    </div>
                    <div>
                      <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Age</p>
                      <p className={`${isLight ? 'text-gray-800' : 'text-white'}`}>{playerData.age || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className={`font-semibold ${isLight ? 'text-gray-700' : 'text-gray-300'} mb-4`}>Sports Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Sport</p>
                      <p className={`${isLight ? 'text-gray-800' : 'text-white'}`}>{playerData.sport}</p>
                    </div>
                    <div>
                      <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Position</p>
                      <p className={`${isLight ? 'text-gray-800' : 'text-white'}`}>{playerData.position || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Registration Number</p>
                      <p className={`${isLight ? 'text-gray-800' : 'text-white'}`}>{playerData.registration_number}</p>
                    </div>
                    <div>
                      <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Height</p>
                      <p className={`${isLight ? 'text-gray-800' : 'text-white'}`}>{playerData.height ? `${playerData.height} cm` : 'Not provided'}</p>
                    </div>
                    <div>
                      <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Weight</p>
                      <p className={`${isLight ? 'text-gray-800' : 'text-white'}`}>{playerData.weight ? `${playerData.weight} kg` : 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="p-6">
              <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-800' : 'text-white'} mb-6`}>Attendance History</h2>
              {attendanceHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`${isLight ? 'border-gray-200' : 'border-white/10'} border-b`}>
                        <th className={`text-left py-3 px-4 ${isLight ? 'text-gray-700' : 'text-gray-300'} font-medium`}>Date</th>
                        <th className={`text-left py-3 px-4 ${isLight ? 'text-gray-700' : 'text-gray-300'} font-medium`}>Status</th>
                        <th className={`text-left py-3 px-4 ${isLight ? 'text-gray-700' : 'text-gray-300'} font-medium`}>Training Type</th>
                        <th className={`text-left py-3 px-4 ${isLight ? 'text-gray-700' : 'text-gray-300'} font-medium`}>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceHistory.slice(0, 10).map((record, index) => (
                        <tr key={index} className={`${isLight ? 'border-gray-100' : 'border-white/5'} border-b`}>
                          <td className={`py-3 px-4 ${isLight ? 'text-gray-800' : 'text-gray-300'}`}>
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.status === 'present' 
                                ? 'bg-green-500/20 text-green-400' 
                                : record.status === 'absent'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className={`py-3 px-4 ${isLight ? 'text-gray-800' : 'text-gray-300'}`}>
                            {record.training_type || 'Regular Training'}
                          </td>
                          <td className={`py-3 px-4 ${isLight ? 'text-gray-800' : 'text-gray-300'}`}>
                            {record.duration || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className={`mx-auto w-12 h-12 ${isLight ? 'text-gray-400' : 'text-gray-600'} mb-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>No attendance records found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="p-6">
              <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-800' : 'text-white'} mb-6`}>Performance Analytics</h2>
              {performanceStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`${isLight ? 'bg-white/80 border-gray-200' : 'bg-white/5 border-white/10'} rounded-lg p-4 border`}>
                    <h3 className={`font-semibold ${isLight ? 'text-gray-700' : 'text-gray-300'} mb-3`}>Overall Performance</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Overall Score</span>
                        <span className={`${isLight ? 'text-gray-800' : 'text-white'} font-medium`}>{Math.round(performanceStats.overall_performance || 0)}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Attendance Rate</span>
                        <span className={`${isLight ? 'text-gray-800' : 'text-white'} font-medium`}>{Math.round((performanceStats.attendance_rate || 0) * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Training Sessions</span>
                        <span className={`${isLight ? 'text-gray-800' : 'text-white'} font-medium`}>{performanceStats.total_sessions || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`${isLight ? 'bg-white/80 border-gray-200' : 'bg-white/5 border-white/10'} rounded-lg p-4 border`}>
                    <h3 className={`font-semibold ${isLight ? 'text-gray-700' : 'text-gray-300'} mb-3`}>Recent Achievements</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Goals This Month</span>
                        <span className={`${isLight ? 'text-gray-800' : 'text-white'} font-medium`}>{performanceStats.monthly_goals || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Best Performance</span>
                        <span className={`${isLight ? 'text-gray-800' : 'text-white'} font-medium`}>{Math.round(performanceStats.best_performance || 0)}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Improvement Rate</span>
                        <span className={`${isLight ? 'text-gray-800' : 'text-white'} font-medium`}>+{Math.round(performanceStats.improvement_rate || 0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className={`mx-auto w-12 h-12 ${isLight ? 'text-gray-400' : 'text-gray-600'} mb-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>No performance data available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="p-6">
              <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-800' : 'text-white'} mb-6`}>Academy Announcements</h2>
              {announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map((announcement, index) => (
                    <div key={index} className={`${isLight ? 'bg-white/80 border-gray-200' : 'bg-white/5 border-white/10'} rounded-lg p-4 border`}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>{announcement.title}</h3>
                        <span className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`${isLight ? 'text-gray-700' : 'text-gray-300'} mb-2`}>{announcement.message}</p>
                      {announcement.priority && (
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          announcement.priority === 'high' 
                            ? 'bg-red-500/20 text-red-400' 
                            : announcement.priority === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {announcement.priority} priority
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className={`mx-auto w-12 h-12 ${isLight ? 'text-gray-400' : 'text-gray-600'} mb-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>No announcements available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboard;