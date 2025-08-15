import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const Avatar = ({ name }) => {
  const initials = (name || '').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center font-semibold">
      {initials || 'CH'}
    </div>
  );
};

const CoachCard = ({ coach, onEdit, onDelete }) => {
  const { isLight } = useTheme();
  const fullName = `${coach.first_name || ''} ${coach.last_name || ''}`.trim();

  return (
    <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm hover:shadow-md' : 'bg-gray-900 border border-white/10 hover:bg-gray-800'} rounded-xl transition-all duration-200 p-4 flex flex-col`}>\n      <div className="flex items-start gap-3">
        <Avatar name={fullName || coach.email} />
        <div className="flex-1 min-w-0">
          <div className={`font-medium truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{fullName || coach.email}</div>
          <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm truncate`}>{coach.email || 'No email'}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(coach)} className={`${isLight ? 'text-sky-700' : 'text-sky-300'} text-sm hover:underline`}>Edit</button>
          <button onClick={() => onDelete(coach.id)} className={`${isLight ? 'text-red-700' : 'text-red-300'} text-sm hover:underline`}>Delete</button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Specialization</div>
        <div className={`${isLight ? 'text-gray-900' : 'text-gray-200'}`}>{coach.specialization || 'General'}</div>
        <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Experience</div>
        <div className={`${isLight ? 'text-gray-900' : 'text-gray-200'}`}>{coach.experience_years ? `${coach.experience_years} yrs` : '—'}</div>
        <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Status</div>
        <div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${coach.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
            {coach.status || 'inactive'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CoachCard;