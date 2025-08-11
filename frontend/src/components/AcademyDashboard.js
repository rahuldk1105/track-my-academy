import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const AcademyDashboard = () => {
  const { user, signOut, token, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [academyData, setAcademyData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

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
      
      // This will be implemented when we create academy-specific APIs
      // For now, just set the academy data from role info
      setAcademyData({
        id: userRole.academy_id,
        name: userRole.academy_name,
        // More academy data will be fetched later
      });
      
    } catch (error) {
      console.error('Error loading academy data:', error);
    } finally {
      setLoading(false);
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
              <img 
                src="https://i.ibb.co/1tLZ0Dp1/TMA-LOGO-without-bg.png" 
                alt="Track My Academy" 
                className="h-10 w-auto mr-4"
              />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-white bg-clip-text text-transparent">
                  {academyData?.name || 'Academy'} Dashboard
                </h1>
                <p className="text-gray-400 text-sm">Welcome back, {user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                Academy Portal
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
        <div className="flex space-x-4 mb-6">
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
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-sm text-gray-400">Coming Soon</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
                  <h3 className="text-lg font-semibold text-green-400 mb-2">Active Coaches</h3>
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-sm text-gray-400">Coming Soon</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
                  <h3 className="text-lg font-semibold text-purple-400 mb-2">Training Sessions</h3>
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-sm text-gray-400">Coming Soon</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-300 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button 
                    onClick={() => setActiveTab('coaches')}
                    className="bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 px-4 py-3 rounded-lg transition-all duration-300 text-left"
                  >
                    Manage Coaches
                  </button>
                  <button 
                    onClick={() => setActiveTab('players')}
                    className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 px-4 py-3 rounded-lg transition-all duration-300 text-left"
                  >
                    Manage Players
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'players' && (
            <div className="p-6">
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">Player Management</div>
                <div className="text-sm text-gray-500">
                  Player management functionality will be implemented in the next phase.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'coaches' && (
            <div className="p-6">
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">Coach Management</div>
                <div className="text-sm text-gray-500">
                  Coach management functionality will be implemented in the next phase.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6">
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">Academy Settings</div>
                <div className="text-sm text-gray-500">
                  Academy settings will be available in the next phase.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcademyDashboard;