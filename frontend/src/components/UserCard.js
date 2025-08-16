import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Mail, Calendar, User } from 'lucide-react';

const UserCard = ({ user, onEdit, onDelete }) => {
  const { isLight } = useTheme();
  const initials = (user.email || 'U').slice(0,2).toUpperCase();
  
  return (
    <div className={`${isLight ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 shadow-sm border ${isLight ? 'border-gray-200' : 'border-gray-700'} hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-semibold text-lg">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <User className={`w-4 h-4 ${isLight ? 'text-gray-500' : 'text-gray-400'}`} />
            <div className={`font-semibold truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{user.email}</div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Mail className={`w-4 h-4 ${isLight ? 'text-gray-500' : 'text-gray-400'}`} />
            <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm truncate`}>{user.academy}</div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          user.status === 'active' 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-orange-100 text-orange-700 border border-orange-200'
        }`}>
          {user.status}
        </span>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>Joined: {user.joined}</span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={() => onEdit?.(user)} 
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Edit
        </button>
        <button 
          onClick={() => onDelete?.(user)} 
          className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors duration-200"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default UserCard;