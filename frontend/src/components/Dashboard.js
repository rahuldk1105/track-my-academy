import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import CreateAcademyModal from './CreateAcademyModal';
import EditAcademyModal from './EditAcademyModal';
import DemoRequestsTable from './DemoRequestsTable';
import BillingDashboard from './BillingDashboard';
import ThemeToggle from './ThemeToggle';

const Dashboard = () => {
  const { user, signOut, token, userRole } = useAuth();
  const { theme, isLight } = useTheme();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAcademies: 0,
    pendingAcademies: 0,
    activeUsers: 0
  });
  const [users, setUsers] = useState([]);
  const [academies, setAcademies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAcademy, setSelectedAcademy] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedAcademies, setSelectedAcademies] = useState([]);
  const [systemOverview, setSystemOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect academy users to academy dashboard
    if (userRole && userRole.role === 'academy_user') {
      navigate('/academy');
      return;
    }
    
    // Only load dashboard data if user is super admin
    if (userRole && userRole.role === 'super_admin') {
      loadDashboardData();
      loadSystemOverview();
    }
  }, [userRole, navigate]);

  const loadSystemOverview = async () => {
    try {
      setOverviewLoading(true);
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/system-overview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemOverview(data);
      } else {
        console.error('Failed to load system overview');
      }
    } catch (error) {
      console.error('Error loading system overview:', error);
    } finally {
      setOverviewLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real academies data
      const academiesResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/academies`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (academiesResponse.ok) {
        const academiesData = await academiesResponse.json();
        setAcademies(academiesData);
        
        // Update stats based on real data
        const pendingCount = academiesData.filter(a => a.status === 'pending').length;
        const approvedCount = academiesData.filter(a => a.status === 'approved').length;
        
        setStats({
          totalUsers: academiesData.length, // Each academy has one user
          totalAcademies: academiesData.length,
          pendingAcademies: pendingCount,
          activeUsers: approvedCount
        });
        
        // Convert academies to users format for the users tab
        const usersData = academiesData.map((academy, index) => ({
          id: academy.id,
          email: academy.email,
          academy: academy.name,
          status: academy.status === 'approved' ? 'active' : academy.status,
          joined: new Date(academy.created_at).toLocaleDateString()
        }));
        setUsers(usersData);
        
      } else {
        console.error('Failed to fetch academies');
        // Fall back to mock data if API fails
        setStats({
          totalUsers: 156,
          totalAcademies: 23,
          pendingAcademies: 5,
          activeUsers: 89
        });
        
        setUsers([
          { id: 1, email: 'admin@academy1.com', academy: 'Elite Sports Academy', status: 'active', joined: '2024-01-15' },
          { id: 2, email: 'owner@football.com', academy: 'Football Masters', status: 'pending', joined: '2024-01-20' },
          { id: 3, email: 'contact@tennis.com', academy: 'Tennis Pro Center', status: 'active', joined: '2024-01-22' }
        ]);
        
        setAcademies([
          { id: 1, name: 'Elite Sports Academy', owner_name: 'John Doe', sports_type: 'Multi-Sport', status: 'approved', location: 'Chennai' },
          { id: 2, name: 'Football Masters', owner_name: 'Mike Smith', sports_type: 'Football', status: 'pending', location: 'Mumbai' },
          { id: 3, name: 'Tennis Pro Center', owner_name: 'Sarah Wilson', sports_type: 'Tennis', status: 'approved', location: 'Bangalore' }
        ]);
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Use mock data as fallback
      setStats({
        totalUsers: 156,
        totalAcademies: 23,
        pendingAcademies: 5,
        activeUsers: 89
      });
      
      setUsers([
        { id: 1, email: 'admin@academy1.com', academy: 'Elite Sports Academy', status: 'active', joined: '2024-01-15' },
        { id: 2, email: 'owner@football.com', academy: 'Football Masters', status: 'pending', joined: '2024-01-20' },
        { id: 3, email: 'contact@tennis.com', academy: 'Tennis Pro Center', status: 'active', joined: '2024-01-22' }
      ]);
      
      setAcademies([
        { id: 1, name: 'Elite Sports Academy', owner_name: 'John Doe', sports_type: 'Multi-Sport', status: 'approved', location: 'Chennai' },
        { id: 2, name: 'Football Masters', owner_name: 'Mike Smith', sports_type: 'Football', status: 'pending', location: 'Mumbai' },
        { id: 3, name: 'Tennis Pro Center', owner_name: 'Sarah Wilson', sports_type: 'Tennis', status: 'approved', location: 'Bangalore' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcademyCreated = (newAcademy) => {
    setSuccessMessage(`Academy "${newAcademy.user?.user_metadata?.academy_name || 'New Academy'}" created successfully!`);
    setTimeout(() => setSuccessMessage(''), 5000);
    // Refresh dashboard data
    loadDashboardData(); // Reload academy data and stats
    loadSystemOverview(); // Reload system overview data
  };

  const handleEditAcademy = (academy) => {
    setSelectedAcademy(academy);
    setShowEditModal(true);
  };

  const handleAcademyUpdated = (updatedAcademy) => {
    setSuccessMessage(`Academy "${updatedAcademy.name}" updated successfully!`);
    setTimeout(() => setSuccessMessage(''), 5000);
    // Refresh dashboard data
    loadDashboardData();
  };

  const handleDeleteAcademy = async (academyId, academyName) => {
    if (!window.confirm(`Are you sure you want to delete "${academyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/academies/${academyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccessMessage(`Academy "${academyName}" deleted successfully!`);
        setTimeout(() => setSuccessMessage(''), 5000);
        // Refresh dashboard data
        loadDashboardData();
      } else {
        const data = await response.json();
        alert(`Failed to delete academy: ${data.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting academy:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleApproveAcademy = async (academyId, academyName) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/academies/${academyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'approved' })
      });

      if (response.ok) {
        setSuccessMessage(`Academy "${academyName}" approved successfully!`);
        setTimeout(() => setSuccessMessage(''), 5000);
        // Refresh dashboard data
        loadDashboardData();
      } else {
        const data = await response.json();
        alert(`Failed to approve academy: ${data.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error approving academy:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleRejectAcademy = async (academyId, academyName) => {
    if (!window.confirm(`Are you sure you want to reject "${academyName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/academies/${academyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'rejected' })
      });

      if (response.ok) {
        setSuccessMessage(`Academy "${academyName}" rejected successfully!`);
        setTimeout(() => setSuccessMessage(''), 5000);
        // Refresh dashboard data
        loadDashboardData();
      } else {
        const data = await response.json();
        alert(`Failed to reject academy: ${data.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error rejecting academy:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedAcademies.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to approve ${selectedAcademies.length} selected academies?`)) {
      return;
    }

    try {
      const promises = selectedAcademies.map(academyId =>
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/academies/${academyId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'approved' })
        })
      );

      await Promise.all(promises);
      setSuccessMessage(`${selectedAcademies.length} academies approved successfully!`);
      setTimeout(() => setSuccessMessage(''), 5000);
      setSelectedAcademies([]);
      loadDashboardData();
    } catch (error) {
      console.error('Error in bulk approve:', error);
      alert('Some academies could not be approved. Please try again.');
    }
  };

  const handleSelectAcademy = (academyId) => {
    setSelectedAcademies(prev => 
      prev.includes(academyId) 
        ? prev.filter(id => id !== academyId)
        : [...prev, academyId]
    );
  };

  const handleSelectAll = () => {
    const allIds = academies.map(academy => academy.id);
    setSelectedAcademies(selectedAcademies.length === allIds.length ? [] : allIds);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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

  const TabButton = ({ id, label, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
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

  // Show access denied if user is not super admin
  if (userRole && userRole.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Access Denied</div>
          <div className="text-gray-400 mb-6">You don't have permission to access the super admin dashboard.</div>
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
                  SuperAdmin Dashboard
                </h1>
                <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Welcome back, {user?.email}</p>
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
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg mb-6">
            {successMessage}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            color="text-blue-400"
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            }
          />
          <StatCard
            title="Total Academies"
            value={stats.totalAcademies}
            color="text-green-400"
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 011.732-1.732l.268.268a2 2 0 002.828 0l.268-.268A2 2 0 0112 8a2 2 0 11-4 4 2 2 0 01-2-2z" clipRule="evenodd" />
              </svg>
            }
          />
          <StatCard
            title="Pending Approvals"
            value={stats.pendingAcademies}
            color="text-orange-400"
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            }
          />
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            color="text-sky-400"
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
            }
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <TabButton
            id="overview"
            label="Overview"
            active={activeTab === 'overview'}
            onClick={setActiveTab}
          />
          <TabButton
            id="users"
            label="Users"
            active={activeTab === 'users'}
            onClick={setActiveTab}
          />
          <TabButton
            id="academies"
            label="Academies"
            active={activeTab === 'academies'}
            onClick={setActiveTab}
          />
          <TabButton
            id="demo-requests"
            label="Demo Requests"
            active={activeTab === 'demo-requests'}
            onClick={setActiveTab}
          />
          <TabButton
            id="billing"
            label="Billing"
            active={activeTab === 'billing'}
            onClick={setActiveTab}
          />
        </div>

        {/* Content */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
          {activeTab === 'overview' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">System Overview</h2>
              
              {overviewLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-white">Loading system overview...</div>
                </div>
              ) : systemOverview ? (
                <div className="space-y-6">
                  {/* Real-time Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
                      <h3 className="text-lg font-semibold text-sky-400 mb-2">Total Academies</h3>
                      <p className="text-2xl font-bold text-white">{systemOverview.stats.total_academies}</p>
                      <p className="text-sm text-gray-400">Active: {systemOverview.stats.active_academies}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
                      <h3 className="text-lg font-semibold text-green-400 mb-2">Pending Academies</h3>
                      <p className="text-2xl font-bold text-white">{systemOverview.stats.pending_academies}</p>
                      <p className="text-sm text-gray-400">Awaiting approval</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
                      <h3 className="text-lg font-semibold text-purple-400 mb-2">Demo Requests</h3>
                      <p className="text-2xl font-bold text-white">{systemOverview.stats.total_demo_requests}</p>
                      <p className="text-sm text-gray-400">Pending: {systemOverview.stats.pending_demo_requests}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
                      <h3 className="text-lg font-semibold text-orange-400 mb-2">Server Status</h3>
                      <p className="text-2xl font-bold text-green-400 capitalize">{systemOverview.server_status}</p>
                      <p className="text-sm text-gray-400">System operational</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Activities */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-300 mb-3">Recent Activity</h3>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {systemOverview.recent_activities.length > 0 ? systemOverview.recent_activities.map((activity) => (
                          <div key={activity.id} className="flex items-center p-3 bg-white/5 rounded-lg">
                            <div className={`w-2 h-2 rounded-full mr-3 ${
                              activity.status === 'success' ? 'bg-green-400' : 
                              activity.status === 'pending' ? 'bg-orange-400' : 'bg-blue-400'
                            }`}></div>
                            <div className="flex-1">
                              <p className="text-gray-300">{activity.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )) : (
                          <div className="text-gray-400 text-center py-4">No recent activities</div>
                        )}
                      </div>
                    </div>

                    {/* Recently Added Academies */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-300 mb-3">Recently Added Academies</h3>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {systemOverview.recent_academies.length > 0 ? systemOverview.recent_academies.map((academy) => (
                          <div key={academy.id} className="p-3 bg-white/5 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-white font-medium">{academy.name}</h4>
                                <p className="text-sm text-gray-400">Owner: {academy.owner_name}</p>
                                <p className="text-sm text-gray-400">{academy.location} • {academy.sports_type}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                academy.status === 'approved' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-orange-500/20 text-orange-400'
                              }`}>
                                {academy.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Added: {new Date(academy.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        )) : (
                          <div className="text-gray-400 text-center py-4">No academies yet</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-300 mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button 
                        onClick={() => setActiveTab('academies')}
                        className="bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 px-4 py-3 rounded-lg transition-all duration-300 text-left"
                      >
                        Review Pending Academies ({systemOverview.stats.pending_academies})
                      </button>
                      <button 
                        onClick={() => setActiveTab('demo-requests')}
                        className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 px-4 py-3 rounded-lg transition-all duration-300 text-left"
                      >
                        Review Demo Requests ({systemOverview.stats.pending_demo_requests})
                      </button>
                      <button 
                        onClick={loadSystemOverview}
                        className="bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 px-4 py-3 rounded-lg transition-all duration-300 text-left"
                      >
                        Refresh System Data
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400">Failed to load system overview. Please try again.</div>
                  <button 
                    onClick={loadSystemOverview}
                    className="mt-4 bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">User Management</h2>
                  <p className="text-sm text-gray-400 mt-1">Academy owners and administrators</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-gray-300">Email</th>
                      <th className="text-left py-3 px-4 text-gray-300">Academy</th>
                      <th className="text-left py-3 px-4 text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 text-gray-300">Joined</th>
                      <th className="text-left py-3 px-4 text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-white/5">
                        <td className="py-3 px-4 text-white">{user.email}</td>
                        <td className="py-3 px-4 text-gray-300">{user.academy}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.status === 'active' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-orange-500/20 text-orange-400'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{user.joined}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button className="text-blue-400 hover:text-blue-300">Edit</button>
                            <button className="text-red-400 hover:text-red-300">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'academies' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Academy Management</h2>
                <div className="flex space-x-3">
                  {selectedAcademies.length > 0 && (
                    <button 
                      onClick={handleBulkApprove}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Approve Selected ({selectedAcademies.length})
                    </button>
                  )}
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors"
                  >
                    Add New Academy
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-gray-300">
                        <input
                          type="checkbox"
                          checked={selectedAcademies.length === academies.length && academies.length > 0}
                          onChange={handleSelectAll}
                          className="rounded bg-gray-700 border-gray-600 text-sky-600 focus:ring-sky-500"
                        />
                      </th>
                      <th className="text-left py-3 px-4 text-gray-300">Logo</th>
                      <th className="text-left py-3 px-4 text-gray-300">Academy Name</th>
                      <th className="text-left py-3 px-4 text-gray-300">Owner</th>
                      <th className="text-left py-3 px-4 text-gray-300">Sport</th>
                      <th className="text-left py-3 px-4 text-gray-300">Location</th>
                      <th className="text-left py-3 px-4 text-gray-300">Limits</th>
                      <th className="text-left py-3 px-4 text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {academies.map((academy) => (
                      <tr key={academy.id} className="border-b border-white/5">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedAcademies.includes(academy.id)}
                            onChange={() => handleSelectAcademy(academy.id)}
                            className="rounded bg-gray-700 border-gray-600 text-sky-600 focus:ring-sky-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          {academy.logo_url ? (
                            <img
                              src={`${process.env.REACT_APP_BACKEND_URL}${academy.logo_url}`}
                              alt={`${academy.name} logo`}
                              className="w-10 h-10 rounded-full object-cover bg-gray-700"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 011.732-1.732l.268.268a2 2 0 002.828 0l.268-.268A2 2 0 0112 8a2 2 0 11-4 4 2 2 0 01-2-2z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-white font-medium">{academy.name}</td>
                        <td className="py-3 px-4 text-gray-300">{academy.owner_name}</td>
                        <td className="py-3 px-4 text-gray-300">{academy.sports_type || 'Not specified'}</td>
                        <td className="py-3 px-4 text-gray-300">{academy.location || 'Not specified'}</td>
                        <td className="py-3 px-4 text-gray-300">
                          <div className="text-xs">
                            <div>Players: {academy.player_limit || 50}</div>
                            <div>Coaches: {academy.coach_limit || 10}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            academy.status === 'approved' 
                              ? 'bg-green-500/20 text-green-400' 
                              : academy.status === 'pending'
                              ? 'bg-orange-500/20 text-orange-400'
                              : academy.status === 'rejected'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {academy.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            {academy.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => handleApproveAcademy(academy.id, academy.name)}
                                  className="text-green-400 hover:text-green-300 text-sm font-medium"
                                  title="Approve Academy"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleRejectAcademy(academy.id, academy.name)}
                                  className="text-red-400 hover:text-red-300 text-sm font-medium"
                                  title="Reject Academy"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => handleEditAcademy(academy)}
                              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                              title="Edit Academy"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteAcademy(academy.id, academy.name)}
                              className="text-red-400 hover:text-red-300 text-sm font-medium"
                              title="Delete Academy"
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

export default Dashboard;