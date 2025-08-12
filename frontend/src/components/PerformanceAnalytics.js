import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

const PerformanceAnalytics = () => {
  const { token } = useAuth();
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [playerPerformance, setPlayerPerformance] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
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
    if (rating >= 8) return 'text-green-400';
    if (rating >= 6) return 'text-yellow-400';
    if (rating >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-400';
    if (percentage >= 80) return 'text-yellow-400';
    if (percentage >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Performance Analytics</h2>
        
        {/* Date Range Selector */}
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1">From</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1">To</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Overall Academy Summary */}
      {attendanceSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
            <h3 className="text-sm font-medium text-gray-300">Total Sessions</h3>
            <p className="text-2xl font-bold text-white">{attendanceSummary.total_records}</p>
          </div>
          <div className="bg-green-500/10 backdrop-blur-md rounded-lg p-4 border border-green-500/20">
            <h3 className="text-sm font-medium text-green-300">Attendance Rate</h3>
            <p className={`text-2xl font-bold ${getAttendanceColor(attendanceSummary.overall_attendance_rate)}`}>
              {attendanceSummary.overall_attendance_rate}%
            </p>
          </div>
          <div className="bg-blue-500/10 backdrop-blur-md rounded-lg p-4 border border-blue-500/20">
            <h3 className="text-sm font-medium text-blue-300">Avg Performance</h3>
            <p className={`text-2xl font-bold ${getPerformanceColor(attendanceSummary.average_performance_rating || 0)}`}>
              {attendanceSummary.average_performance_rating ? attendanceSummary.average_performance_rating.toFixed(1) : 'N/A'}/10
            </p>
          </div>
          <div className="bg-purple-500/10 backdrop-blur-md rounded-lg p-4 border border-purple-500/20">
            <h3 className="text-sm font-medium text-purple-300">Present Records</h3>
            <p className="text-2xl font-bold text-purple-400">{attendanceSummary.present_records}</p>
          </div>
        </div>
      )}

      {/* Player Selection */}
      <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10 mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-gray-300 font-medium">Select Player:</label>
          <select
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-400">Loading performance data...</span>
            </div>
          ) : playerPerformance ? (
            <>
              {/* Player Performance Summary */}
              <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {playerPerformance.player_name} - Performance Summary
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{playerPerformance.total_sessions}</div>
                    <div className="text-gray-400 text-sm">Total Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{playerPerformance.attended_sessions}</div>
                    <div className="text-gray-400 text-sm">Attended</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getAttendanceColor(playerPerformance.attendance_percentage)}`}>
                      {playerPerformance.attendance_percentage}%
                    </div>
                    <div className="text-gray-400 text-sm">Attendance</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getPerformanceColor(playerPerformance.average_performance_rating || 0)}`}>
                      {playerPerformance.average_performance_rating ? playerPerformance.average_performance_rating.toFixed(1) : 'N/A'}/10
                    </div>
                    <div className="text-gray-400 text-sm">Avg Rating</div>
                  </div>
                </div>
              </div>

              {/* Performance Trend */}
              {playerPerformance.performance_trend && playerPerformance.performance_trend.length > 0 && (
                <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Performance Trend</h3>
                  <div className="space-y-2">
                    {playerPerformance.performance_trend.slice(-10).map((trend, index) => (
                      <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded">
                        <span className="text-gray-300">{trend.date}</span>
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold ${getPerformanceColor(trend.rating)}`}>
                            {trend.rating}/10
                          </span>
                          <div className="w-24 bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                trend.rating >= 8 ? 'bg-green-500' :
                                trend.rating >= 6 ? 'bg-yellow-500' :
                                trend.rating >= 4 ? 'bg-orange-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${(trend.rating / 10) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly Statistics */}
              {playerPerformance.monthly_stats && Object.keys(playerPerformance.monthly_stats).length > 0 && (
                <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Monthly Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left text-gray-300 font-medium py-2">Month</th>
                          <th className="text-center text-gray-300 font-medium py-2">Sessions</th>
                          <th className="text-center text-gray-300 font-medium py-2">Attended</th>
                          <th className="text-center text-gray-300 font-medium py-2">Attendance %</th>
                          <th className="text-center text-gray-300 font-medium py-2">Avg Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(playerPerformance.monthly_stats)
                          .sort(([a], [b]) => b.localeCompare(a))
                          .map(([month, stats]) => (
                          <tr key={month} className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-2 text-white">{month}</td>
                            <td className="py-2 text-center text-gray-300">{stats.total_sessions}</td>
                            <td className="py-2 text-center text-green-400">{stats.attended_sessions}</td>
                            <td className={`py-2 text-center ${getAttendanceColor(stats.attendance_percentage)}`}>
                              {stats.attendance_percentage.toFixed(1)}%
                            </td>
                            <td className={`py-2 text-center ${getPerformanceColor(stats.average_rating || 0)}`}>
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
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">No performance data available</div>
              <div className="text-sm text-gray-500">
                Start tracking attendance to see performance analytics.
              </div>
            </div>
          )}
        </div>
      )}

      {players.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">No players found</div>
          <div className="text-sm text-gray-500">
            Add players to your academy to view performance analytics.
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceAnalytics;