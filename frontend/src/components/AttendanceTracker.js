import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Calendar, Users, UserCheck, TrendingUp,
  CheckCircle, XCircle, Search, Save
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AttendanceTracker = () => {
  const { token } = useAuth();
  const { isLight } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [players, setPlayers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, present, absent

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    if (players.length > 0) {
      loadAttendanceForDate(selectedDate);
    }
  }, [selectedDate, players]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/api/academy/players`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const playersData = await response.json();
      setPlayers(playersData);

      const initialRecords = playersData.map(player => ({
        player_id: player.id,
        player_name: `${player.first_name} ${player.last_name}`,
        position: player.position,
        registration_number: player.registration_number,
        sport: player.sport || 'Other', // Make sure sport is available for payload
        present: false,
        performance_ratings: {}, // Changed to match backend model
        notes: ''
      }));
      setAttendanceRecords(initialRecords);
    } catch (error) {
      console.error('Error loading players:', error);
      setError('Error loading players. Please check your network connection and server status.');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceForDate = async (date) => {
    // When changing date, reset to default state first
    setAttendanceRecords(players.map(player => ({
      player_id: player.id,
      player_name: `${player.first_name} ${player.last_name}`,
      position: player.position,
      registration_number: player.registration_number,
      sport: player.sport || 'Other',
      present: false,
      performance_ratings: {},
      notes: ''
    })));

    try {
      // Then, fetch existing records for that date
      const response = await fetch(`${API_BASE_URL}/api/academy/attendance/${date}`, {
          method: 'POST', // As per backend route definition
          headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });


      if (response.status === 404) {
        // No records for this date, which is fine
        return;
      }
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const attendanceData = await response.json();

      if (attendanceData.attendance_records) {
          setAttendanceRecords(prevRecords =>
            prevRecords.map(record => {
              const existingRecord = attendanceData.attendance_records.find(
                existing => existing.player_id === record.player_id
              );

              if (existingRecord) {
                return {
                  ...record,
                  present: existingRecord.present,
                  performance_ratings: existingRecord.performance_ratings || {},
                  notes: existingRecord.notes || ''
                };
              }
              return record;
            })
          );
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const updateAttendanceRecord = (playerId, field, value) => {
    setAttendanceRecords(prevRecords =>
      prevRecords.map(record =>
        record.player_id === playerId
          ? { ...record, [field]: value }
          : record
      )
    );
  };

  const updatePerformanceRating = (playerId, category, value) => {
    setAttendanceRecords(prevRecords =>
      prevRecords.map(record =>
        record.player_id === playerId
          ? {
              ...record,
              performance_ratings: {
                ...record.performance_ratings,
                [category]: value ? parseInt(value) : null,
              },
            }
          : record
      )
    );
  };


  const markAllPresent = () => {
    setAttendanceRecords(prevRecords =>
      prevRecords.map(record => ({
        ...record,
        present: true,
      }))
    );
  };

  const markAllAbsent = () => {
    setAttendanceRecords(prevRecords =>
      prevRecords.map(record => ({
        ...record,
        present: false,
        performance_ratings: {}
      }))
    );
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);
      setMessage('');
      setError('');

      const attendanceData = {
        date: selectedDate,
        attendance_records: attendanceRecords.map(record => ({
          player_id: record.player_id,
          date: selectedDate,
          present: record.present,
          sport: record.sport, // Add sport field
          performance_ratings: record.present ? record.performance_ratings : {},
          notes: record.notes || null
        }))
      };

      const response = await fetch(`${API_BASE_URL}/api/academy/attendance`, { // Corrected endpoint
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(attendanceData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `API returned status ${response.status}`);
      }

      const result = await response.json();
      setMessage(`✅ Attendance saved successfully! ${result.results?.length || 0} records processed.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving attendance:', error);
      setError(`❌ Error saving attendance: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getPresentCount = () => attendanceRecords.filter(record => record.present).length;
  const getAbsentCount = () => attendanceRecords.filter(record => !record.present).length;
  const getAverageRating = () => {
      const ratingsWithValues = attendanceRecords.flatMap(record =>
          record.present ? Object.values(record.performance_ratings).filter(r => r !== null) : []
      );
      if (ratingsWithValues.length === 0) return 0;
      const sum = ratingsWithValues.reduce((acc, rating) => acc + rating, 0);
      return (sum / ratingsWithValues.length).toFixed(1);
  };


  const getAttendanceData = () => [
    { name: 'Present', value: getPresentCount(), color: '#10B981' },
    { name: 'Absent', value: getAbsentCount(), color: '#EF4444' }
  ];

  const getRatingDistribution = () => {
      const ratings = attendanceRecords
          .filter(record => record.present)
          .flatMap(record => Object.values(record.performance_ratings).filter(r => r !== null));

      const distribution = {};
      for (let i = 1; i <= 10; i++) {
          distribution[i] = ratings.filter(r => r === i).length;
      }

      return Object.entries(distribution)
          .filter(([_, count]) => count > 0)
          .map(([rating, count]) => ({ rating: `${rating}/10`, count }));
  };


  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.player_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.position?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'present' && record.present) ||
      (filterStatus === 'absent' && !record.present);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-gray-50' : 'bg-black'}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className={`animate-spin rounded-full h-12 w-12 border-4 ${
            isLight ? 'border-gray-300 border-t-blue-600' : 'border-gray-800 border-t-cyan-400'
          }`}></div>
          <p className={`${isLight ? 'text-gray-600' : 'text-cyan-400'}`}>Loading attendance tracker...</p>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className={`p-6 space-y-6 ${isLight ? 'bg-gray-50' : 'bg-black'} min-h-screen`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} flex items-center gap-3`}>
            <Calendar className={`w-6 h-6 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
            Attendance Tracker
          </h2>
          <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mt-1`}>
            Track and manage player attendance for training sessions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`px-4 py-2 rounded-xl border transition-all duration-200 ${
                isLight
                  ? 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  : 'bg-gray-900 border-cyan-500/30 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
              } focus:outline-none`}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`${
          isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'
        } rounded-2xl p-6 shadow-sm transition-all duration-200 hover:shadow-md`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Total Players</p>
              <p className={`text-3xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} mt-1`}>
                {attendanceRecords.length}
              </p>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Registered</p>
            </div>
            <div className={`p-3 rounded-xl ${isLight ? 'bg-blue-100' : 'bg-cyan-500/20'}`}>
              <Users className={`w-6 h-6 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
            </div>
          </div>
        </div>

        <div className={`${
          isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-green-500/30'
        } rounded-2xl p-6 shadow-sm transition-all duration-200 hover:shadow-md`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Present</p>
              <p className={`text-3xl font-bold ${isLight ? 'text-green-600' : 'text-green-400'} mt-1`}>
                {getPresentCount()}
              </p>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                {attendanceRecords.length > 0 ? Math.round((getPresentCount() / attendanceRecords.length) * 100) : 0}% attendance
              </p>
            </div>
            <div className={`p-3 rounded-xl ${isLight ? 'bg-green-100' : 'bg-green-500/20'}`}>
              <CheckCircle className={`w-6 h-6 ${isLight ? 'text-green-600' : 'text-green-400'}`} />
            </div>
          </div>
        </div>

        <div className={`${
          isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-red-500/30'
        } rounded-2xl p-6 shadow-sm transition-all duration-200 hover:shadow-md`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Absent</p>
              <p className={`text-3xl font-bold ${isLight ? 'text-red-600' : 'text-red-400'} mt-1`}>
                {getAbsentCount()}
              </p>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Missing today</p>
            </div>
            <div className={`p-3 rounded-xl ${isLight ? 'bg-red-100' : 'bg-red-500/20'}`}>
              <XCircle className={`w-6 h-6 ${isLight ? 'text-red-600' : 'text-red-400'}`} />
            </div>
          </div>
        </div>

        <div className={`${
          isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-purple-500/30'
        } rounded-2xl p-6 shadow-sm transition-all duration-200 hover:shadow-md`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Avg Performance</p>
              <p className={`text-3xl font-bold ${isLight ? 'text-purple-600' : 'text-purple-400'} mt-1`}>
                {getAverageRating()}/10
              </p>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Today's average</p>
            </div>
            <div className={`p-3 rounded-xl ${isLight ? 'bg-purple-100' : 'bg-purple-500/20'}`}>
              <TrendingUp className={`w-6 h-6 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Distribution */}
        <div className={`${
          isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'
        } rounded-2xl p-6 shadow-sm`}>
          <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>
            Attendance Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={getAttendanceData()}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {getAttendanceData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isLight ? '#ffffff' : '#1f2937',
                  border: `1px solid ${isLight ? '#e5e7eb' : '#06b6d4'}`,
                  borderRadius: '12px',
                  color: isLight ? '#374151' : '#ffffff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Rating Distribution */}
        <div className={`${
          isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-purple-500/30'
        } rounded-2xl p-6 shadow-sm`}>
          <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-4`}>
            Performance Ratings
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={getRatingDistribution()}>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e5e7eb' : '#374151'} />
              <XAxis dataKey="rating" stroke={isLight ? '#6b7280' : '#9ca3af'} />
              <YAxis stroke={isLight ? '#6b7280' : '#9ca3af'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isLight ? '#ffffff' : '#1f2937',
                  border: `1px solid ${isLight ? '#e5e7eb' : '#8b5cf6'}`,
                  borderRadius: '12px',
                  color: isLight ? '#374151' : '#ffffff'
                }}
              />
              <Bar
                dataKey="count"
                fill={isLight ? '#8B5CF6' : '#a855f7'}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={markAllPresent}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
              isLight
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Mark All Present
          </button>
          <button
            onClick={markAllAbsent}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
              isLight
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
            }`}
          >
            <XCircle className="w-4 h-4" />
            Mark All Absent
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              isLight ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 w-64 rounded-xl border transition-all duration-200 ${
                isLight
                  ? 'border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500'
                  : 'border-cyan-500/30 bg-gray-800 focus:bg-gray-700 focus:border-cyan-400 text-white'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-4 py-2 rounded-xl border transition-all duration-200 ${
              isLight
                ? 'border-gray-200 bg-white text-gray-900 focus:border-blue-500'
                : 'border-cyan-500/30 bg-gray-800 text-white focus:border-cyan-400'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          >
            <option value="all">All Players</option>
            <option value="present">Present Only</option>
            <option value="absent">Absent Only</option>
          </select>

          <button
            onClick={saveAttendance}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all duration-200 ${
              isLight
                ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50'
            } disabled:cursor-not-allowed`}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-xl ${
          message.includes('✅')
            ? isLight ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-green-500/10 border border-green-500/30 text-green-400'
            : isLight ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {message}
        </div>
      )}

      {error && (
        <div className={`p-4 rounded-xl ${
          isLight ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {error}
        </div>
      )}

      {/* Attendance Table */}
      <div className={`${
        isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'
      } rounded-2xl shadow-sm overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${isLight ? 'bg-gray-50' : 'bg-gray-800/50'}`}>
              <tr className={`border-b ${isLight ? 'border-gray-200' : 'border-cyan-500/20'}`}>
                <th className={`text-left font-medium py-4 px-6 ${isLight ? 'text-gray-900' : 'text-white'}`}>Player</th>
                <th className={`text-left font-medium py-4 px-6 ${isLight ? 'text-gray-900' : 'text-white'}`}>Position</th>
                <th className={`text-left font-medium py-4 px-6 ${isLight ? 'text-gray-900' : 'text-white'}`}>Jersey</th>
                <th className={`text-center font-medium py-4 px-6 ${isLight ? 'text-gray-900' : 'text-white'}`}>Present</th>
                <th className={`text-center font-medium py-4 px-6 ${isLight ? 'text-gray-900' : 'text-white'}`}>Performance</th>
                <th className={`text-left font-medium py-4 px-6 ${isLight ? 'text-gray-900' : 'text-white'}`}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.player_id} className={`border-b transition-colors duration-200 ${
                  isLight
                    ? 'border-gray-100 hover:bg-gray-50'
                    : 'border-cyan-500/10 hover:bg-cyan-500/5'
                }`}>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                        {record.player_name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                          {record.player_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className={`py-4 px-6 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                    {record.position || 'Not specified'}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      #{record.registration_number || 'N/A'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={record.present}
                        onChange={(e) => updateAttendanceRecord(record.player_id, 'present', e.target.checked)}
                        className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                          isLight
                            ? 'text-green-600 focus:ring-green-500 border-gray-300'
                            : 'text-green-400 focus:ring-green-400 bg-gray-800 border-green-500/30'
                        }`}
                      />
                    </label>
                  </td>
                  <td className="py-4 px-6">
                  <select
                      value={record.performance_ratings?.['Technical Skills'] || ''}
                      onChange={(e) => updatePerformanceRating(record.player_id, 'Technical Skills', e.target.value)}
                      disabled={!record.present}
                      className={`w-20 px-3 py-2 rounded-lg border text-center transition-all duration-200 ${
                          isLight
                              ? 'border-gray-200 bg-white text-gray-900 focus:border-blue-500'
                              : 'border-purple-500/30 bg-gray-800 text-white focus:border-purple-400'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                      <option value="">-</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
                          <option key={rating} value={rating}>{rating}</option>
                      ))}
                  </select>
                  </td>
                  <td className="py-4 px-6">
                    <input
                      type="text"
                      value={record.notes}
                      onChange={(e) => updateAttendanceRecord(record.player_id, 'notes', e.target.value)}
                      placeholder="Add notes..."
                      className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 ${
                        isLight
                          ? 'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500'
                          : 'border-gray-600/30 bg-gray-800 text-white focus:border-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredRecords.length === 0 && (
        <div className={`${
          isLight ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-cyan-500/30'
        } rounded-2xl p-12 text-center`}>
          <Users className={`w-16 h-16 mx-auto mb-4 ${isLight ? 'text-gray-400' : 'text-gray-600'}`} />
          <h3 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-2`}>
            No players found
          </h3>
          <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Add players to your academy to start tracking attendance.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;
