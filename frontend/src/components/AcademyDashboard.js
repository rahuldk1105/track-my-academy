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
        alert(`Error updating coach: ${error.detail || 'Unknown error'}`);
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
      className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base mb-2 border ${
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
        <div className={`animate-spin rounded-full h-12 w-12 border-2 ${isLight ? 'border-gray-300 border-t-sky-600' : 'border-gray-700 border-t-sky-400'}`}></div>
      </div>
    );
  }

  if (!userRole || userRole.role !== 'academy_user' || !userRole.academy_id) {
    return (
      <div className={`min-h-screen ${isLight ? 'bg-gray-50' : 'bg-gray-950'} flex items-center justify-center`}>
        <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-900 border border-white/10'} rounded-xl p-8 text-center`}>
          <div className={`${isLight ? 'text-red-700' : 'text-red-400'} text-xl mb-2`}>Access Denied</div>
          <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mb-6`}>You don't have permission to access the academy dashboard.</div>
          <button
            onClick={handleSignOut}
            className={`${isLight ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200' : 'bg-gray-800 text-white hover:bg-gray-700 border border-white/10'} px-4 py-2 rounded-lg transition-all duration-200`}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isLight ? 'bg-gray-50' : 'bg-gray-950'}`}>
      {/* Header */}
      <header className={`${isLight ? 'bg-white/90 border-b border-gray-200 backdrop-blur' : 'bg-gray-900/60 border-b border-white/10 backdrop-blur'} sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div className="flex items-center">
              {/* Academy Logo */}
              <div className={`flex items-center ${isLight ? 'bg-gray-100' : 'bg-gray-800'} rounded-xl px-4 py-2 mr-6 border ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                <img 
                  src={academyLogo || "https://i.ibb.co/1Z8cJ6q/academy-default-logo.png"} 
                  alt={`${academyData?.name || 'Academy'} Logo`} 
                  className={`h-12 w-12 rounded-lg object-cover mr-3 ${isLight ? 'border-gray-200' : 'border-white/10'} border`}
                  onError={(e) => { e.target.src = "https://i.ibb.co/1Z8cJ6q/academy-default-logo.png"; }}
                />
                <div>
                  <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-semibold text-lg`}>
                    {academyData?.name || 'Academy'}
                  </div>
                  <div className={`${isLight ? 'text-gray-600' : 'text-sky-300'} text-sm font-medium`}>
                    Academy Portal
                  </div>
                </div>
              </div>
              <div>
                <h1 className={`text-2xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  Dashboard
                </h1>
                <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Welcome back, {user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                Logged in as Academy Owner
              </div>
              <ThemeToggle />
              <button
                onClick={handleSignOut}
                className={`${isLight ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200' : 'bg-gray-800 text-white hover:bg-gray-700 border border-white/10'} px-4 py-2 rounded-lg transition-all duration-200`}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Academy Info Card */}
        <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-900 border border-white/10'} rounded-xl p-6 mb-8`}>
          <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-2`}>Academy Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Academy Name</p>
              <p className={`${isLight ? 'text-gray-900' : 'text-white'} font-medium`}>{academyData?.name || 'Loading...'}</p>
            </div>
            <div>
              <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Academy ID</p>
              <p className={`${isLight ? 'text-gray-900' : 'text-white'} font-mono text-sm`}>{userRole.academy_id}</p>
            </div>
            <div>
              <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>User Role</p>
              <p className="text-sky-600 dark:text-sky-400 font-medium">Academy Owner</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
          <TabButton id="overview" label="Overview" active={activeTab === 'overview'} onClick={setActiveTab} />
          <TabButton id="players" label="Players" active={activeTab === 'players'} onClick={setActiveTab} />
          <TabButton id="coaches" label="Coaches" active={activeTab === 'coaches'} onClick={setActiveTab} />
          <TabButton id="attendance" label="Attendance" active={activeTab === 'attendance'} onClick={setActiveTab} />
          <TabButton id="performance" label="Performance" active={activeTab === 'performance'} onClick={setActiveTab} />
          <TabButton id="analytics" label="Analytics" active={activeTab === 'analytics'} onClick={setActiveTab} />
          <TabButton id="settings" label="Settings" active={activeTab === 'settings'} onClick={setActiveTab} />
        </div>

        {/* Content */}
        <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-900 border border-white/10'} rounded-xl overflow-hidden`}>
          {activeTab === 'overview' && (
            <div className="p-6">
              <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>Academy Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-800 border border-white/10'} rounded-lg p-4`}>
                  <h3 className="text-sm font-medium text-blue-600 mb-1">Total Players</h3>
                  <p className={`text-2xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{stats.total_players || 0}</p>
                  <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Limit: {stats.player_limit || 50}</p>
                </div>
                <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-800 border border-white/10'} rounded-lg p-4`}>
                  <h3 className="text-sm font-medium text-emerald-600 mb-1">Active Coaches</h3>
                  <p className={`text-2xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{stats.active_coaches || 0}</p>
                  <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Limit: {stats.coach_limit || 10}</p>
                </div>
                <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-800 border border-white/10'} rounded-lg p-4`}>
                  <h3 className="text-sm font-medium text-purple-600 mb-1">Active Players</h3>
                  <p className={`text-2xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{stats.active_players || 0}</p>
                  <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Currently Active</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className={`text-lg font-medium ${isLight ? 'text-gray-900' : 'text-white'} mb-3`}>Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button 
                    onClick={() => { setEditingPlayer(null); setShowPlayerModal(true); }}
                    className={`${isLight ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100' : 'bg-blue-600/20 text-blue-300 border border-blue-600/30 hover:bg-blue-600/30'} px-4 py-3 rounded-lg text-left transition-all duration-200`}
                  >
                    + Add New Player
                  </button>
                  <button 
                    onClick={() => { setEditingCoach(null); setShowCoachModal(true); }}
                    className={`${isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' : 'bg-emerald-600/20 text-emerald-300 border border-emerald-600/30 hover:bg-emerald-600/30'} px-4 py-3 rounded-lg text-left transition-all duration-200`}
                  >
                    + Add New Coach
                  </button>
                  <button 
                    onClick={() => setActiveTab('players')}
                    className={`${isLight ? 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100' : 'bg-sky-600/20 text-sky-300 border border-sky-600/30 hover:bg-sky-600/30'} px-4 py-3 rounded-lg text-left transition-all duration-200`}
                  >
                    View All Players
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'players' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Player Management</h2>
                <button
                  onClick={() => { setEditingPlayer(null); setShowPlayerModal(true); }}
                  className={`${isLight ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white'} px-4 py-2 rounded-lg transition-colors`}
                >
                  + Add Player
                </button>
              </div>

              {players.length === 0 ? (
                <div className="text-center py-12">
                  <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mb-2`}>No players found</div>
                  <div className={`${isLight ? 'text-gray-500' : 'text-gray-500'} text-sm mb-4`}>
                    Start by adding your first player to the academy.
                  </div>
                  <button
                    onClick={() => { setEditingPlayer(null); setShowPlayerModal(true); }}
                    className={`${isLight ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white'} px-6 py-3 rounded-lg transition-colors`}
                  >
                    Add Your First Player
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`${isLight ? 'border-b border-gray-200 bg-gray-50' : 'border-b border-white/10 bg-gray-800'}`}>
                        <th className={`text-left ${isLight ? 'text-gray-700' : 'text-gray-200'} font-medium py-3 px-4`}>Name</th>
                        <th className={`text-left ${isLight ? 'text-gray-700' : 'text-gray-200'} font-medium py-3 px-4`}>Position</th>
                        <th className={`text-left ${isLight ? 'text-gray-700' : 'text-gray-200'} font-medium py-3 px-4`}>Reg #</th>
                        <th className={`text-left ${isLight ? 'text-gray-700' : 'text-gray-200'} font-medium py-3 px-4`}>Age</th>
                        <th className={`text-left ${isLight ? 'text-gray-700' : 'text-gray-200'} font-medium py-3 px-4`}>Login Access</th>
                        <th className={`text-left ${isLight ? 'text-gray-700' : 'text-gray-200'} font-medium py-3 px-4`}>Status</th>
                        <th className={`text-left ${isLight ? 'text-gray-700' : 'text-gray-200'} font-medium py-3 px-4`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((player) => (
                        <tr key={player.id} className={`${isLight ? 'border-b border-gray-100 hover:bg-gray-50' : 'border-b border-white/5 hover:bg-gray-800/60'}`}>
                          <td className="py-3 px-4">
                            <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-medium`}>{player.first_name} {player.last_name}</div>
                            <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>{player.email}</div>
                          </td>
                          <td className={`py-3 px-4 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>{player.position || 'Not specified'}</td>
                          <td className="py-3 px-4">
                            <span className={`${isLight ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-blue-600/20 text-blue-300 border border-blue-600/30'} px-2 py-1 rounded-full text-xs`}>
                              {player.registration_number || 'Not Assigned'}
                            </span>
                          </td>
                          <td className={`py-3 px-4 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>{player.age || 'N/A'}</td>
                          <td className="py-3 px-4">
                            {player.has_login ? (
                              <div>
                                <span className={`${isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-600/20 text-emerald-300 border border-emerald-600/30'} px-2 py-1 rounded-full text-xs`}>
                                  ✓ Login Enabled
                                </span>
                                {player.default_password && !player.password_changed && (
                                  <div className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'} mt-1`}>
                                    Default Password: <span className="font-mono ${isLight ? 'bg-gray-100' : 'bg-gray-800'} px-1 rounded">{player.default_password}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className={`${isLight ? 'bg-gray-100 text-gray-700 border border-gray-200' : 'bg-gray-700/40 text-gray-300 border border-white/10'} px-2 py-1 rounded-full text-xs`}>
                                No Login Access
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                              player.status === 'active' 
                                ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-600/20 text-emerald-300 border-emerald-600/30'
                                : isLight ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-gray-700/40 text-gray-300 border-white/10'
                            }`}>
                              {player.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-3">
                              <button
                                onClick={() => { setEditingPlayer(player); setShowPlayerModal(true); }}
                                className={`${isLight ? 'text-sky-700 hover:underline' : 'text-sky-300 hover:underline'} text-sm`}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeletePlayer(player.id)}
                                className={`${isLight ? 'text-red-700 hover:underline' : 'text-red-300 hover:underline'} text-sm`}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'coaches' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Coach Management</h2>
                <button
                  onClick={() => { setEditingCoach(null); setShowCoachModal(true); }}
                  className={`${isLight ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'} px-4 py-2 rounded-lg transition-colors`}
                >
                  + Add Coach
                </button>
              </div>

              {coaches.length === 0 ? (
                <div className="text-center py-12">
                  <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mb-2`}>No coaches found</div>
                  <div className="text-sm text-gray-500 mb-4">
                    Start by adding your first coach to the academy.
                  </div>
                  <button
                    onClick={() => { setEditingCoach(null); setShowCoachModal(true); }}
                    className={`${isLight ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'} px-6 py-3 rounded-lg transition-colors`}
                  >
                    Add Your First Coach
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`${isLight ? 'border-b border-gray-200 bg-gray-50' : 'border-b border-white/10 bg-gray-800'}`}>
                        <th className={`text-left ${isLight ? 'text-gray-700' : 'text-gray-200'} font-medium py-3 px-4`}>Name</th>
                        <th className={`text-left ${isLight ? 'text-gray-700' : 'text-gray-200'} font-medium py-3 px-4`}>Specialization</th>
                        <th className={`text-left ${isLight ? 'text-gray-700' : 'text-gray-200'} font-medium py-3 px-4`}>Experience</th>
                        <th className={`text-left ${isLight ? 'text-gray-700' : 'text-gray-200'} font-medium py-3 px-4`}>Status</th>
                        <th className={`text-left ${isLight ? 'text-gray-700' : 'text-gray-200'} font-medium py-3 px-4`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coaches.map((coach) => (
                        <tr key={coach.id} className={`${isLight ? 'border-b border-gray-100 hover:bg-gray-50' : 'border-b border-white/5 hover:bg-gray-800/60'}`}>
                          <td className="py-3 px-4">
                            <div className={`${isLight ? 'text-gray-900' : 'text-white'} font-medium`}>{coach.first_name} {coach.last_name}</div>
                            <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>{coach.email}</div>
                          </td>
                          <td className={`${isLight ? 'text-gray-700' : 'text-gray-300'} py-3 px-4`}>{coach.specialization || 'General'}</td>
                          <td className={`${isLight ? 'text-gray-700' : 'text-gray-300'} py-3 px-4`}>
                            {coach.experience_years ? `${coach.experience_years} years` : 'Not specified'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                              coach.status === 'active' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}>
                              {coach.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-3">
                              <button
                                onClick={() => { setEditingCoach(coach); setShowCoachModal(true); }}
                                className={`${isLight ? 'text-sky-700 hover:underline' : 'text-sky-300 hover:underline'} text-sm`}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCoach(coach.id)}
                                className={`${isLight ? 'text-red-700 hover:underline' : 'text-red-300 hover:underline'} text-sm`}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <AttendanceTracker />
          )}

          {activeTab === 'performance' && (
            <PerformanceAnalytics />
          )}

          {activeTab === 'analytics' && (
            <AcademyAnalytics />
          )}

          {activeTab === 'settings' && (
            <AcademySettingsForm />
          )}
        </div>
      </div>

      {/* Player Modal */}
      <PlayerModal
        isOpen={showPlayerModal}
        onClose={() => { setShowPlayerModal(false); setEditingPlayer(null); }}
        onSubmit={editingPlayer ? handleUpdatePlayer : handleCreatePlayer}
        player={editingPlayer}
        isEditing={!!editingPlayer}
      />

      {/* Coach Modal */}
      <CoachModal
        isOpen={showCoachModal}
        onClose={() => { setShowCoachModal(false); setEditingCoach(null); }}
        onSubmit={editingCoach ? handleUpdateCoach : handleCreateCoach}
        coach={editingCoach}
        isEditing={!!editingCoach}
      />
    </div>
  );
};

export default AcademyDashboard;