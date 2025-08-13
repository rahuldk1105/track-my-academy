import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../AuthContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme, isLight, isDark } = useTheme();
  const { user } = useAuth();

  const handleToggle = () => {
    toggleTheme(user?.email);
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        relative inline-flex items-center justify-center p-2 rounded-lg transition-all duration-300
        ${isLight 
          ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300' 
          : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
        }
        group focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2
        ${className}
      `}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-6 h-6">
        {/* Sun icon for light mode */}
        <svg
          className={`
            absolute inset-0 w-6 h-6 transition-all duration-300 transform
            ${isLight ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'}
          `}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>

        {/* Moon icon for dark mode */}
        <svg
          className={`
            absolute inset-0 w-6 h-6 transition-all duration-300 transform
            ${isDark ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}
          `}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </div>

      {/* Tooltip text */}
      <span className="sr-only">
        {isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      </span>
    </button>
  );
};

export default ThemeToggle;