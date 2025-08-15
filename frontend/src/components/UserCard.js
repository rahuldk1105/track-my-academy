import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const UserCard = ({ user, onEdit, onDelete }) => {
  const { isLight } = useTheme();
  const initials = (user.email || 'U').slice(0,2).toUpperCase();
  return (
    <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm hover:shadow-md' : 'bg-gray-900 border border-white/10 hover:bg-gray-800'} rounded-xl transition-all duration-200 p-4`}>\n      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-white flex items-center justify-center font-semibold">{initials}</div>
        <div className="flex-1 min-w-0">
          <div className={`font-medium truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{user.email}</div>
          <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm truncate`}>{user.academy}</div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${user.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>{user.status}</span>
      </div>
      <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-xs mt-2`}>Joined: {user.joined}</div>
      <div className="mt-3 flex gap-3 text-sm">
        <button onClick={() => onEdit?.(user)} className={`${isLight ? 'text-sky-700' : 'text-sky-300'} hover:underline`}>Edit</button>
        <button onClick={() => onDelete?.(user)} className={`${isLight ? 'text-red-700' : 'text-red-300'} hover:underline`}>Delete</button>
      </div>
    </div>
  );
};

export default UserCard;