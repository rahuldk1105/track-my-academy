import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  TrendingUp, Users, Award, Calendar, Target, 
  BarChart3, User
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';

const PerformanceAnalytics = () => {
  const { token } = useAuth();
  const { isLight } = useTheme();
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [playerPerformance, setPlayerPerformance] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    // Load static data once
    loadPlayers();
    loadAttendanceSummary();
  }, []);

  useEffect(() => {
    if (selectedPlayer) {
      loadPlayerPerformance(selectedPlayer);
    } else {
      // Clear player-specific data if no player is selected
      setPlayerPerformance(null); 
    }
  }, [selectedPlayer]);

  const loadPlayers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/players`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const playersData = await response.json();
        setPlayers(playersData);
        // Automatically select the first player if the list isn't empty
        if (playersData.length > 0) {
          setSelectedPlayer(playersData[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const loadPlayerPerformance = async (playerId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/academy/players/${playerId}/performance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const performanceData = await response.json();
        setPlayerPerformance(performanceData);
      } else {
        // If the API fails or returns no data, clear the state
        setPlayerPerformance(null);
      }
    } catch (error) {
      console.error('Error loading player performance:', error);
      setPlayerPerformance(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceSummary = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/attendance/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const summaryData = await response.json();
        setAttendanceSummary(summaryData);
      }
    } catch (error) {
      console.error('Error loading attendance summary:', error);
    }
  };

  const getPerformanceColor = (rating) => {
    if (rating === null || rating === undefined) return isLight ? 'text-gray-600' : 'text-gray-400';
    if (rating >= 8) return isLight ? 'text-green-600' : 'text-green-400';
    if (rating >= 6) return isLight ? 'text-yellow-600' : 'text-yellow-400';
    if (rating >= 4) return isLight ? 'text-orange-600' : 'text-orange-400';
    return isLight ? 'text-red-600' : 'text-red-400';
  };
  
  const getAttendanceColor = (percentage) => {
    if (percentage === null || percentage === undefined) return isLight ? 'text-gray-600' : 'text-gray-400';
    if (percentage >= 90) return isLight ? 'text-green-600' : 'text-green-400';
    if (percentage >= 80) return isLight ? 'text-yellow-600' : 'text-yellow-400';
    if (percentage >= 70) return isLight ? 'text-orange-600' : 'text-orange-400';
    return isLight ? 'text-red-600' : 'text-red-400';
  };

  const getPerformanceTrendChartData = () => {
    if (!playerPerformance?.performance_trend) return [];
    // Ensure all sessions are included in the trend chart
    return playerPerformance.performance_trend.map(trend => ({
      date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Performance: trend.rating,
    }));
  };

  const getMonthlyStatsChartData = () => {
    if (!playerPerformance?.monthly_stats) return [];
    return Object.entries(playerPerformance.monthly_stats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, stats]) => ({
        month: new Date(month + '-02').toLocaleString('default', { month: 'short', year: '2-digit' }),
        'Avg Performance': stats.average_rating || 0,
        'Attendance %': stats.attendance_percentage || 0,
      }));
  };

  return (
    <div className={`p-6 space-y-6 ${isLight ? 'bg-gray-50' : 'bg-black'} min-h-screen`}>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} flex items-center gap-3`}>
            <BarChart3 className={`w-6 h-6 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
            Performance Analytics
          </h2>
          <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mt-1`}>Analyze player performance and attendance trends.</p>
        </div>
      </div>

      {/* Academy-Wide Summary Cards */}
      {attendanceSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'} rounded-2xl p-6 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Total Sessions</p>
                <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} mt-1`}>{attendanceSummary.total_records}</p>
              </div>
              <div className={`p-3 rounded-xl ${isLight ? 'bg-blue-100' : 'bg-cyan-500/20'}`}><Calendar className={`w-6 h-6 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} /></div>
            </div>
          </div>
          <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-green-500/30'} rounded-2xl p-6 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Attendance Rate</p>
                <p className={`text-3xl font-bold mt-1 ${getAttendanceColor(attendanceSummary.overall_attendance_rate)}`}>{attendanceSummary.overall_attendance_rate}%</p>
              </div>
              <div className={`p-3 rounded-xl ${isLight ? 'bg-green-100' : 'bg-green-500/20'}`}><Users className={`w-6 h-6 ${isLight ? 'text-green-600' : 'text-green-400'}`} /></div>
            </div>
          </div>
          <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-purple-500/30'} rounded-2xl p-6 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Avg. Performance</p>
                <p className={`text-3xl font-bold mt-1 ${getPerformanceColor(attendanceSummary.average_performance_rating)}`}>
                  {attendanceSummary.average_performance_rating ? attendanceSummary.average_performance_rating.toFixed(1) : 'N/A'}/10
                </p>
              </div>
              <div className={`p-3 rounded-xl ${isLight ? 'bg-purple-100' : 'bg-purple-500/20'}`}><TrendingUp className={`w-6 h-6 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} /></div>
            </div>
          </div>
        </div>
      )}

      {/* Player Selection Dropdown */}
      <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'} rounded-2xl p-6 shadow-sm`}>
        <div className="flex items-center gap-4">
          <User className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-cyan-400'}`} />
          <label className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>Select Player:</label>
          <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)}
            className={`flex-1 max-w-md px-4 py-3 rounded-xl border transition-all duration-200 ${isLight ? 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' : 'bg-gray-800 border-cyan-500/30 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'} focus:outline-none`}
          >
            <option value="">Choose a player...</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>{player.first_name} {player.last_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Individual Player Analytics */}
      {selectedPlayer && (
        <div className="space-y-6">
          {loading ? (
            <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'} rounded-2xl p-12 text-center`}>
              <div className={`animate-spin rounded-full h-12 w-12 border-4 mx-auto mb-4 ${isLight ? 'border-gray-300 border-t-blue-600' : 'border-gray-800 border-t-cyan-400'}`}></div>
              <p className={`${isLight ? 'text-gray-600' : 'text-cyan-400'}`}>Loading performance data...</p>
            </div>
          ) : playerPerformance ? (
            <>
              {/* Individual Player Summary Cards */}
              <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'} rounded-2xl p-6 shadow-sm`}>
                <h3 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-6 flex items-center gap-2`}>
                  <Award className={`w-5 h-5 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
                  {playerPerformance.player_name} - Performance Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                        <div className={`text-3xl font-bold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>{playerPerformance.total_sessions}</div>
                        <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm font-medium`}>Total Sessions</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                        <div className={`text-3xl font-bold ${isLight ? 'text-green-600' : 'text-green-400'}`}>{playerPerformance.attended_sessions}</div>
                        <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm font-medium`}>Attended</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10">
                        <div className={`text-3xl font-bold ${getAttendanceColor(playerPerformance.attendance_percentage)}`}>{playerPerformance.attendance_percentage}%</div>
                        <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm font-medium`}>Attendance</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                        <div className={`text-3xl font-bold ${getPerformanceColor(playerPerformance.average_rating)}`}>
                            {playerPerformance.average_rating ? playerPerformance.average_rating.toFixed(1) : 'N/A'}/10
                        </div>
                        <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm font-medium`}>Avg Rating</div>
                    </div>
                </div>
              </div>

              {/* Charts for Individual Player */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-purple-500/30'} rounded-2xl p-6 shadow-sm`}>
                  <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>Performance Trend (All Sessions)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getPerformanceTrendChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e5e7eb' : '#374151'} />
                      <XAxis dataKey="date" stroke={isLight ? '#6b7280' : '#9ca3af'} />
                      <YAxis domain={[0, 10]} stroke={isLight ? '#6b7280' : '#9ca3af'} />
                      <Tooltip contentStyle={{ backgroundColor: isLight ? '#ffffff' : '#1f2937', border: `1px solid ${isLight ? '#e5e7eb' : '#8b5cf6'}`, borderRadius: '12px', color: isLight ? '#374151' : '#ffffff' }} />
                      <Legend />
                      <Line type="monotone" dataKey="Performance" stroke={isLight ? '#8B5CF6' : '#a855f7'} strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-green-500/30'} rounded-2xl p-6 shadow-sm`}>
                  <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>Monthly Overview</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getMonthlyStatsChartData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e5e7eb' : '#374151'} />
                        <XAxis dataKey="month" stroke={isLight ? '#6b7280' : '#9ca3af'} />
                        <YAxis yAxisId="left" orientation="left" stroke={isLight ? '#10B981' : '#22c55e'} />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 10]} stroke={isLight ? '#8B5CF6' : '#a855f7'} />
                        <Tooltip contentStyle={{ backgroundColor: isLight ? '#ffffff' : '#1f2937', border: `1px solid ${isLight ? '#e5e7eb' : '#10b981'}`, borderRadius: '12px', color: isLight ? '#374151' : '#ffffff' }} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="Attendance %" fill={isLight ? '#10B981' : '#22c55e'} radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="Avg Performance" fill={isLight ? '#8B5CF6' : '#a855f7'} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className={`${isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'} rounded-2xl p-12 text-center`}>
              <Target className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-400' : 'text-gray-600'}`} />
              <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-2`}>No performance data available</h3>
              <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Start tracking attendance to see performance analytics for this player.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceAnalytics;
