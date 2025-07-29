import React, { useState, useEffect } from 'react';
import { apiService } from '../App';

// Create Session Modal
export const CreateSessionModal = ({ academies, coaches, students, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    session_name: '',
    description: '',
    session_date: '',
    start_time: '',
    end_time: '',
    location: '',
    max_participants: '',
    session_type: 'training',
    academy_id: academies[0]?.academy_id || '',
    coach_id: coaches[0]?.coach_id || '',
    assigned_students: []
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const sessionData = {
        ...formData,
        session_date: new Date(formData.session_date).toISOString(),
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null
      };
      
      await apiService.createSession(sessionData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const academyStudents = students.filter(student => student.academy_id === formData.academy_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Create Training Session</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Session Name"
              className="input-field"
              value={formData.session_name}
              onChange={(e) => setFormData({...formData, session_name: e.target.value})}
              required
            />
            
            <select
              className="input-field"
              value={formData.session_type}
              onChange={(e) => setFormData({...formData, session_type: e.target.value})}
              required
            >
              <option value="training">Training</option>
              <option value="match">Match</option>
              <option value="practice">Practice</option>
              <option value="assessment">Assessment</option>
            </select>
          </div>

          <textarea
            placeholder="Description (optional)"
            className="input-field"
            rows="3"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="date"
              className="input-field"
              value={formData.session_date}
              onChange={(e) => setFormData({...formData, session_date: e.target.value})}
              required
            />
            
            <input
              type="time"
              placeholder="Start Time"
              className="input-field"
              value={formData.start_time}
              onChange={(e) => setFormData({...formData, start_time: e.target.value})}
              required
            />
            
            <input
              type="time"
              placeholder="End Time"
              className="input-field"
              value={formData.end_time}
              onChange={(e) => setFormData({...formData, end_time: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Location"
              className="input-field"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
            
            <input
              type="number"
              placeholder="Max Participants"
              className="input-field"
              value={formData.max_participants}
              onChange={(e) => setFormData({...formData, max_participants: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              className="input-field"
              value={formData.academy_id}
              onChange={(e) => setFormData({...formData, academy_id: e.target.value, assigned_students: []})}
              required
            >
              {academies.map(academy => (
                <option key={academy.academy_id} value={academy.academy_id}>
                  {academy.academy_name}
                </option>
              ))}
            </select>

            <select
              className="input-field"
              value={formData.coach_id}
              onChange={(e) => setFormData({...formData, coach_id: e.target.value})}
              required
            >
              {coaches.filter(coach => coach.academy_id === formData.academy_id).map(coach => (
                <option key={coach.coach_id} value={coach.coach_id}>
                  {coach.name} - {coach.specialization}
                </option>
              ))}
            </select>
          </div>

          {academyStudents.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Students (optional)
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded p-2 space-y-2">
                {academyStudents.map(student => (
                  <label key={student.student_id} className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={formData.assigned_students.includes(student.student_id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData, 
                            assigned_students: [...formData.assigned_students, student.student_id]
                          });
                        } else {
                          setFormData({
                            ...formData, 
                            assigned_students: formData.assigned_students.filter(id => id !== student.student_id)
                          });
                        }
                      }}
                    />
                    <span className="text-sm">{student.name} - {student.enrolled_program}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Session List Component
export const SessionList = ({ sessions, onSessionClick, userRole }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSessionTypeColor = (type) => {
    switch(type) {
      case 'training': return 'bg-blue-100 text-blue-800';
      case 'match': return 'bg-red-100 text-red-800';
      case 'practice': return 'bg-green-100 text-green-800';
      case 'assessment': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No sessions scheduled yet.</p>
        </div>
      ) : (
        sessions.map((session) => (
          <div 
            key={session.session_id} 
            className="card hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onSessionClick && onSessionClick(session)}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{session.session_name}</h3>
                {session.description && (
                  <p className="text-gray-600 text-sm mt-1">{session.description}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                  {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSessionTypeColor(session.session_type)}`}>
                  {session.session_type.charAt(0).toUpperCase() + session.session_type.slice(1)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Date:</span>
                <p className="font-medium">{formatDate(session.session_date)}</p>
              </div>
              <div>
                <span className="text-gray-600">Time:</span>
                <p className="font-medium">{formatTime(session.start_time)} - {formatTime(session.end_time)}</p>
              </div>
              <div>
                <span className="text-gray-600">Location:</span>
                <p className="font-medium">{session.location || 'TBD'}</p>
              </div>
              <div>
                <span className="text-gray-600">Participants:</span>
                <p className="font-medium">
                  {session.assigned_students?.length || 0}
                  {session.max_participants && ` / ${session.max_participants}`}
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Attendance Marking Component
export const AttendanceMarking = ({ session, students, onClose, onSuccess }) => {
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize attendance data
  useEffect(() => {
    const initialData = {};
    session.assigned_students?.forEach(studentId => {
      initialData[studentId] = {
        status: 'present',
        notes: ''
      };
    });
    setAttendanceData(initialData);
  }, [session]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleNotesChange = (studentId, notes) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Mark attendance for each student
      const promises = Object.entries(attendanceData).map(([studentId, data]) => {
        return apiService.markAttendance({
          session_id: session.session_id,
          student_id: studentId,
          status: data.status,
          notes: data.notes
        });
      });

      await Promise.all(promises);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const assignedStudents = students.filter(student => 
    session.assigned_students?.includes(student.student_id)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold">Mark Attendance</h3>
            <p className="text-gray-600">{session.session_name} - {new Date(session.session_date).toLocaleDateString()}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {assignedStudents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No students assigned to this session.</p>
          ) : (
            assignedStudents.map(student => (
              <div key={student.student_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {student.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{student.name}</h4>
                      <p className="text-sm text-gray-600">{student.enrolled_program}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {['present', 'late', 'absent', 'excused'].map(status => (
                      <label key={status} className="flex items-center">
                        <input
                          type="radio"
                          name={`attendance-${student.student_id}`}
                          value={status}
                          checked={attendanceData[student.student_id]?.status === status}
                          onChange={() => handleStatusChange(student.student_id, status)}
                          className="mr-1"
                        />
                        <span className={`text-sm px-2 py-1 rounded ${
                          status === 'present' ? 'text-green-700' :
                          status === 'late' ? 'text-yellow-700' :
                          status === 'absent' ? 'text-red-700' :
                          'text-gray-700'
                        }`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Notes (optional)"
                  className="input-field text-sm"
                  value={attendanceData[student.student_id]?.notes || ''}
                  onChange={(e) => handleNotesChange(student.student_id, e.target.value)}
                />
              </div>
            ))
          )}
        </div>

        <div className="flex space-x-4 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading || assignedStudents.length === 0}
            className="btn-primary flex-1"
          >
            {loading ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>
    </div>
  );
};