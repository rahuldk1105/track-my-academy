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
  const { isLight } = useTheme();
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
        headers: { 'Authorization': `Bearer ${token}` }
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
      const academiesResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/academies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (academiesResponse.ok) {
        const academiesData = await academiesResponse.json();
        setAcademies(academiesData);
        const pendingCount = academiesData.filter(a => a.status === 'pending').length;
        const approvedCount = academiesData.filter(a => a.status === 'approved').length;
        setStats({
          totalUsers: academiesData.length,
          totalAcademies: academiesData.length,
          pendingAcademies: pendingCount,
          activeUsers: approvedCount
        });
        const usersData = academiesData.map((academy) => ({
          id: academy.id,
          email: academy.email,
          academy: academy.name,
          status: academy.status === 'approved' ? 'active' : academy.status,
          joined: new Date(academy.created_at).toLocaleDateString()
        }));
        setUsers(usersData);
      } else {
        console.error('Failed to fetch academies');
        // graceful fallback (unchanged)
        setStats({ totalUsers: 156, totalAcademies: 23, pendingAcademies: 5, activeUsers: 89 });
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
      setStats({ totalUsers: 156, totalAcademies: 23, pendingAcademies: 5, activeUsers: 89 });
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
    loadDashboardData();
    loadSystemOverview();
  };

  const handleEditAcademy = (academy) => {
    setSelectedAcademy(academy);
    setShowEditModal(true);
  };

  const handleAcademyUpdated = (updatedAcademy) => {
    setSuccessMessage(`Academy "${updatedAcademy.name}" updated successfully!`);
    setTimeout(() => setSuccessMessage(''), 5000);
    loadDashboardData();
  };

  const handleDeleteAcademy = async (academyId, academyName) => {
    if (!window.confirm(`Are you sure you want to delete "${academyName}"? This action cannot be undone.`)) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/academies/${academyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setSuccessMessage(`Academy "${academyName}" deleted successfully!`);
        setTimeout(() => setSuccessMessage(''), 5000);
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
    if (!window.confirm(`Are you sure you want to reject "${academyName}"?`)) return;
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
    if (!window.confirm(`Are you sure you want to approve ${selectedAcademies.length} selected academies?`)) return;
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
    setSelectedAcademies(prev => prev.includes(academyId) ? prev.filter(id => id !== academyId) : [...prev, academyId]);
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
    <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-900 border border-white/10'} rounded-xl p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>{title}</p>
          <p className={`text-3xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color.replace('text', 'bg').replace('-600', '-100')}`}>
          <div className={`${color}`}>{icon}</div>
        </div>
      </div>
    </div>
  );

  const TabButton = ({ id, label, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 border ${
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

  if (userRole && userRole.role !== 'super_admin') {
    return (
      <div className={`min-h-screen ${isLight ? 'bg-gray-50' : 'bg-gray-950'} flex items-center justify-center`}>
        <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-900 border border-white/10'} rounded-xl p-8 text-center`}>
          <div className={`${isLight ? 'text-red-600' : 'text-red-400'} text-xl mb-2`}>Access Denied</div>
          <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mb-6`}>You don't have permission to access the super admin dashboard.</div>
          <button
            onClick={handleSignOut}
            className={`${isLight ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100' : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'} px-4 py-2 rounded-lg transition-all duration-200`}
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
                className={`${isLight ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200' : 'bg-gray-800 text-white hover:bg-gray-700 border border-white/10'} px-4 py-2 rounded-lg transition-all duration-200`}
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
          <div className={`${isLight ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-green-500/10 border border-green-500/30 text-green-400'} px-4 py-3 rounded-lg mb-6`}>
            {successMessage}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            color="text-blue-600"
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            }
          />
          <StatCard
            title="Total Academies"
            value={stats.totalAcademies}
            color="text-green-600"
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 011.732-1.732l.268.268a2 2 0 002.828 0l.268-.268A2 2 0 0112 8a2 2 0 11-4 4 2 2 0 01-2-2z" clipRule="evenodd" />
              </svg>
            }
          />
          <StatCard
            title="Pending Approvals"
            value={stats.pendingAcademies}
            color="text-orange-600"
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            }
          />
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            color="text-sky-600"
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
            }
          />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <TabButton id="overview" label="Overview" active={activeTab === 'overview'} onClick={setActiveTab} />
          <TabButton id="users" label="Users" active={activeTab === 'users'} onClick={setActiveTab} />
          <TabButton id="academies" label="Academies" active={activeTab === 'academies'} onClick={setActiveTab} />
          <TabButton id="demo-requests" label="Demo Requests" active={activeTab === 'demo-requests'} onClick={setActiveTab} />
          <TabButton id="billing" label="Billing" active={activeTab === 'billing'} onClick={setActiveTab} />
        </div>

        {/* Content */}
        <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-900 border border-white/10'} rounded-xl overflow-hidden`}>
          {activeTab === 'overview' && (
            <div className="p-6">
              <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>System Overview</h2>
              {overviewLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className={`${isLight ? 'text-gray-600' : 'text-gray-300'}`}>Loading system overview...</div>
                </div>
              ) : systemOverview ? (
                <div className="space-y-6">
                  {/* Real-time Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-800 border border-white/10'} rounded-lg p-4`}>
                      <h3 className="text-sm font-medium text-sky-600 mb-1">Total Academies</h3>
                      <p className={`${isLight ? 'text-gray-900' : 'text-white'} text-2xl font-semibold`}>{systemOverview.stats.total_academies}</p>
                      <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Active: {systemOverview.stats.active_academies}</p>
                    </div>
                    <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-800 border border-white/10'} rounded-lg p-4`}>
                      <h3 className="text-sm font-medium text-green-600 mb-1">Pending Academies</h3>
                      <p className={`${isLight ? 'text-gray-900' : 'text-white'} text-2xl font-semibold`}>{systemOverview.stats.pending_academies}</p>
                      <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Awaiting approval</p>
                    </div>
                    <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-800 border border-white/10'} rounded-lg p-4`}>
                      <h3 className="text-sm font-medium text-purple-600 mb-1">Demo Requests</h3>
                      <p className={`${isLight ? 'text-gray-900' : 'text-white'} text-2xl font-semibold`}>{systemOverview.stats.total_demo_requests}</p>
                      <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Pending: {systemOverview.stats.pending_demo_requests}</p>
                    </div>
                    <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-800 border border-white/10'} rounded-lg p-4`}>
                      <h3 className="text-sm font-medium text-orange-600 mb-1">Server Status</h3>
                      <p className="text-green-600 text-2xl font-semibold capitalize">{systemOverview.server_status}</p>
                      <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>System operational</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Activities */}
                    <div>
                      <h3 className={`${isLight ? 'text-gray-800' : 'text-white'} text-lg font-medium mb-3`}>Recent Activity</h3>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {systemOverview.recent_activities.length > 0 ? systemOverview.recent_activities.map((activity) => (
                          <div key={activity.id} className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-800 border border-white/10'} rounded-lg p-3`}>
                            <div className="flex items-start">
                              <div className={`w-2 h-2 rounded-full mr-3 mt-2 ${
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

                    {/* Recently Added Academies */}
                    <div>
                      <h3 className={`${isLight ? 'text-gray-800' : 'text-white'} text-lg font-medium mb-3`}>Recently Added Academies</h3>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {systemOverview.recent_academies.length > 0 ? systemOverview.recent_academies.map((academy) => (
                          <div key={academy.id} className={`${isLight ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-800 border border-white/10'} rounded-lg p-3`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className={`${isLight ? 'text-gray-900' : 'text-white'} font-medium`}>{academy.name}</h4>
                                <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>Owner: {academy.owner_name}</p>
                                <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>{academy.location} • {academy.sports_type}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                academy.status === 'approved' 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : 'bg-orange-50 text-orange-700 border-orange-200'
                              }`}>
                                {academy.status}
                              </span>
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

                  {/* Quick Actions */}
                  <div>
                    <h3 className={`${isLight ? 'text-gray-800' : 'text-white'} text-lg font-medium mb-3`}>Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button 
                        onClick={() => setActiveTab('academies')}
                        className={`${isLight ? 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100' : 'bg-sky-600/20 text-sky-300 border border-sky-600/30 hover:bg-sky-600/30'} px-4 py-3 rounded-lg text-left transition-all duration-200`}
                      >
                        Review Pending Academies ({systemOverview.stats.pending_academies})
                      </button>
                      <button 
                        onClick={() => setActiveTab('demo-requests')}
                        className={`${isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' : 'bg-emerald-600/20 text-emerald-300 border border-emerald-600/30 hover:bg-emerald-600/30'} px-4 py-3 rounded-lg text-left transition-all duration-200`}
                      >
                        Review Demo Requests ({systemOverview.stats.pending_demo_requests})
                      </button>
                      <button 
                        onClick={loadSystemOverview}
                        className={`${isLight ? 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50' : 'bg-gray-800 text-white border border-white/10 hover:bg-gray-700'} px-4 py-3 rounded-lg text-left transition-all duration-200`}
                      >
                        Refresh System Data
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Failed to load system overview. Please try again.</div>
                  <button 
                    onClick={loadSystemOverview}
                    className={`mt-4 ${isLight ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white'} px-4 py-2 rounded-lg transition-colors`}
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
                  <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>User Management</h2>
                  <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm mt-1`}>Academy owners and administrators</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`${isLight ? 'border-b border-gray-200 bg-gray-50' : 'border-b border-white/10 bg-gray-800'}`}>
                      <th className={`${isLight ? 'text-gray-700' : 'text-gray-200'} text-left py-3 px-4`}>Email</th>
                      <th className={`${isLight ? 'text-gray-700' : 'text-gray-200'} text-left py-3 px-4`}>Academy</th>
                      <th className={`${isLight ? 'text-gray-700' : 'text-gray-200'} text-left py-3 px-4`}>Status</th>
                      <th className={`${isLight ? 'text-gray-700' : 'text-gray-200'} text-left py-3 px-4`}>Joined</th>
                      <th className={`${isLight ? 'text-gray-700' : 'text-gray-200'} text-left py-3 px-4`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className={`${isLight ? 'border-b border-gray-100 hover:bg-gray-50' : 'border-b border-white/5 hover:bg-gray-800/60'}`}>
                        <td className={`${isLight ? 'text-gray-900' : 'text-white'} py-3 px-4`}>{user.email}</td>
                        <td className={`${isLight ? 'text-gray-700' : 'text-gray-300'} py-3 px-4`}>{user.academy}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            user.status === 'active' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-orange-50 text-orange-700 border-orange-200'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className={`${isLight ? 'text-gray-700' : 'text-gray-300'} py-3 px-4`}>{user.joined}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-3">
                            <button className={`${isLight ? 'text-sky-700 hover:underline' : 'text-sky-300 hover:underline'}`}>Edit</button>
                            <button className={`${isLight ? 'text-red-700 hover:underline' : 'text-red-300 hover:underline'}`}>Delete</button>
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
                <h2 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>Academy Management</h2>
                <div className="flex gap-3">
                  {selectedAcademies.length &gt; 0 &amp;&amp; (
                    <button 
                      onClick={handleBulkApprove}
                      className={`${isLight ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'} px-4 py-2 rounded-lg transition-colors`}
                    >
                      Approve Selected ({selectedAcademies.length})
                    </button>
                  )}
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className={`${isLight ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white'} px-4 py-2 rounded-lg transition-colors`}
                  >
                    Add New Academy
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`${isLight ? 'border-b border-gray-200 bg-gray-50' : 'border-b border-white/10 bg-gray-800'}`}>
                      <th className={`${isLight ? 'text-gray-700' : 'text-gray-200'} text-left py-3 px-4`}>
                        <input
                          type="checkbox"
                          checked={selectedAcademies.length === academies.length &amp;&amp; academies.length &gt; 0}
                          onChange={handleSelectAll}
                          className={`${isLight ? 'rounded border-gray-300 text-sky-600 focus:ring-sky-500' : 'rounded bg-gray-800 border-gray-600 text-sky-500 focus:ring-sky-500'}`}
                        />
                      </th>
                      <th className={`${isLight ? 'text-gray-700' : 'text-gray-200'} text-left py-3 px-4`}>Logo</th>
                      <th className={`${isLight ? 'text-gray-700' : 'text-gray-200'} text-left py-3 px-4`}>Academy Name</th>
                      <th className={`${isLight ? 'text-gray-700' : 'text-gray-200'} text-left py-3 px-4`}>Owner</th>
                      <th className={`${isLight ? 'text-gray-700' : 'text-gray-200'} text-left py-3 px-4`}>Sport</th>
                      <th className={`${isLight ? 'text-gray-700' : 'text-gray-200'} text-left py-3 px-4`}>Location</th>
                      <th className={`${isLight ? 'text-gray-700' : 'text-gray-200'} text-left py-3 px-4`}>Limits</th>
                      <th className={`${isLight ? 'text-gray-700' : 'text-gray-200'} text-left py-3 px-4`}>Status</th>
                      <th className={`${isLight ? 'text-gray-700' : 'text-gray-200'} text-left py-3 px-4`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {academies.map((academy) => (
                      <tr key={academy.id} className={`${isLight ? 'border-b border-gray-100 hover:bg-gray-50' : 'border-b border-white/5 hover:bg-gray-800/60'}`}>
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedAcademies.includes(academy.id)}
                            onChange={() => handleSelectAcademy(academy.id)}
                            className={`${isLight ? 'rounded border-gray-300 text-sky-600 focus:ring-sky-500' : 'rounded bg-gray-800 border-gray-600 text-sky-500 focus:ring-sky-500'}`}
                          />
                        </td>
                        <td className="py-3 px-4">
                          {academy.logo_url ? (
                            <img
                              src={`${process.env.REACT_APP_BACKEND_URL}${academy.logo_url}`}
                              alt={`${academy.name} logo`}
                              className={`${isLight ? 'bg-gray-100' : 'bg-gray-800'} w-10 h-10 rounded-full object-cover border ${isLight ? 'border-gray-200' : 'border-white/10'}`}
                            />
                          ) : (
                            <div className={`${isLight ? 'bg-gray-100' : 'bg-gray-800'} w-10 h-10 rounded-full flex items-center justify-center`}>
                              <svg className={`${isLight ? 'text-gray-400' : 'text-gray-500'} w-6 h-6`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 011.732-1.732l.268.268a2 2 0 002.828 0l.268-.268A2 2 0 0112 8a2 2 0 11-4 4 2 2 0 01-2-2z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </td>
                        <td className={`${isLight ? 'text-gray-900' : 'text-white'} py-3 px-4 font-medium`}>{academy.name}</td>
                        <td className={`${isLight ? 'text-gray-700' : 'text-gray-300'} py-3 px-4`}>{academy.owner_name}</td>
                        <td className={`${isLight ? 'text-gray-700' : 'text-gray-300'} py-3 px-4`}>{academy.sports_type || 'Not specified'}</td>
                        <td className={`${isLight ? 'text-gray-700' : 'text-gray-300'} py-3 px-4`}>{academy.location || 'Not specified'}</td>
                        <td className={`${isLight ? 'text-gray-700' : 'text-gray-300'} py-3 px-4 text-sm`}>
                          <div className="space-y-0.5">
                            <div>Players: {academy.player_limit || 50}</div>
                            <div>Coaches: {academy.coach_limit || 10}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            academy.status === 'approved'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : academy.status === 'pending'
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : academy.status === 'rejected'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            {academy.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-3 text-sm">
                            {academy.status === 'pending' &amp;&amp; (
                              <>
                                <button 
                                  onClick={() => handleApproveAcademy(academy.id, academy.name)}
                                  className={`${isLight ? 'text-emerald-700 hover:underline' : 'text-emerald-300 hover:underline'}`}
                                  title="Approve Academy"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleRejectAcademy(academy.id, academy.name)}
                                  className={`${isLight ? 'text-red-700 hover:underline' : 'text-red-300 hover:underline'}`}
                                  title="Reject Academy"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => handleEditAcademy(academy)}
                              className={`${isLight ? 'text-sky-700 hover:underline' : 'text-sky-300 hover:underline'}`}
                              title="Edit Academy"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteAcademy(academy.id, academy.name)}
                              className={`${isLight ? 'text-red-700 hover:underline' : 'text-red-300 hover:underline'}`}
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

          {activeTab === 'demo-requests' &amp;&amp; (
            <div className="p-6">
              <DemoRequestsTable />
            </div>
          )}

          {activeTab === 'billing' &amp;&amp; (
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