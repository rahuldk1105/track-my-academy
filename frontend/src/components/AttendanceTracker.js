import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

const AttendanceTracker = () => {
  const { token } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [players, setPlayers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadAttendanceForDate(selectedDate);
    }
  }, [selectedDate]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/academy/players`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const playersData = await response.json();
        setPlayers(playersData);
        
        // Initialize attendance records for all players
        const initialRecords = playersData.map(player => ({
          player_id: player.id,
          player_name: `${player.first_name} ${player.last_name}`,
          position: player.position,
          registration_number: player.registration_number,
          present: false,
          performance_rating: null,
          notes: ''
        }));
        setAttendanceRecords(initialRecords);
      }
    } catch (error) {
      console.error('Error loading players:', error);
      setMessage('Error loading players');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceForDate = async (date) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/academy/attendance/${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const attendanceData = await response.json();
        
        // Update attendance records with existing data
        setAttendanceRecords(prevRecords => 
          prevRecords.map(record => {
            const existingRecord = attendanceData.attendance_records.find(
              existing => existing.player_id === record.player_id
            );
            
            if (existingRecord) {
              return {
                ...record,
                present: existingRecord.present,
                performance_rating: existingRecord.performance_rating,
                notes: existingRecord.notes || ''
              };
            }
            
            return {
              ...record,
              present: false,
              performance_rating: null,
              notes: ''
            };
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

  const markAllPresent = () => {
    setAttendanceRecords(prevRecords =>
      prevRecords.map(record => ({
        ...record,
        present: true,
        performance_rating: record.performance_rating || 7
      }))
    );
  };

  const markAllAbsent = () => {
    setAttendanceRecords(prevRecords =>
      prevRecords.map(record => ({
        ...record,
        present: false,
        performance_rating: null
      }))
    );
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);
      setMessage('');

      // Prepare attendance data for API
      const attendanceData = {
        date: selectedDate,
        attendance_records: attendanceRecords.map(record => ({
          player_id: record.player_id,
          date: selectedDate,
          present: record.present,
          performance_rating: record.present ? record.performance_rating : null,
          notes: record.notes || null
        }))
      };

      const response = await fetch(`${API_BASE_URL}/api/academy/attendance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(attendanceData)
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(`✅ Attendance saved successfully! ${result.results?.length || 0} records processed.`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(`❌ Error saving attendance: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      setMessage('❌ Error saving attendance');
    } finally {
      setSaving(false);
    }
  };

  const getPresentCount = () => attendanceRecords.filter(record => record.present).length;
  const getAbsentCount = () => attendanceRecords.filter(record => !record.present).length;
  const getAverageRating = () => {
    const ratingsWithValues = attendanceRecords.filter(record => record.present && record.performance_rating);
    if (ratingsWithValues.length === 0) return 0;
    const sum = ratingsWithValues.reduce((acc, record) => acc + record.performance_rating, 0);
    return (sum / ratingsWithValues.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-400">Loading players...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Attendance Tracker</h2>
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
          <h3 className="text-sm font-medium text-gray-300">Total Players</h3>
          <p className="text-2xl font-bold text-white">{attendanceRecords.length}</p>
        </div>
        <div className="bg-green-500/10 backdrop-blur-md rounded-lg p-4 border border-green-500/20">
          <h3 className="text-sm font-medium text-green-300">Present</h3>
          <p className="text-2xl font-bold text-green-400">{getPresentCount()}</p>
        </div>
        <div className="bg-red-500/10 backdrop-blur-md rounded-lg p-4 border border-red-500/20">
          <h3 className="text-sm font-medium text-red-300">Absent</h3>
          <p className="text-2xl font-bold text-red-400">{getAbsentCount()}</p>
        </div>
        <div className="bg-blue-500/10 backdrop-blur-md rounded-lg p-4 border border-blue-500/20">
          <h3 className="text-sm font-medium text-blue-300">Avg Rating</h3>
          <p className="text-2xl font-bold text-blue-400">{getAverageRating()}/10</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button
            onClick={markAllPresent}
            className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 px-4 py-2 rounded-lg transition-all duration-300 text-sm"
          >
            Mark All Present
          </button>
          <button
            onClick={markAllAbsent}
            className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 px-4 py-2 rounded-lg transition-all duration-300 text-sm"
          >
            Mark All Absent
          </button>
        </div>
        <button
          onClick={saveAttendance}
          disabled={saving}
          className="bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 px-6 py-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.includes('✅') 
            ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {message}
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-300 font-medium py-3 px-4">Player</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Position</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Jersey</th>
                <th className="text-center text-gray-300 font-medium py-3 px-4">Present</th>
                <th className="text-center text-gray-300 font-medium py-3 px-4">Performance Rating</th>
                <th className="text-left text-gray-300 font-medium py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.map((record) => (
                <tr key={record.player_id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4">
                    <div className="text-white font-medium">{record.player_name}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{record.position || 'Not specified'}</td>
                  <td className="py-3 px-4">
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-sm">
                      #{record.registration_number || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={record.present}
                        onChange={(e) => updateAttendanceRecord(record.player_id, 'present', e.target.checked)}
                        className="form-checkbox h-5 w-5 text-green-500 bg-gray-800 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                      />
                    </label>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={record.performance_rating || ''}
                      onChange={(e) => updateAttendanceRecord(record.player_id, 'performance_rating', e.target.value ? parseInt(e.target.value) : null)}
                      disabled={!record.present}
                      className="w-20 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">-</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
                        <option key={rating} value={rating}>{rating}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={record.notes}
                      onChange={(e) => updateAttendanceRecord(record.player_id, 'notes', e.target.value)}
                      placeholder="Add notes..."
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {attendanceRecords.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">No players found</div>
          <div className="text-sm text-gray-500">
            Add players to your academy to start tracking attendance.
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;
