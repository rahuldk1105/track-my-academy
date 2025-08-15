import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const Avatar = ({ name }) => {
  const initials = (name || '').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-white flex items-center justify-center font-semibold">
      {initials || 'PL'}
    </div>
  );
};

const Badge = ({ children, tone = 'gray', outline = false }) => {
  const tones = {
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200'
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${tones[tone]}`}>{children}</span>
  );
};

const PlayerCard = ({ player, onEdit, onDelete }) => {
  const { isLight } = useTheme();
  const fullName = `${player.first_name || ''} ${player.last_name || ''}`.trim();

  return (
    <div className={`${isLight ? 'bg-white border border-gray-200 shadow-sm hover:shadow-md' : 'bg-gray-900 border border-white/10 hover:bg-gray-800'} rounded-xl transition-all duration-200 p-4 flex flex-col`}>\n      <div className="flex items-start gap-3">
        <Avatar name={fullName || player.email} />
        <div className="flex-1 min-w-0">
          <div className={`font-medium truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{fullName || player.email}</div>
          <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm truncate`}>{player.email || 'No email'}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(player)} className={`${isLight ? 'text-sky-700' : 'text-sky-300'} text-sm hover:underline`}>Edit</button>
          <button onClick={() => onDelete(player.id)} className={`${isLight ? 'text-red-700' : 'text-red-300'} text-sm hover:underline`}>Delete</button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Position</div>
        <div className={`${isLight ? 'text-gray-900' : 'text-gray-200'}`}>{player.position || '—'}</div>
        <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Reg #</div>
        <div>
          <Badge tone="blue">{player.registration_number || 'Not Assigned'}</Badge>
        </div>
        <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Age</div>
        <div className={`${isLight ? 'text-gray-900' : 'text-gray-200'}`}>{player.age || 'N/A'}</div>
        <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Status</div>
        <div>
          <Badge tone={player.status === 'active' ? 'emerald' : 'gray'}>{player.status || 'inactive'}</Badge>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {player.has_login ? (
          <>
            <Badge tone="emerald">✓ Login Enabled</Badge>
            {player.default_password && !player.password_changed && (
              <span className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-xs`}>
                Default Password: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{player.default_password}</span>
              </span>
            )}
          </>
        ) : (
          <Badge> No Login Access </Badge>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;