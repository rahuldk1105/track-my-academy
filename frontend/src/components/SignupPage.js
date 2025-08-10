import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    academyName: '',
    ownerName: '',
    email: '',
    phone: '',
    location: '',
    sportsType: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

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
    
    // TODO: Implement actual signup logic
    console.log('Signup attempt:', formData);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      alert('Beta signup functionality will be implemented in backend integration phase. Thank you for your interest!');
    }, 1000);
  };

  const nextStep = () => {
    if (currentStep < 2) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center relative overflow-hidden py-8">
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

      {/* Signup Form */}
      <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/10 w-full max-w-2xl mx-4 relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <img 
            src="https://i.ibb.co/1tLZ0Dp1/TMA-LOGO-without-bg.png" 
            alt="Track My Academy" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-white bg-clip-text text-transparent mb-2">
            Join Beta Program
          </h1>
          <p className="text-gray-400">
            Register your sports academy for exclusive beta access
          </p>
        </div>

        {/* Beta Badge */}
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-full px-4 py-2 border border-orange-400/50">
            <span className="text-white text-sm font-semibold">🚀 Exclusive Beta Registration</span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center ${currentStep >= 1 ? 'text-sky-400' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              currentStep >= 1 ? 'border-sky-400 bg-sky-400 text-white' : 'border-gray-500'
            }`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">Academy Info</span>
          </div>
          <div className={`mx-4 w-12 h-0.5 ${currentStep > 1 ? 'bg-sky-400' : 'bg-gray-500'}`}></div>
          <div className={`flex items-center ${currentStep >= 2 ? 'text-sky-400' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              currentStep >= 2 ? 'border-sky-400 bg-sky-400 text-white' : 'border-gray-500'
            }`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Account Setup</span>
          </div>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep === 1 && (
            <>
              {/* Academy Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="academyName" className="block text-sm font-medium text-gray-300 mb-2">
                    Academy Name *
                  </label>
                  <input
                    type="text"
                    id="academyName"
                    name="academyName"
                    value={formData.academyName}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all duration-300"
                    placeholder="Chennai Cricket Academy"
                  />
                </div>

                <div>
                  <label htmlFor="ownerName" className="block text-sm font-medium text-gray-300 mb-2">
                    Owner/Director Name *
                  </label>
                  <input
                    type="text"
                    id="ownerName"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all duration-300"
                    placeholder="Your Full Name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Academy Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all duration-300"
                    placeholder="info@youracademy.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all duration-300"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                    Academy Location *
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all duration-300"
                    placeholder="Chennai, Tamil Nadu"
                  />
                </div>

                <div>
                  <label htmlFor="sportsType" className="block text-sm font-medium text-gray-300 mb-2">
                    Primary Sport *
                  </label>
                  <select
                    id="sportsType"
                    name="sportsType"
                    value={formData.sportsType}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all duration-300"
                  >
                    <option value="">Select Primary Sport</option>
                    <option value="cricket">Cricket</option>
                    <option value="football">Football</option>
                    <option value="tennis">Tennis</option>
                    <option value="badminton">Badminton</option>
                    <option value="basketball">Basketball</option>
                    <option value="swimming">Swimming</option>
                    <option value="athletics">Athletics</option>
                    <option value="hockey">Hockey</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-sky-500/25"
              >
                Continue to Account Setup
              </button>
            </>
          )}

          {currentStep === 2 && (
            <>
              {/* Account Setup */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all duration-300"
                    placeholder="Create a strong password"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all duration-300"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>

              {/* Terms and Beta Agreement */}
              <div className="space-y-4">
                <label className="flex items-start">
                  <input type="checkbox" required className="mt-1 rounded border-gray-300 text-sky-400 focus:ring-sky-400" />
                  <span className="ml-3 text-sm text-gray-300">
                    I agree to the <Link to="/terms" className="text-sky-400 hover:text-sky-300">Terms of Service</Link> and{' '}
                    <Link to="/privacy" className="text-sky-400 hover:text-sky-300">Privacy Policy</Link>
                  </span>
                </label>

                <label className="flex items-start">
                  <input type="checkbox" required className="mt-1 rounded border-gray-300 text-sky-400 focus:ring-sky-400" />
                  <span className="ml-3 text-sm text-gray-300">
                    I understand this is a beta program and agree to provide feedback to help improve the platform
                  </span>
                </label>

                <label className="flex items-start">
                  <input type="checkbox" className="mt-1 rounded border-gray-300 text-sky-400 focus:ring-sky-400" />
                  <span className="ml-3 text-sm text-gray-300">
                    I would like to receive updates about new features and beta program developments
                  </span>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 border-2 border-sky-400 text-sky-400 hover:bg-sky-400 hover:text-black font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  Back
                </button>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`flex-1 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-sky-500/25 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Joining Beta...
                    </div>
                  ) : (
                    'Join Beta Program'
                  )}
                </button>
              </div>
            </>
          )}
        </form>

        {/* Already have account */}
        <div className="mt-8 text-center">
          <div className="flex items-center mb-4">
            <div className="flex-1 border-t border-white/20"></div>
            <span className="px-4 text-gray-400 text-sm">or</span>
            <div className="flex-1 border-t border-white/20"></div>
          </div>
          
          <p className="text-gray-400 mb-4">
            Already have a beta account?
          </p>
          <Link
            to="/login"
            className="inline-block text-sky-400 hover:text-sky-300 font-semibold transition-colors duration-300"
          >
            Sign In Here
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

export default SignupPage;