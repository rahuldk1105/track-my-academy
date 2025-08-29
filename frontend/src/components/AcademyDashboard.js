import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import PlayerModal from './PlayerModal';
import CoachModal from './CoachModal';
import AcademySettings from './AcademySettings';
import AcademyProfile from './AcademyProfile';
import AttendanceTracker from './AttendanceTracker';
import PerformanceAnalytics from './PerformanceAnalytics';
import ThemeToggle from './ThemeToggle';
import SideNav from './SideNav';
import PlayerCard from './PlayerCard';
import CoachCard from './CoachCard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import { 
  Users, UserCheck, TrendingUp, Calendar, Award, Clock, 
  Activity, Target, BookOpen, Search, Bell, Settings, Plus,
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, User, Building2
} from 'lucide-react';

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
  const [analytics, setAnalytics] = useState(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editingCoach, setEditingCoach] = useState(null);
  const [academyLogo, setAcademyLogo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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
      await Promise.all([loadStats(), loadPlayers(), loadCoaches(), loadAnalytics()]);
    } catch (error) {
      console.error('Error loading academy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/analytics`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const analyticsData = await response.json();
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
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
        } else if (settings.logo_url) {
          setAcademyLogo(settings.logo_url);
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

  // Chart color schemes
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
  
  // Prepare chart data
  const getPlayerDistributionData = () => {
    if (!analytics?.player_analytics?.position_distribution) return [];
    return Object.entries(analytics.player_analytics.position_distribution).map(([position, count]) => ({
      name: position,
      value: count,
      percentage: ((count / (stats.total_players || 1)) * 100).toFixed(1)
    }));
  };

  const getAgeDistributionData = () => {
    if (!analytics?.player_analytics?.age_distribution) return [];
    return Object.entries(analytics.player_analytics.age_distribution).map(([ageGroup, count]) => ({
      ageGroup: ageGroup.replace('_', '-'),
      players: count
    }));
  };

  const getMonthlyGrowthData = () => {
    // Mock monthly growth data - replace with real data from backend
    return [
      { month: 'Jan', players: 12, coaches: 3 },
      { month: 'Feb', players: 15, coaches: 3 },
      { month: 'Mar', players: 18, coaches: 4 },
      { month: 'Apr', players: 22, coaches: 4 },
      { month: 'May', players: 28, coaches: 5 },
      { month: 'Jun', players: stats.total_players || 30, coaches: stats.total_coaches || 5 },
    ];
  };

  const getPerformanceData = () => {
    // Mock performance data - replace with real data
    return [
      { week: 'W1', attendance: 85, performance: 78 },
      { week: 'W2', attendance: 88, performance: 82 },
      { week: 'W3', attendance: 92, performance: 85 },
      { week: 'W4', attendance: 87, performance: 88 },
    ];
  };

  const filteredPlayers = players.filter(player => 
    player.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCoaches = coaches.filter(coach => 
    coach.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={`min-h-screen ${isLight ? 'bg-gray-50' : 'bg-gray-900'} flex items-center justify-center`}>
        <div className="flex flex-col items-center space-y-4">
          <div className={`animate-spin rounded-full h-12 w-12 border-4 ${isLight ? 'border-gray-300 border-t-blue-600' : 'border-gray-600 border-t-blue-400'}`}></div>
          <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Loading academy dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userRole || userRole.role !== 'academy_user' || !userRole.academy_id) {
    return (
      <div className={`min-h-screen ${isLight ? 'bg-gray-50' : 'bg-gray-900'} flex items-center justify-center`}>
        <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-8 text-center shadow-lg border ${isLight ? 'border-gray-200' : 'border-gray-700'} max-w-md`}>
          <div className={`${isLight ? 'text-red-600' : 'text-red-400'} text-xl mb-2 font-semibold`}>Access Denied</div>
          <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mb-6`}>You don't have permission to access the academy dashboard.</div>
          <button
            onClick={async () => {
              try {
                await signOut();
                navigate('/');
              } catch (error) {
                console.error('Error signing out:', error);
              }
            }}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isLight ? 'bg-gray-50' : 'bg-gray-900'}`}>
      {/* Modern Sidebar */}
      <div className="flex">
        <nav className={`${isLight ? 'bg-white border-r border-gray-200' : 'bg-gray-800 border-r border-gray-700'} w-64 min-h-screen fixed left-0 top-0 z-20`}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <img 
                src={academyLogo ? `${API_BASE_URL}${academyLogo}` : "https://i.ibb.co/1Z8cJ6q/academy-default-logo.png"} 
                alt="Academy Logo" 
                className="h-12 w-12 rounded-xl object-cover border-2 border-gray-200 shadow-md"
              />
              <div>
                <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {academyData?.name || 'Academy'}
                </h2>
                <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Dashboard</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              {[
                { id: 'overview', label: 'Overview', icon: <Activity className="w-5 h-5" /> },
                { id: 'players', label: 'Players', icon: <Users className="w-5 h-5" /> },
                { id: 'coaches', label: 'Coaches', icon: <UserCheck className="w-5 h-5" /> },
                { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-5 h-5" /> },
                { id: 'performance', label: 'Performance', icon: <TrendingUp className="w-5 h-5" /> },
                { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
                { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === item.id
                      ? `${isLight ? 'bg-blue-50 text-blue-600 shadow-sm' : 'bg-blue-600/20 text-blue-400'}`
                      : `${isLight ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-400 hover:bg-gray-700'}`
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 ml-64">
          {/* Top Bar */}
          <header className={`${isLight ? 'bg-white/80 backdrop-blur-sm border-b border-gray-200' : 'bg-gray-800/80 backdrop-blur-sm border-b border-gray-700'} sticky top-0 z-10`}>
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-6">
                {/* Academy Logo in Header */}
                <div className="flex items-center gap-3">
                  <img 
                    src={academyLogo ? `${API_BASE_URL}${academyLogo}` : "https://i.ibb.co/1Z8cJ6q/academy-default-logo.png"} 
                    alt="Academy Logo" 
                    className="h-8 w-8 rounded-lg object-cover border border-gray-200 shadow-sm"
                  />
                  <div className="hidden md:block">
                    <h1 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </h1>
                    <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                      {academyData?.name || 'Academy Dashboard'}
                    </p>
                  </div>
                </div>
                {(activeTab === 'players' || activeTab === 'coaches') && (
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isLight ? 'text-gray-400' : 'text-gray-500'}`} />
                    <input
                      type="text"
                      placeholder={`Search ${activeTab}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`pl-10 pr-4 py-2 w-64 rounded-lg border ${
                        isLight 
                          ? 'border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500' 
                          : 'border-gray-600 bg-gray-700 focus:bg-gray-600 focus:border-blue-400 text-white'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200`}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button className={`p-2 rounded-lg ${isLight ? 'hover:bg-gray-100' : 'hover:bg-gray-700'} transition-colors duration-200`}>
                  <Bell className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-gray-400'}`} />
                </button>
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-6 space-y-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Academy Overview Card */}
                <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-8 shadow-lg border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Academy Overview</h2>
                    <div className="flex items-center gap-4">
                      <img 
                        src={academyLogo ? `${API_BASE_URL}${academyLogo}` : "https://i.ibb.co/1Z8cJ6q/academy-default-logo.png"} 
                        alt="Academy Logo" 
                        className="h-16 w-16 rounded-2xl object-cover border-2 border-gray-200 shadow-lg"
                      />
                      <div className="text-right">
                        <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                          {academyData?.name || 'Academy Name'}
                        </h3>
                        <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                          Academy Dashboard
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className={`p-4 rounded-xl ${isLight ? 'bg-blue-50' : 'bg-blue-500/10'}`}>
                      <div className="flex items-center gap-3">
                        <Users className={`w-8 h-8 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
                        <div>
                          <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{stats.total_players || 0}</p>
                          <p className={`text-sm ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>Players</p>
                        </div>
                      </div>
                    </div>
                    <div className={`p-4 rounded-xl ${isLight ? 'bg-green-50' : 'bg-green-500/10'}`}>
                      <div className="flex items-center gap-3">
                        <UserCheck className={`w-8 h-8 ${isLight ? 'text-green-600' : 'text-green-400'}`} />
                        <div>
                          <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{stats.active_coaches || 0}</p>
                          <p className={`text-sm ${isLight ? 'text-green-600' : 'text-green-400'}`}>Coaches</p>
                        </div>
                      </div>
                    </div>
                    <div className={`p-4 rounded-xl ${isLight ? 'bg-orange-50' : 'bg-orange-500/10'}`}>
                      <div className="flex items-center gap-3">
                        <TrendingUp className={`w-8 h-8 ${isLight ? 'text-orange-600' : 'text-orange-400'}`} />
                        <div>
                          <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>87%</p>
                          <p className={`text-sm ${isLight ? 'text-orange-600' : 'text-orange-400'}`}>Attendance</p>
                        </div>
                      </div>
                    </div>
                    <div className={`p-4 rounded-xl ${isLight ? 'bg-purple-50' : 'bg-purple-500/10'}`}>
                      <div className="flex items-center gap-3">
                        <Award className={`w-8 h-8 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
                        <div>
                          <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>8.4</p>
                          <p className={`text-sm ${isLight ? 'text-purple-600' : 'text-purple-400'}`}>Rating</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Total Players</p>
                        <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} mt-1`}>{stats.total_players || 0}</p>
                        <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'} mt-1`}>of {stats.player_limit || 50}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Active Coaches</p>
                        <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} mt-1`}>{stats.active_coaches || 0}</p>
                        <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'} mt-1`}>of {stats.coach_limit || 10}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-xl">
                        <UserCheck className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Attendance Rate</p>
                        <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} mt-1`}>87%</p>
                        <p className="text-sm text-green-500 mt-1">+2% this week</p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </div>

                  <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Performance Score</p>
                        <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} mt-1`}>8.4</p>
                        <p className="text-sm text-blue-500 mt-1">Academy Average</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-xl">
                        <Award className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Monthly Growth Chart */}
                  <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                    <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>Monthly Growth</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={getMonthlyGrowthData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e5e7eb' : '#374151'} />
                        <XAxis dataKey="month" stroke={isLight ? '#6b7280' : '#9ca3af'} />
                        <YAxis stroke={isLight ? '#6b7280' : '#9ca3af'} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: isLight ? '#ffffff' : '#1f2937',
                            border: `1px solid ${isLight ? '#e5e7eb' : '#374151'}`,
                            borderRadius: '12px'
                          }}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="players" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
                        <Area type="monotone" dataKey="coaches" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Player Position Distribution */}
                  <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                    <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>Player Positions</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getPlayerDistributionData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name} (${percentage}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getPlayerDistributionData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: isLight ? '#ffffff' : '#1f2937',
                            border: `1px solid ${isLight ? '#e5e7eb' : '#374151'}`,
                            borderRadius: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Performance & Age Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Weekly Performance */}
                  <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                    <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>Weekly Performance</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={getPerformanceData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e5e7eb' : '#374151'} />
                        <XAxis dataKey="week" stroke={isLight ? '#6b7280' : '#9ca3af'} />
                        <YAxis stroke={isLight ? '#6b7280' : '#9ca3af'} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: isLight ? '#ffffff' : '#1f2937',
                            border: `1px solid ${isLight ? '#e5e7eb' : '#374151'}`,
                            borderRadius: '12px'
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="attendance" stroke="#3B82F6" strokeWidth={3} dot={{ r: 5 }} />
                        <Line type="monotone" dataKey="performance" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Age Distribution */}
                  <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                    <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>Age Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getAgeDistributionData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e5e7eb' : '#374151'} />
                        <XAxis dataKey="ageGroup" stroke={isLight ? '#6b7280' : '#9ca3af'} />
                        <YAxis stroke={isLight ? '#6b7280' : '#9ca3af'} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: isLight ? '#ffffff' : '#1f2937',
                            border: `1px solid ${isLight ? '#e5e7eb' : '#374151'}`,
                            borderRadius: '12px'
                          }}
                        />
                        <Bar dataKey="players" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'players' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Players</h2>
                  <button
                    onClick={() => { setEditingPlayer(null); setShowPlayerModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add Player
                  </button>
                </div>

                {filteredPlayers.length === 0 ? (
                  <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-12 text-center border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                    <Users className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-400' : 'text-gray-600'}`} />
                    <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-2`}>No players found</h3>
                    <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mb-6`}>Start by adding your first player to the academy.</p>
                    <button
                      onClick={() => { setEditingPlayer(null); setShowPlayerModal(true); }}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200"
                    >
                      Add Your First Player
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredPlayers.map((player) => (
                      <div key={player.id} className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'} hover:shadow-md transition-all duration-200`}>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                            {(player.first_name?.[0] || '') + (player.last_name?.[0] || '')}
                          </div>
                          <div>
                            <h4 className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                              {player.first_name} {player.last_name}
                            </h4>
                            <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                              {player.position || 'No Position'}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className={isLight ? 'text-gray-600' : 'text-gray-400'}>Jersey</span>
                            <span className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>#{player.jersey_number || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={isLight ? 'text-gray-600' : 'text-gray-400'}>Age</span>
                            <span className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>{player.age || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => { setEditingPlayer(player); setShowPlayerModal(true); }}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                              isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePlayer(player.id)}
                            className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'coaches' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Coaches</h2>
                  <button
                    onClick={() => { setEditingCoach(null); setShowCoachModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add Coach
                  </button>
                </div>

                {filteredCoaches.length === 0 ? (
                  <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-12 text-center border ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                    <UserCheck className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-400' : 'text-gray-600'}`} />
                    <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-2`}>No coaches found</h3>
                    <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mb-6`}>Start by adding your first coach to the academy.</p>
                    <button
                      onClick={() => { setEditingCoach(null); setShowCoachModal(true); }}
                      className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200"
                    >
                      Add Your First Coach
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCoaches.map((coach) => (
                      <div key={coach.id} className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'} hover:shadow-md transition-all duration-200`}>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                            {(coach.first_name?.[0] || '') + (coach.last_name?.[0] || '')}
                          </div>
                          <div>
                            <h4 className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                              {coach.first_name} {coach.last_name}
                            </h4>
                            <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                              {coach.specialization || 'General Coach'}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className={isLight ? 'text-gray-600' : 'text-gray-400'}>Experience</span>
                            <span className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>{coach.experience_years || 0} years</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={isLight ? 'text-gray-600' : 'text-gray-400'}>Email</span>
                            <span className={`font-medium text-xs ${isLight ? 'text-gray-900' : 'text-white'}`} title={coach.email}>{coach.email?.slice(0, 15)}...</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => { setEditingCoach(coach); setShowCoachModal(true); }}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                              isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCoach(coach.id)}
                            className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'attendance' && <AttendanceTracker />}
            {activeTab === 'performance' && <PerformanceAnalytics />}
            {activeTab === 'profile' && <AcademyProfile />}
            {activeTab === 'settings' && <AcademySettings />}
          </div>
        </main>
      </div>
      
      <PlayerModal
        isOpen={showPlayerModal}
        onClose={() => setShowPlayerModal(false)}
        onSubmit={editingPlayer ? (data) => handleUpdatePlayer(editingPlayer.id, data) : handleCreatePlayer}
        player={editingPlayer}
        isEditing={!!editingPlayer}
      />

      <CoachModal
        isOpen={showCoachModal}
        onClose={() => setShowCoachModal(false)}
        onSubmit={editingCoach ? (data) => handleUpdateCoach(editingCoach.id, data) : handleCreateCoach}
        coach={editingCoach}
        isEditing={!!editingCoach}
      />
    </div>
  );
};

export default AcademyDashboard;
