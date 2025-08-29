import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  TrendingUp, Users, Award, Calendar, Target, 
  BarChart3, Activity, Clock, User
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const PerformanceAnalytics = () => {
  const { token } = useAuth();
  const { isLight } = useTheme();
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [playerPerformance, setPlayerPerformance] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadPlayers();
    loadAttendanceSummary();
  }, []);

  useEffect(() => {
    if (selectedPlayer) {
      loadPlayerPerformance(selectedPlayer);
    }
  }, [selectedPlayer]);

  useEffect(() => {
    loadAttendanceSummary();
  }, [dateRange]);

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
        if (playersData.length > 0 && !selectedPlayer) {
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
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const performanceData = await response.json();
        setPlayerPerformance(performanceData);
      }
    } catch (error) {
      console.error('Error loading player performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceSummary = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('start_date', dateRange.startDate);
      if (dateRange.endDate) params.append('end_date', dateRange.endDate);

      const response = await fetch(`${API_BASE_URL}/api/academy/attendance/summary?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
    if (rating >= 8) return isLight ? 'text-green-600' : 'text-green-400';
    if (rating >= 6) return isLight ? 'text-yellow-600' : 'text-yellow-400';
    if (rating >= 4) return isLight ? 'text-orange-600' : 'text-orange-400';
    return isLight ? 'text-red-600' : 'text-red-400';
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return isLight ? 'text-green-600' : 'text-green-400';
    if (percentage >= 80) return isLight ? 'text-yellow-600' : 'text-yellow-400';
    if (percentage >= 70) return isLight ? 'text-orange-600' : 'text-orange-400';
    return isLight ? 'text-red-600' : 'text-red-400';
  };

  const getPerformanceTrendChart = () => {
    if (!playerPerformance?.performance_trend) return [];
    return playerPerformance.performance_trend.slice(-10).map(trend => ({
      date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rating: trend.rating,
      attendance: trend.present ? 1 : 0
    }));
  };

  const getMonthlyStatsChart = () => {
    if (!playerPerformance?.monthly_stats) return [];
    return Object.entries(playerPerformance.monthly_stats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, stats]) => ({
        month: month.slice(0, 7),
        attendance: stats.attendance_percentage,
        avgRating: stats.average_rating || 0,
        sessions: stats.attended_sessions
      }));
  };

  const getRadarData = () => {
    if (!playerPerformance) return [];
    const avgRating = playerPerformance.average_performance_rating || 0;
    const attendanceRate = playerPerformance.attendance_percentage || 0;
    return [
      { subject: 'Performance', A: avgRating * 10, fullMark: 100 },
      { subject: 'Attendance', A: attendanceRate, fullMark: 100 },
      { subject: 'Consistency', A: Math.min(avgRating * attendanceRate / 10, 100), fullMark: 100 },
      { subject: 'Sessions', A: Math.min((playerPerformance.attended_sessions || 0) * 5, 100), fullMark: 100 }
    ];
  };

  return (
    <div className={`p-6 space-y-6 ${isLight ? 'bg-gray-50' : 'bg-black'} min-h-screen`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} flex items-center gap-3`}>
            <BarChart3 className={`w-6 h-6 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
            Performance Analytics
          </h2>
          <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mt-1`}>
            Analyze player performance and attendance trends
          </p>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex items-center gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>From</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className={`px-3 py-2 rounded-xl border transition-all duration-200 ${
                isLight 
                  ? 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                  : 'bg-gray-900 border-cyan-500/30 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
              } focus:outline-none`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>To</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className={`px-3 py-2 rounded-xl border transition-all duration-200 ${
                isLight 
                  ? 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                  : 'bg-gray-900 border-cyan-500/30 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
              } focus:outline-none`}
            />
          </div>
        </div>
      </div>

      {/* Academy Overview Cards */}
      {attendanceSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`${
            isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'
          } rounded-2xl p-6 shadow-sm transition-all duration-200 hover:shadow-md`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Total Sessions</p>
                <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} mt-1`}>
                  {attendanceSummary.total_records}
                </p>
                <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Recorded</p>
              </div>
              <div className={`p-3 rounded-xl ${isLight ? 'bg-blue-100' : 'bg-cyan-500/20'}`}>
                <Calendar className={`w-6 h-6 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
              </div>
            </div>
          </div>

          <div className={`${
            isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-green-500/30'
          } rounded-2xl p-6 shadow-sm transition-all duration-200 hover:shadow-md`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Attendance Rate</p>
                <p className={`text-3xl font-bold mt-1 ${getAttendanceColor(attendanceSummary.overall_attendance_rate)}`}>
                  {attendanceSummary.overall_attendance_rate}%
                </p>
                <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Academy Average</p>
              </div>
              <div className={`p-3 rounded-xl ${isLight ? 'bg-green-100' : 'bg-green-500/20'}`}>
                <Users className={`w-6 h-6 ${isLight ? 'text-green-600' : 'text-green-400'}`} />
              </div>
            </div>
          </div>

          <div className={`${
            isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-purple-500/30'
          } rounded-2xl p-6 shadow-sm transition-all duration-200 hover:shadow-md`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Avg Performance</p>
                <p className={`text-3xl font-bold mt-1 ${getPerformanceColor(attendanceSummary.average_performance_rating || 0)}`}>
                  {attendanceSummary.average_performance_rating ? attendanceSummary.average_performance_rating.toFixed(1) : 'N/A'}/10
                </p>
                <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Overall Rating</p>
              </div>
              <div className={`p-3 rounded-xl ${isLight ? 'bg-purple-100' : 'bg-purple-500/20'}`}>
                <TrendingUp className={`w-6 h-6 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
              </div>
            </div>
          </div>

          <div className={`${
            isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-orange-500/30'
          } rounded-2xl p-6 shadow-sm transition-all duration-200 hover:shadow-md`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Present Records</p>
                <p className={`text-3xl font-bold ${isLight ? 'text-orange-600' : 'text-orange-400'} mt-1`}>
                  {attendanceSummary.present_records}
                </p>
                <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Total Present</p>
              </div>
              <div className={`p-3 rounded-xl ${isLight ? 'bg-orange-100' : 'bg-orange-500/20'}`}>
                <Activity className={`w-6 h-6 ${isLight ? 'text-orange-600' : 'text-orange-400'}`} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player Selection */}
      <div className={`${
        isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'
      } rounded-2xl p-6 shadow-sm`}>
        <div className="flex items-center gap-4">
          <User className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-cyan-400'}`} />
          <label className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>Select Player:</label>
          <select
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className={`flex-1 max-w-md px-4 py-3 rounded-xl border transition-all duration-200 ${
              isLight
                ? 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                : 'bg-gray-800 border-cyan-500/30 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
            } focus:outline-none`}
          >
            <option value="">Choose a player...</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.first_name} {player.last_name} - {player.position || 'No position'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Individual Player Performance */}
      {selectedPlayer && (
        <div className="space-y-6">
          {loading ? (
            <div className={`${
              isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'
            } rounded-2xl p-12 text-center`}>
              <div className={`animate-spin rounded-full h-12 w-12 border-4 mx-auto mb-4 ${
                isLight ? 'border-gray-300 border-t-blue-600' : 'border-gray-800 border-t-cyan-400'
              }`}></div>
              <p className={`${isLight ? 'text-gray-600' : 'text-cyan-400'}`}>Loading performance data...</p>
            </div>
          ) : playerPerformance ? (
            <>
              {/* Player Performance Summary */}
              <div className={`${
                isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'
              } rounded-2xl p-6 shadow-sm`}>
                <h3 className={`text-xl font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-6 flex items-center gap-2`}>
                  <Award className={`w-5 h-5 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
                  {playerPerformance.player_name} - Performance Summary
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                    <div className={`text-3xl font-bold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                      {playerPerformance.total_sessions}
                    </div>
                    <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm font-medium`}>Total Sessions</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                    <div className={`text-3xl font-bold ${isLight ? 'text-green-600' : 'text-green-400'}`}>
                      {playerPerformance.attended_sessions}
                    </div>
                    <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm font-medium`}>Attended</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10">
                    <div className={`text-3xl font-bold ${getAttendanceColor(playerPerformance.attendance_percentage)}`}>
                      {playerPerformance.attendance_percentage}%
                    </div>
                    <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm font-medium`}>Attendance</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                    <div className={`text-3xl font-bold ${getPerformanceColor(playerPerformance.average_performance_rating || 0)}`}>
                      {playerPerformance.average_performance_rating ? playerPerformance.average_performance_rating.toFixed(1) : 'N/A'}/10
                    </div>
                    <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm font-medium`}>Avg Rating</div>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Trend Chart */}
                <div className={`${
                  isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-purple-500/30'
                } rounded-2xl p-6 shadow-sm`}>
                  <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>
                    Performance Trend
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getPerformanceTrendChart()}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e5e7eb' : '#374151'} />
                      <XAxis dataKey="date" stroke={isLight ? '#6b7280' : '#9ca3af'} />
                      <YAxis domain={[0, 10]} stroke={isLight ? '#6b7280' : '#9ca3af'} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isLight ? '#ffffff' : '#1f2937',
                          border: `1px solid ${isLight ? '#e5e7eb' : '#8b5cf6'}`,
                          borderRadius: '12px',
                          color: isLight ? '#374151' : '#ffffff'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="rating" 
                        stroke={isLight ? '#8B5CF6' : '#a855f7'} 
                        strokeWidth={3} 
                        dot={{ r: 5, fill: isLight ? '#8B5CF6' : '#a855f7' }} 
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Player Radar Chart */}
                <div className={`${
                  isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'
                } rounded-2xl p-6 shadow-sm`}>
                  <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>
                    Player Profile Radar
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={getRadarData()}>
                      <PolarGrid stroke={isLight ? '#e5e7eb' : '#374151'} />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: isLight ? '#6b7280' : '#9ca3af', fontSize: 12 }}
                      />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 100]} 
                        tick={{ fill: isLight ? '#6b7280' : '#9ca3af', fontSize: 10 }}
                      />
                      <Radar
                        name="Performance"
                        dataKey="A"
                        stroke={isLight ? '#06B6D4' : '#22d3ee'}
                        fill={isLight ? '#06B6D4' : '#22d3ee'}
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isLight ? '#ffffff' : '#1f2937',
                          border: `1px solid ${isLight ? '#e5e7eb' : '#06b6d4'}`,
                          borderRadius: '12px',
                          color: isLight ? '#374151' : '#ffffff'
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Statistics Chart */}
              <div className={`${
                isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-green-500/30'
              } rounded-2xl p-6 shadow-sm`}>
                <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>
                  Monthly Performance Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={getMonthlyStatsChart()}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e5e7eb' : '#374151'} />
                    <XAxis dataKey="month" stroke={isLight ? '#6b7280' : '#9ca3af'} />
                    <YAxis stroke={isLight ? '#6b7280' : '#9ca3af'} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: isLight ? '#ffffff' : '#1f2937',
                        border: `1px solid ${isLight ? '#e5e7eb' : '#10b981'}`,
                        borderRadius: '12px',
                        color: isLight ? '#374151' : '#ffffff'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="attendance"
                      stackId="1"
                      stroke={isLight ? '#10B981' : '#22c55e'}
                      fill={isLight ? '#10B981' : '#22c55e'}
                      fillOpacity={0.2}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgRating"
                      stackId="2"
                      stroke={isLight ? '#8B5CF6' : '#a855f7'}
                      fill={isLight ? '#8B5CF6' : '#a855f7'}
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly Statistics Table */}
              {playerPerformance.monthly_stats && Object.keys(playerPerformance.monthly_stats).length > 0 && (
                <div className={`${
                  isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-purple-500/30'
                } rounded-2xl shadow-sm overflow-hidden`}>
                  <div className="p-6">
                    <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>
                      Detailed Monthly Breakdown
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={`${isLight ? 'bg-gray-50' : 'bg-gray-800/50'}`}>
                        <tr className={`border-b ${isLight ? 'border-gray-200' : 'border-purple-500/20'}`}>
                          <th className={`text-left font-medium py-4 px-6 ${isLight ? 'text-gray-900' : 'text-white'}`}>Month</th>
                          <th className={`text-center font-medium py-4 px-6 ${isLight ? 'text-gray-900' : 'text-white'}`}>Sessions</th>
                          <th className={`text-center font-medium py-4 px-6 ${isLight ? 'text-gray-900' : 'text-white'}`}>Attended</th>
                          <th className={`text-center font-medium py-4 px-6 ${isLight ? 'text-gray-900' : 'text-white'}`}>Attendance %</th>
                          <th className={`text-center font-medium py-4 px-6 ${isLight ? 'text-gray-900' : 'text-white'}`}>Avg Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(playerPerformance.monthly_stats)
                          .sort(([a], [b]) => b.localeCompare(a))
                          .map(([month, stats]) => (
                          <tr key={month} className={`border-b transition-colors duration-200 ${
                            isLight 
                              ? 'border-gray-100 hover:bg-gray-50' 
                              : 'border-purple-500/10 hover:bg-purple-500/5'
                          }`}>
                            <td className={`py-4 px-6 font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>{month}</td>
                            <td className={`py-4 px-6 text-center ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>{stats.total_sessions}</td>
                            <td className={`py-4 px-6 text-center ${isLight ? 'text-green-600' : 'text-green-400'} font-medium`}>{stats.attended_sessions}</td>
                            <td className={`py-4 px-6 text-center font-medium ${getAttendanceColor(stats.attendance_percentage)}`}>
                              {stats.attendance_percentage.toFixed(1)}%
                            </td>
                            <td className={`py-4 px-6 text-center font-medium ${getPerformanceColor(stats.average_rating || 0)}`}>
                              {stats.average_rating ? stats.average_rating.toFixed(1) : 'N/A'}/10
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={`${
              isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'
            } rounded-2xl p-12 text-center`}>
              <Target className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-400' : 'text-gray-600'}`} />
              <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-2`}>
                No performance data available
              </h3>
              <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                Start tracking attendance to see performance analytics for this player.
              </p>
            </div>
          )}
        </div>
      )}

      {players.length === 0 && (
        <div className={`${
          isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'
        } rounded-2xl p-12 text-center`}>
          <Users className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-400' : 'text-gray-600'}`} />
          <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-2`}>
            No players found
          </h3>
          <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
            Add players to your academy to view performance analytics.
          </p>
        </div>
      )}
    </div>
  );
};

export default PerformanceAnalytics;
