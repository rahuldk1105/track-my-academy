import React from 'react';
import { useNavigate } from 'react-router-dom';

const AuthModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    onClose();
    navigate('/login');
  };

  const handleJoinBeta = () => {
    onClose();
    navigate('/signup');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 w-full max-w-md mx-4 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="https://i.ibb.co/1tLZ0Dp1/TMA-LOGO-without-bg.png" 
            alt="Track My Academy" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-white bg-clip-text text-transparent mb-2">
            Welcome to Track My Academy
          </h2>
          <p className="text-gray-400 text-sm">
            Choose your path to get started
          </p>
        </div>

        {/* Beta Badge */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-full px-4 py-2 border border-orange-400/50">
            <span className="text-white text-sm font-semibold">🚀 Beta Program</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Join Beta Button */}
          <button
            onClick={handleJoinBeta}
            className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-sky-500/25"
          >
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Join Beta Program
            </div>
            <div className="text-sm opacity-80 mt-1">
              New academy? Register for exclusive beta access
            </div>
          </button>

          {/* Sign In Button */}
          <button
            onClick={handleSignIn}
            className="w-full border-2 border-sky-400 text-sky-400 hover:bg-sky-400 hover:text-black font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign In
            </div>
            <div className="text-sm opacity-80 mt-1">
              Already have an account? Welcome back
            </div>
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
            <svg className="w-4 h-4 text-sky-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-white text-sm font-medium">Chennai, Tamil Nadu, India</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;