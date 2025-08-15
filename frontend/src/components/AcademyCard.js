import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const AcademyCard = ({ academy, selected, onSelect, onApprove, onReject, onEdit, onDelete }) => {
  const { isLight } = useTheme();
  const backend = process.env.REACT_APP_BACKEND_URL;
  const logoUrl = academy.logo_url ? `${backend}${academy.logo_url}` : null;

  return (
    <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm hover:shadow-md' : 'bg-gray-900 border border-white/10 hover:bg-gray-800'} rounded-xl transition-all duration-200 p-4 relative`}>\n      <div className="absolute top-3 left-3">
        <input type="checkbox" checked={selected} onChange={onSelect} className={`${isLight ? 'rounded border-gray-300 text-sky-600 focus:ring-sky-500' : 'rounded bg-gray-800 border-gray-600 text-sky-500 focus:ring-sky-500'}`} />
      </div>
      <div className="flex items-start gap-3 pl-7">
        {logoUrl ? (
          <img src={logoUrl} alt={`${academy.name} logo`} className={`${isLight ? 'bg-gray-100' : 'bg-gray-800'} w-12 h-12 rounded-lg object-cover border ${isLight ? 'border-gray-200' : 'border-white/10'}`} />
        ) : (
          <div className={`${isLight ? 'bg-gray-100' : 'bg-gray-800'} w-12 h-12 rounded-lg flex items-center justify-center`}>
            <svg className={`${isLight ? 'text-gray-400' : 'text-gray-500'} w-7 h-7`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 011.732-1.732l.268.268a2 2 0 002.828 0l.268-.268A2 2 0 0112 8a2 2 0 11-4 4 2 2 0 01-2-2z" clipRule="evenodd" /></svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className={`font-medium truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{academy.name}</div>
          <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm`}>{academy.owner_name} • {academy.location || '—'} • {academy.sports_type || '—'}</div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
          academy.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          academy.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200' :
          academy.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-700 border-gray-200'
        }`}>{academy.status}</span>
      </div>

      <div className={`mt-3 grid grid-cols-2 gap-2 text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
        <div>Players: <span className={`${isLight ? 'text-gray-900' : 'text-gray-200'}`}>{academy.player_limit || 50}</span></div>
        <div>Coaches: <span className={`${isLight ? 'text-gray-900' : 'text-gray-200'}`}>{academy.coach_limit || 10}</span></div>
      </div>

      <div className="mt-3 flex gap-3 text-sm">
        {academy.status === 'pending' && (
          <>
            <button onClick={onApprove} className={`${isLight ? 'text-emerald-700' : 'text-emerald-300'} hover:underline`}>Approve</button>
            <button onClick={onReject} className={`${isLight ? 'text-red-700' : 'text-red-300'} hover:underline`}>Reject</button>
          </>
        )}
        <button onClick={onEdit} className={`${isLight ? 'text-sky-700' : 'text-sky-300'} hover:underline`}>Edit</button>
        <button onClick={onDelete} className={`${isLight ? 'text-red-700' : 'text-red-300'} hover:underline`}>Delete</button>
      </div>
    </div>
  );
};

export default AcademyCard;