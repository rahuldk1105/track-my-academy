import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DemoRequestModal from './DemoRequestModal';

const HeroSection = ({ scrollY }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const parallaxOffset = scrollY * 0.5;

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-900/20 to-transparent"></div>
        
        {/* Parallax Background Image */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1631490238089-dd6f432133be?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjB0ZWNobm9sb2d5fGVufDB8fHx8MTc1NDgxNzAyOHww&ixlib=rb-4.1.0&q=85')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `translateY(${parallaxOffset}px)`,
          }}
        ></div>

        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-20">
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
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className={`transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-sky-400 to-white bg-clip-text text-transparent animate-gradient-x">
              Empower Your
            </span>
            <br />
            <span className="text-white">Sports Academy with</span>
            <br />
            <span className="bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent">
              Track My Academy
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-300 mb-8 leading-relaxed">
            Transform your sports academy with our cutting-edge SaaS platform and smart equipment. 
            Track every player's performance, optimize training programs, and elevate your academy 
            to championship levels.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => setIsDemoModalOpen(true)}
              className="group bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 px-8 py-4 rounded-full text-white font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-sky-500/25 w-full sm:w-auto"
            >
              <span className="flex items-center justify-center">
                Request Demo
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
            
            <button className="group border-2 border-sky-400 text-sky-400 hover:bg-sky-400 hover:text-black px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 w-full sm:w-auto">
              <span className="flex items-center justify-center">
                Learn More
                <svg className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </span>
            </button>
          </div>
        </div>

        {/* Floating Stats */}
        <div className={`mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-1000 delay-500 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          {[
            { number: 'Beta', label: 'Launch Ready' },
            { number: '100%', label: 'Academy Focused' },
            { number: '24/7', label: 'Performance Tracking' }
          ].map((stat, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-sky-400/50 transition-all duration-300 transform hover:scale-105">
              <div className="text-3xl font-bold text-sky-400 mb-2">{stat.number}</div>
              <div className="text-gray-300">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Location Badge */}
        <div className={`mt-8 transition-all duration-1000 delay-700 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <div className="inline-flex items-center bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
            <svg className="w-5 h-5 text-sky-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-white font-medium">Chennai, Tamil Nadu, India</span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="animate-bounce">
            <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>

      {/* Demo Request Modal */}
      <DemoRequestModal 
        isOpen={isDemoModalOpen} 
        onClose={() => setIsDemoModalOpen(false)} 
      />
    </section>
  );
};

export default HeroSection;
