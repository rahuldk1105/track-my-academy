import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const SideNav = ({ items = [], activeId, onChange, header = null }) => {
  const { isLight } = useTheme();

  return (
    <aside className={`w-64 shrink-0 ${isLight ? 'bg-white border-r border-gray-200' : 'bg-gray-900 border-r border-white/10'} rounded-xl md:rounded-none md:rounded-l-xl overflow-hidden`}>\n      {header && (
        <div className={`px-4 py-4 ${isLight ? 'border-b border-gray-200 bg-white/80' : 'border-b border-white/10 bg-gray-900/60'} sticky top-[68px] md:top-0 z-0`}>{header}</div>
      )}
      <nav className="p-3 space-y-1">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border group ${
              activeId === it.id
                ? isLight
                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                  : 'bg-sky-600/20 text-sky-300 border-sky-600/30'
                : isLight
                  ? 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
                  : 'bg-gray-900 text-gray-300 hover:bg-gray-800 border-white/10'
            }`}
          >
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-md ${
              activeId === it.id
                ? isLight ? 'bg-sky-100 text-sky-700' : 'bg-sky-600/30 text-sky-300'
                : isLight ? 'bg-gray-100 text-gray-600' : 'bg-gray-800 text-gray-300'
            }`}>
              {it.icon}
            </span>
            <span className="truncate">{it.label}</span>
            {it.right && <span className="ml-auto">{it.right}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default SideNav;