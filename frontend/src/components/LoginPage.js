import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // TODO: Implement actual login logic
    console.log('Login attempt:', formData);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      alert('Login functionality will be implemented in backend integration phase.');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-12 gap-4 h-full w-full transform rotate-12 scale-150">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className={`bg-gradient-to-br from-sky-400/20 to-transparent rounded-lg animate-pulse`}
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${2 + (i % 3)}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Back to Home */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 text-sky-400 hover:text-white transition-colors duration-300 flex items-center z-20"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </Link>

      {/* Login Form */}
      <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/10 w-full max-w-md mx-4 relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <img 
            src="https://i.ibb.co/1tLZ0Dp1/TMA-LOGO-without-bg.png" 
            alt="Track My Academy" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-white bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-400">
            Sign in to your Track My Academy account
          </p>
        </div>

        {/* Beta Badge */}
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-full px-4 py-2 border border-orange-400/50">
            <span className="text-white text-sm font-semibold">🚀 Beta Access Portal</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Academy Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all duration-300"
              placeholder="academy@example.com"
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all duration-300"
              placeholder="Enter your password"
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-sky-400 focus:ring-sky-400" />
              <span className="ml-2 text-sm text-gray-300">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-sm text-sky-400 hover:text-sky-300 transition-colors duration-300">
              Forgot password?
            </Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-sky-500/25 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing In...
              </div>
            ) : (
              'Sign In to Beta Portal'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-8 flex items-center">
          <div className="flex-1 border-t border-white/20"></div>
          <span className="px-4 text-gray-400 text-sm">or</span>
          <div className="flex-1 border-t border-white/20"></div>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-gray-400 mb-4">
            Don't have an academy account?
          </p>
          <Link
            to="/signup"
            className="inline-block border-2 border-sky-400 text-sky-400 hover:bg-sky-400 hover:text-black px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
          >
            Join Beta Program
          </Link>
        </div>

        {/* Location Info */}
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

export default LoginPage;