import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import PlayerModal from './PlayerModal';
import CoachModal from './CoachModal';
import AcademySettingsForm from './AcademySettingsForm';
import AcademyAnalytics from './AcademyAnalytics';
import AttendanceTracker from './AttendanceTracker';
import PerformanceAnalytics from './PerformanceAnalytics';

const AcademyDashboard = () => {
  const { user, signOut, token, userRole } = useAuth();
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

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    // Only load academy data if user has academy role
    if (userRole && userRole.role === 'academy_user' && userRole.academy_id) {
      loadAcademyData();
    } else if (userRole && userRole.role !== 'academy_user') {
      // Redirect super admin to regular dashboard
      navigate('/dashboard');
    }
  }, [userRole, navigate]);

  const loadAcademyData = async () => {
    try {
      setLoading(true);
      
      // Set the academy data from role info
      setAcademyData({
        id: userRole.academy_id,
        name: userRole.academy_name,
      });

      // Load academy settings to get logo
      await loadAcademySettings();

      // Load stats, players, and coaches
      await Promise.all([
        loadStats(),
        loadPlayers(),
        loadCoaches()
      ]);
      
    } catch (error) {
      console.error('Error loading academy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAcademySettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
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
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
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
    if (!window.confirm('Are you sure you want to delete this player?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/players/${playerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
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
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
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
    if (!window.confirm('Are you sure you want to delete this coach?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/coaches/${coachId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
      className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base mb-2 ${
        active
          ? 'bg-sky-500 text-white shadow-lg'
          : 'text-gray-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  // Show access denied if user doesn't have academy role
  if (!userRole || userRole.role !== 'academy_user' || !userRole.academy_id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Access Denied</div>
          <div className="text-gray-400 mb-6">You don't have permission to access the academy dashboard.</div>
          <button
            onClick={handleSignOut}
            className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 px-4 py-2 rounded-lg transition-all duration-300"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              {/* Academy Logo - Prominently displayed */}
              <div className="flex items-center bg-white/10 rounded-xl px-4 py-2 mr-6">
                <img 
                  src={academyLogo || "https://i.ibb.co/1Z8cJ6q/academy-default-logo.png"} 
                  alt={`${academyData?.name || 'Academy'} Logo`} 
                  className="h-12 w-12 rounded-lg object-cover mr-3 border border-white/20 shadow-lg"
                  onError={(e) => {
                    e.target.src = "https://i.ibb.co/1Z8cJ6q/academy-default-logo.png";
                  }}
                />
                <div>
                  <div className="text-white font-semibold text-lg">
                    {academyData?.name || 'Academy'}
                  </div>
                  <div className="text-sky-400 text-sm font-medium">
                    Academy Portal
                  </div>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-white bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-gray-400 text-sm">Welcome back, {user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                Logged in as Academy Owner
              </div>
              <button
                onClick={handleSignOut}
                className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 px-4 py-2 rounded-lg transition-all duration-300"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Academy Info Card */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-xl font-semibold text-white mb-2">Academy Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Academy Name</p>
              <p className="text-white font-medium">{academyData?.name || 'Loading...'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Academy ID</p>
              <p className="text-white font-mono text-sm">{userRole.academy_id}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">User Role</p>
              <p className="text-sky-400 font-medium">Academy Owner</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap space-x-2 sm:space-x-4 mb-6">
          <TabButton
            id="overview"
            label="Overview"
            active={activeTab === 'overview'}
            onClick={setActiveTab}
          />
          <TabButton
            id="players"
            label="Players"
            active={activeTab === 'players'}
            onClick={setActiveTab}
          />
          <TabButton
            id="coaches"
            label="Coaches"
            active={activeTab === 'coaches'}
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
            id="analytics"
            label="Analytics"
            active={activeTab === 'analytics'}
            onClick={setActiveTab}
          />
          <TabButton
            id="settings"
            label="Settings"
            active={activeTab === 'settings'}
            onClick={setActiveTab}
          />
        </div>

        {/* Content */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
          {activeTab === 'overview' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Academy Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
                  <h3 className="text-lg font-semibold text-blue-400 mb-2">Total Players</h3>
                  <p className="text-2xl font-bold text-white">{stats.total_players || 0}</p>
                  <p className="text-sm text-gray-400">Limit: {stats.player_limit || 50}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
                  <h3 className="text-lg font-semibold text-green-400 mb-2">Active Coaches</h3>
                  <p className="text-2xl font-bold text-white">{stats.active_coaches || 0}</p>
                  <p className="text-sm text-gray-400">Limit: {stats.coach_limit || 10}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
                  <h3 className="text-lg font-semibold text-purple-400 mb-2">Active Players</h3>
                  <p className="text-2xl font-bold text-white">{stats.active_players || 0}</p>
                  <p className="text-sm text-gray-400">Currently Active</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-300 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button 
                    onClick={() => {
                      setEditingPlayer(null);
                      setShowPlayerModal(true);
                    }}
                    className="bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 px-4 py-3 rounded-lg transition-all duration-300 text-left"
                  >
                    + Add New Player
                  </button>
                  <button 
                    onClick={() => {
                      setEditingCoach(null);
                      setShowCoachModal(true);
                    }}
                    className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 px-4 py-3 rounded-lg transition-all duration-300 text-left"
                  >
                    + Add New Coach
                  </button>
                  <button 
                    onClick={() => setActiveTab('players')}
                    className="bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 px-4 py-3 rounded-lg transition-all duration-300 text-left"
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
                <h2 className="text-xl font-semibold text-white">Player Management</h2>
                <button
                  onClick={() => {
                    setEditingPlayer(null);
                    setShowPlayerModal(true);
                  }}
                  className="bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 px-4 py-2 rounded-lg transition-all duration-300"
                >
                  + Add Player
                </button>
              </div>

              {players.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">No players found</div>
                  <div className="text-sm text-gray-500 mb-4">
                    Start by adding your first player to the academy.
                  </div>
                  <button
                    onClick={() => {
                      setEditingPlayer(null);
                      setShowPlayerModal(true);
                    }}
                    className="bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 px-6 py-3 rounded-lg transition-all duration-300"
                  >
                    Add Your First Player
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-gray-300 font-medium py-3 px-4">Name</th>
                        <th className="text-left text-gray-300 font-medium py-3 px-4">Position</th>
                        <th className="text-left text-gray-300 font-medium py-3 px-4">Reg #</th>
                        <th className="text-left text-gray-300 font-medium py-3 px-4">Age</th>
                        <th className="text-left text-gray-300 font-medium py-3 px-4">Status</th>
                        <th className="text-left text-gray-300 font-medium py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((player) => (
                        <tr key={player.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-4">
                            <div className="text-white font-medium">{player.first_name} {player.last_name}</div>
                            <div className="text-gray-400 text-sm">{player.email}</div>
                          </td>
                          <td className="py-3 px-4 text-gray-300">{player.position || 'Not specified'}</td>
                          <td className="py-3 px-4">
                            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-sm">
                              {player.registration_number || 'Not Assigned'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-300">{player.age || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-sm ${
                              player.status === 'active' 
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {player.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingPlayer(player);
                                  setShowPlayerModal(true);
                                }}
                                className="text-blue-400 hover:text-blue-300 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeletePlayer(player.id)}
                                className="text-red-400 hover:text-red-300 text-sm"
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
                <h2 className="text-xl font-semibold text-white">Coach Management</h2>
                <button
                  onClick={() => {
                    setEditingCoach(null);
                    setShowCoachModal(true);
                  }}
                  className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 px-4 py-2 rounded-lg transition-all duration-300"
                >
                  + Add Coach
                </button>
              </div>

              {coaches.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">No coaches found</div>
                  <div className="text-sm text-gray-500 mb-4">
                    Start by adding your first coach to the academy.
                  </div>
                  <button
                    onClick={() => {
                      setEditingCoach(null);
                      setShowCoachModal(true);
                    }}
                    className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 px-6 py-3 rounded-lg transition-all duration-300"
                  >
                    Add Your First Coach
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-gray-300 font-medium py-3 px-4">Name</th>
                        <th className="text-left text-gray-300 font-medium py-3 px-4">Specialization</th>
                        <th className="text-left text-gray-300 font-medium py-3 px-4">Experience</th>
                        <th className="text-left text-gray-300 font-medium py-3 px-4">Status</th>
                        <th className="text-left text-gray-300 font-medium py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coaches.map((coach) => (
                        <tr key={coach.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-4">
                            <div className="text-white font-medium">{coach.first_name} {coach.last_name}</div>
                            <div className="text-gray-400 text-sm">{coach.email}</div>
                          </td>
                          <td className="py-3 px-4 text-gray-300">{coach.specialization || 'General'}</td>
                          <td className="py-3 px-4 text-gray-300">
                            {coach.experience_years ? `${coach.experience_years} years` : 'Not specified'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-sm ${
                              coach.status === 'active' 
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {coach.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingCoach(coach);
                                  setShowCoachModal(true);
                                }}
                                className="text-blue-400 hover:text-blue-300 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCoach(coach.id)}
                                className="text-red-400 hover:text-red-300 text-sm"
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
        onClose={() => {
          setShowPlayerModal(false);
          setEditingPlayer(null);
        }}
        onSubmit={editingPlayer ? handleUpdatePlayer : handleCreatePlayer}
        player={editingPlayer}
        isEditing={!!editingPlayer}
      />

      {/* Coach Modal */}
      <CoachModal
        isOpen={showCoachModal}
        onClose={() => {
          setShowCoachModal(false);
          setEditingCoach(null);
        }}
        onSubmit={editingCoach ? handleUpdateCoach : handleCreateCoach}
        coach={editingCoach}
        isEditing={!!editingCoach}
      />
    </div>
  );
};

export default AcademyDashboard;