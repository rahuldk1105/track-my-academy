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
    <div className={`min-h-screen ${isLight ? 'bg-gray-50' : 'bg-gray-950'}`}>
      {/* Header */}
      <header className={`${isLight ? 'bg-white/90 border-b border-gray-200 backdrop-blur' : 'bg-gray-900/60 border-b border-white/10 backdrop-blur'} sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div className="flex items-center">
              {/* Academy Logo */}
              <div className={`flex items-center ${isLight ? 'bg-gray-100' : 'bg-gray-800'} rounded-none px-4 py-2 mr-6 border ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                <img 
                  src={academyLogo || "https://i.ibb.co/1Z8cJ6q/academy-default-logo.png"} 
                  alt={`${academyData?.name || 'Academy'} Logo`} 
                  className={`h-12 w-12 rounded-none object-cover mr-3 ${isLight ? 'border-gray-200' : 'border-white/10'} border`}
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
                className={`${isLight ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200' : 'bg-gray-800 text-white hover:bg-gray-700 border border-white/10'} px-4 py-2 rounded-none transition-all duration-200`}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
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

          <div className="flex-1 space-y-6">
            {/* Academy Info */}
            <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-900 border border-white/10'} rounded-none p-6`}>
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

            {/* Content by tab */}
            <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-900 border border-white/10'} rounded-none overflow-hidden`}>
              {activeTab === 'overview' && (
                <div className="p-6">
                  <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>Academy Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-800 border border-white/10'} rounded-none p-4`}>
                      <h3 className="text-sm font-medium text-blue-600 mb-1">Total Players</h3>
                      <p className={`text-2xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{stats.total_players || 0}</p>
                      <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Limit: {stats.player_limit || 50}</p>
                    </div>
                    <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-800 border border-white/10'} rounded-none p-4`}>
                      <h3 className="text-sm font-medium text-emerald-600 mb-1">Active Coaches</h3>
                      <p className={`text-2xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{stats.active_coaches || 0}</p>
                      <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Limit: {stats.coach_limit || 10}</p>
                    </div>
                    <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-800 border border-white/10'} rounded-none p-4`}>
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
                        className={`${isLight ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100' : 'bg-blue-600/20 text-blue-300 border border-blue-600/30 hover:bg-blue-600/30'} px-4 py-3 rounded-none text-left transition-all duration-200`}
                      >
                        + Add New Player
                      </button>
                      <button 
                        onClick={() => { setEditingCoach(null); setShowCoachModal(true); }}
                        className={`${isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' : 'bg-emerald-600/20 text-emerald-300 border border-emerald-600/30 hover:bg-emerald-600/30'} px-4 py-3 rounded-none text-left transition-all duration-200`}
                      >
                        + Add New Coach
                      </button>
                      <button 
                        onClick={() => setActiveTab('players')}
                        className={`${isLight ? 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100' : 'bg-sky-600/20 text-sky-300 border border-sky-600/30 hover:bg-sky-600/30'} px-4 py-3 rounded-none text-left transition-all duration-200`}
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
                    <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Players</h2>
                    <button
                      onClick={() => { setEditingPlayer(null); setShowPlayerModal(true); }}
                      className={`${isLight ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white'} px-4 py-2 rounded-none transition-colors`}
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
                        className={`${isLight ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white'} px-6 py-3 rounded-none transition-colors`}
                      >
                        Add Your First Player
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {players.map((player) => (
                        <PlayerCard
                          key={player.id}
                          player={player}
                          onEdit={(pl) => { setEditingPlayer(pl); setShowPlayerModal(true); }}
                          onDelete={handleDeletePlayer}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'coaches' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Coaches</h2>
                    <button
                      onClick={() => { setEditingCoach(null); setShowCoachModal(true); }}
                      className={`${isLight ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'} px-4 py-2 rounded-none transition-colors`}
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
                        className={`${isLight ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'} px-6 py-3 rounded-none transition-colors`}
                      >
                        Add Your First Coach
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {coaches.map((coach) => (
                        <CoachCard
                          key={coach.id}
                          coach={coach}
                          onEdit={(c) => { setEditingCoach(c); setShowCoachModal(true); }}
                          onDelete={(id) => handleDeleteCoach(id)}
                        />
                      ))}
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
          </div>{/* right content */}
        </div>{/* layout flex */}
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
