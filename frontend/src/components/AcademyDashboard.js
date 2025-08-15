import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import PlayerModal from './PlayerModal';
import CoachModal from './CoachModal';
import AcademySettingsForm from './AcademySettingsForm';
import AcademyAnalytics from './AcademyAnalytics';
import AttendanceTracker from './AttendanceTracker';
import PerformanceAnalytics from './PerformanceAnalytics';
import ThemeToggle from './ThemeToggle';
import SideNav from './SideNav';
import PlayerCard from './PlayerCard';
import CoachCard from './CoachCard';

const AcademyDashboard = () => {
  const { user, signOut, token, userRole } = useAuth();
  const { isLight } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [academyData, setAcademyData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [players, setPlayers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [stats, setStats] = useState({});
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editingCoach, setEditingCoach] = useState(null);
  const [academyLogo, setAcademyLogo] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (userRole && userRole.role === 'academy_user' && userRole.academy_id) {
      loadAcademyData();
    } else if (userRole && userRole.role !== 'academy_user') {
      navigate('/dashboard');
    }
  }, [userRole, navigate]);

  const loadAcademyData = async () => {
    try {
      setLoading(true);
      setAcademyData({ id: userRole.academy_id, name: userRole.academy_name });
      await loadAcademySettings();
      await Promise.all([loadStats(), loadPlayers(), loadCoaches()]);
    } catch (error) {
      console.error('Error loading academy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAcademySettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/settings`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const settings = await response.json();
        if (settings.branding && settings.branding.logo_url) {
          setAcademyLogo(settings.branding.logo_url);
        }
      }
    } catch (error) {
      console.error('Error loading academy settings:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/stats`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadPlayers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/players`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const playersData = await response.json();
        setPlayers(playersData);
      }
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const loadCoaches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/coaches`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const coachesData = await response.json();
        setCoaches(coachesData);
      }
    } catch (error) {
      console.error('Error loading coaches:', error);
    }
  };

  const handleCreatePlayer = async (playerData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/players`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(playerData)
      });
      if (response.ok) {
        await Promise.all([loadPlayers(), loadStats()]);
        setShowPlayerModal(false);
        alert('Player created successfully!');
      } else {
        const error = await response.json();
        alert(`Error creating player: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating player:', error);
      alert('Error creating player');
    }
  };

  const handleUpdatePlayer = async (playerId, playerData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/players/${playerId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(playerData)
      });
      if (response.ok) {
        await Promise.all([loadPlayers(), loadStats()]);
        setShowPlayerModal(false);
        setEditingPlayer(null);
        alert('Player updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error updating player: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating player:', error);
      alert('Error updating player');
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/players/${playerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        await Promise.all([loadPlayers(), loadStats()]);
        alert('Player deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Error deleting player: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Error deleting player');
    }
  };

  const handleCreateCoach = async (coachData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/coaches`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(coachData)
      });
      if (response.ok) {
        await Promise.all([loadCoaches(), loadStats()]);
        setShowCoachModal(false);
        alert('Coach created successfully!');
      } else {
        const error = await response.json();
        alert(`Error creating coach: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating coach:', error);
      alert('Error creating coach');
    }
  };

  const handleUpdateCoach = async (coachId, coachData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/coaches/${coachId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(coachData)
      });
      if (response.ok) {
        await Promise.all([loadCoaches(), loadStats()]);
        setShowCoachModal(false);
        setEditingCoach(null);
        alert('Coach updated successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to update coach: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating coach:', error);
      alert('Error updating coach');
    }
  };

  const handleDeleteCoach = async (coachId) => {
    if (!window.confirm('Are you sure you want to delete this coach?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/coaches/${coachId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        await Promise.all([loadCoaches(), loadStats()]);
        alert('Coach deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Error deleting coach: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting coach:', error);
      alert('Error deleting coach');
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
      className={`px-4 sm:px-6 py-2 sm:py-3 rounded-none font-medium transition-all duration-200 text-sm sm:text-base mb-2 border ${
        active
          ? isLight
            ? 'bg-sky-50 text-sky-700 border-sky-200'
            : 'bg-sky-600 text-white border-sky-600'
          : isLight
            ? 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-white/10'
      }`}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className={`min-h-screen ${isLight ? 'bg-gray-50' : 'bg-gray-950'} flex items-center justify-center`}>
        <div className={`animate-spin rounded-none h-12 w-12 border-2 ${isLight ? 'border-gray-300 border-t-sky-600' : 'border-gray-700 border-t-sky-400'}`}></div>
      </div>
    );
  }

  if (!userRole || userRole.role !== 'academy_user' || !userRole.academy_id) {
    return (
      <div className={`min-h-screen ${isLight ? 'bg-gray-50' : 'bg-gray-950'} flex items-center justify-center`}>
        <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-900 border border-white/10'} rounded-none p-8 text-center`}>
          <div className={`${isLight ? 'text-red-700' : 'text-red-400'} text-xl mb-2`}>Access Denied</div>
          <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mb-6`}>You don't have permission to access the academy dashboard.</div>
          <button
            onClick={handleSignOut}
            className={`${isLight ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200' : 'bg-gray-800 text-white hover:bg-gray-700 border border-white/10'} px-4 py-2 rounded-none transition-all duration-200`}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex ${isLight ? 'bg-gray-50' : 'bg-gray-950'}`}>
      {/* SideNav */}
      <SideNav
        activeId={activeTab}
        onChange={setActiveTab}
        items={[
          { id: 'overview', label: 'Overview', icon: (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 01.832.445l6 8A1 1 0 0116 12H4a1 1 0 01-.832-1.555l6-8A1 1 0 0110 2z"/></svg>) },
          { id: 'players', label: 'Players', icon: (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM5 13a5 5 0 0110 0v1H5v-1z"/></svg>) },
          { id: 'coaches', label: 'Coaches', icon: (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13 7H7v6h6V7z"/></svg>) },
          { id: 'attendance', label: 'Attendance', icon: (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6 2a1 1 0 00-1 1v2h10V3a1 1 0 00-1-1H6zM5 7h10v9a2 2 0 01-2 2H7a2 2 0 01-2-2V7z"/></svg>) },
          { id: 'performance', label: 'Performance', icon: (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 3h2v14H3V3zm6 4h2v10H9V7zm5-3h2v13h-2V4z"/></svg>) },
          { id: 'analytics', label: 'Analytics', icon: (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 13h3V7H4v6zm5 4h3V3H9v14zm5-8h3v8h-3V9z"/></svg>) },
          { id: 'settings', label: 'Settings', icon: (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.983 1.83a1 1 0 00-1.966 0l-.2 1.197a7.969 7.969 0 00-1.63.943L5.13 3.386a1 1 0 00-1.06 1.06l.584 3.056a7.97 7.97 0 00-.943 1.63L2.414 9.85a1 1 0 000 1.966l1.197.2c.257.588.58 1.145.943 1.63l-.584 3.056a1 1 0 001.06 1.06l3.056-.584c.485.363 1.042.686 1.63.943l.2 1.197a1 1 0 001.966 0l.2-1.197a7.97 7.97 0 001.63-.943l3.056.584a1 1 0 001.06-1.06l-.584-3.056c.363-.485.686-1.042.943-1.63l1.197-.2a1 1 0 000-1.966l-1.197-.2a7.969 7.969 0 00-.943-1.63l.584-3.056a1 1 0 00-1.06-1.06l-3.056.584a7.97 7.97 0 00-1.63-.943l-.2-1.197zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></svg>) },
        ]}
      />

      <div className="flex-1">
        {/* Header */}
        <header className={`${isLight ? 'bg-white/90 border-b border-gray-200 backdrop-blur' : 'bg-gray-900/60 border-b border-white/10 backdrop-blur'} sticky top-0 z-10`}>
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-5">
              <div className="flex items-center">
                <img 
                  src="https://i.ibb.co/1tLZ0Dp1/TMA-LOGO-without-bg.png" 
                  alt="Track My Academy" 
                  className="h-10 w-auto mr-4"
                />
                <div>
                  <h1 className={`text-2xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    Super Admin Dashboard
                  </h1>
                  <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Welcome back, {user?.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <ThemeToggle />
                <button
                  onClick={handleSignOut}
                  className={`${isLight ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200' : 'bg-gray-800 text-white hover:bg-gray-700 border border-white/10'} px-4 py-2 rounded-none transition-all duration-200`}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <div className="p-4 sm:p-6 lg:p-8">
          {successMessage && (
            <div className={`${isLight ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-green-500/10 border border-green-500/30 text-green-400'} px-4 py-3 rounded-none mb-6`}>
              {successMessage}
            </div>
          )}

          <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-900 border border-white/10'} rounded-none overflow-hidden`}>
            {activeTab === 'overview' && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className={`${isLight ? 'bg-gray-50 border border-gray-200 shadow-inner' : 'bg-gray-800 border border-white/10'} rounded-none p-6`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Total Users</p>
                        <p className={`text-3xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{stats.totalUsers}</p>
                      </div>
                      <div className={`p-3 rounded-none bg-blue-100`}>
                        <div className={`text-blue-600`}><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg></div>
                      </div>
                    </div>
                  </div>
                  <div className={`${isLight ? 'bg-gray-50 border border-gray-200 shadow-inner' : 'bg-gray-800 border border-white/10'} rounded-none p-6`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Total Academies</p>
                        <p className={`text-3xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{stats.totalAcademies}</p>
                      </div>
                      <div className={`p-3 rounded-none bg-green-100`}>
                        <div className={`text-green-600`}><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 011.732-1.732l.268.268a2 2 0 002.828 0l.268-.268A2 2 0 0112 8a2 2 0 11-4 4 2 2 0 01-2-2z" clipRule="evenodd" /></svg></div>
                      </div>
                    </div>
                  </div>
                  <div className={`${isLight ? 'bg-gray-50 border border-gray-200 shadow-inner' : 'bg-gray-800 border border-white/10'} rounded-none p-6`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Pending Approvals</p>
                        <p className={`text-3xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{stats.pendingAcademies}</p>
                      </div>
                      <div className={`p-3 rounded-none bg-orange-100`}>
                        <div className={`text-orange-600`}><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg></div>
                      </div>
                    </div>
                  </div>
                  <div className={`${isLight ? 'bg-gray-50 border border-gray-200 shadow-inner' : 'bg-gray-800 border border-white/10'} rounded-none p-6`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Active Users</p>
                        <p className={`text-3xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{stats.activeUsers}</p>
                      </div>
                      <div className={`p-3 rounded-none bg-sky-100`}>
                        <div className={`text-sky-600`}><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" /><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" /></svg></div>
                      </div>
                    </div>
                  </div>
                </div>

                <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>System Overview</h2>
                {overviewLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className={`${isLight ? 'text-gray-600' : 'text-gray-300'}`}>Loading system overview...</div>
                  </div>
                ) : systemOverview ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={`${isLight ? 'bg-gray-50 border border-gray-200 shadow-inner' : 'bg-gray-800 border border-white/10'} rounded-none p-6`}>
                      <h3 className={`${isLight ? 'text-gray-800' : 'text-white'} text-lg font-medium mb-3`}>Recent Activity</h3>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {systemOverview.recent_activities.length > 0 ? systemOverview.recent_activities.map((activity) => (
                          <div key={activity.id} className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-700 border border-white/10'} rounded-none p-3`}>
                            <div className="flex items-start">
                              <div className={`w-2 h-2 rounded-none mr-3 mt-2 ${
                                activity.status === 'success' ? 'bg-green-500' : activity.status === 'pending' ? 'bg-orange-500' : 'bg-blue-500'
                              }`}></div>
                              <div className="flex-1">
                                <p className={`${isLight ? 'text-gray-800' : 'text-gray-200'}`}>{activity.description}</p>
                                <p className={`${isLight ? 'text-gray-500' : 'text-gray-400'} text-xs mt-1`}>
                                  {new Date(activity.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-center py-4`}>No recent activities</div>
                        )}
                      </div>
                    </div>

                    <div className={`${isLight ? 'bg-gray-50 border border-gray-200 shadow-inner' : 'bg-gray-800 border border-white/10'} rounded-none p-6`}>
                      <h3 className={`${isLight ? 'text-gray-800' : 'text-white'} text-lg font-medium mb-3`}>Recently Added Academies</h3>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {systemOverview.recent_academies.length > 0 ? systemOverview.recent_academies.map((academy) => (
                          <div key={academy.id} className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-700 border border-white/10'} rounded-none p-3`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className={`${isLight ? 'text-gray-900' : 'text-white'} font-medium`}>{academy.name}</h4>
                                <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Owner: {academy.owner_name}</p>
                                <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>{academy.location} • {academy.sports_type}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-none text-xs font-medium border ${
                                academy.status === 'approved' 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : 'bg-orange-50 text-orange-700 border-orange-200'
                              }`}>{academy.status}</span>
                            </div>
                            <p className={`${isLight ? 'text-gray-500' : 'text-gray-400'} text-xs mt-2`}>
                              Added: {new Date(academy.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        )) : (
                          <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-center py-4`}>No academies yet</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Failed to load system overview. Please try again.</div>
                    <button 
                      onClick={loadSystemOverview}
                      className={`mt-4 ${isLight ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white'} px-4 py-2 rounded-none transition-colors`}
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>User Management</h2>
                    <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm mt-1`}>Academy owners and administrators</p>
                  </div>
                </div>
                {users.length === 0 ? (
                  <div className="text-center py-12">
                    <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mb-2`}>No users found</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((u) => (
                      <UserCard key={u.id} user={u} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'academies' && (
              <div className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Academy Management</h2>
                  <div className="flex gap-3 items-center">
                    <label className={`flex items-center gap-2 text-sm ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                      <input
                        type="checkbox"
                        checked={selectedAcademies.length === academies.length && academies.length > 0}
                        onChange={handleSelectAll}
                        className={`${isLight ? 'rounded-none border-gray-300 text-sky-600 focus:ring-sky-500' : 'rounded-none bg-gray-800 border-gray-600 text-sky-500 focus:ring-sky-500'}`}
                      />
                      Select All
                    </label>
                    {selectedAcademies.length > 0 && (
                      <button 
                        onClick={handleBulkApprove}
                        className={`${isLight ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'} px-4 py-2 rounded-none transition-colors`}
                      >
                        Approve Selected ({selectedAcademies.length})
                      </button>
                    )}
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className={`${isLight ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white'} px-4 py-2 rounded-none transition-colors`}
                    >
                      Add New Academy
                    </button>
                  </div>
                </div>

                {academies.length === 0 ? (
                  <div className="text-center py-12">
                    <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mb-2`}>No academies found</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {academies.map((academy) => (
                      <AcademyCard
                        key={academy.id}
                        academy={academy}
                        selected={selectedAcademies.includes(academy.id)}
                        onSelect={() => handleSelectAcademy(academy.id)}
                        onApprove={() => handleApproveAcademy(academy.id, academy.name)}
                        onReject={() => handleRejectAcademy(academy.id, academy.name)}
                        onEdit={() => handleEditAcademy(academy)}
                        onDelete={() => handleDeleteAcademy(academy.id, academy.name)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'demo-requests' && (
              <div className="p-6">
                <DemoRequestsTable />
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="p-6">
                <BillingDashboard />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Create Academy Modal */}
      <CreateAcademyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleAcademyCreated}
      />

      {/* Edit Academy Modal */}
      <EditAcademyModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAcademy(null);
        }}
        onSuccess={handleAcademyUpdated}
        academy={selectedAcademy}
      />
    </div>
  );
};

export default AcademyDashboard;
