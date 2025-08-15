import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const SideNav = ({ activeId, onChange, items }) => {
  const { isLight } = useTheme();

  return (
    <nav className={`w-64 min-h-screen pt-12 ${isLight ? 'bg-white border-r border-gray-200' : 'bg-gray-900 border-r border-white/10'}`}>
      <ul className="space-y-2 px-4">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => onChange(item.id)}
              className={`w-full flex items-center p-3 text-sm font-medium transition-colors duration-200 rounded-none
                ${activeId === item.id 
                  ? `${isLight ? 'bg-sky-50 text-sky-700' : 'bg-sky-600 text-white'}`
                  : `${isLight ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-400 hover:bg-gray-800'}`
                }
              `}
            >
              <span className="w-5 h-5 mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default SideNav;
