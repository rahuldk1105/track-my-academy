import React, { useEffect, useRef, useState } from 'react';

const AboutSection = ({ scrollY }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const stats = [
    { number: 'Beta', label: 'Launch Phase', icon: '🚀' },
    { number: '100%', label: 'Academy Focused', icon: '🏟️' },
    { number: 'Chennai', label: 'Tamil Nadu Base', icon: '📍' },
    { number: 'SaaS+IoT', label: 'Dual Technology', icon: '⚡' }
  ];

  return (
    <section id="about" ref={sectionRef} className="py-20 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      {/* Parallax Background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1709403552725-97e0ba206cb8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwxfHxhdGhsZXRlcyUyMGluJTIwYWN0aW9ufGVufDB8fHx8MTc1NDgxNzA4M3ww&ixlib=rb-4.1.0&q=85')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: `translateY(${scrollY * 0.3}px)`,
          backgroundAttachment: 'fixed'
        }}
      ></div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className={`text-center mb-16 transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-sky-400 to-white bg-clip-text text-transparent">
              About Track My Academy
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Born in Chennai, Tamil Nadu, we're pioneering the future of sports academy management 
            through innovative SaaS solutions and cutting-edge IoT technology.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Content */}
          <div className={`transition-all duration-1000 transform ${
            isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
          }`}>
            <h3 className="text-3xl font-bold text-white mb-6">
              Transforming Sports Academies Across India
            </h3>
            <div className="space-y-6 text-gray-300 leading-relaxed">
              <p>
                <strong className="text-sky-400">Track My Academy</strong> is a Chennai-based technology 
                startup dedicated to revolutionizing how sports academies operate and manage their athletes. 
                We understand the unique challenges faced by academy owners in India.
              </p>
              <p>
                Our comprehensive <strong className="text-sky-400">SaaS platform</strong> is currently in 
                beta testing, designed specifically for sports academy owners to streamline operations, 
                track player performance, and enhance training effectiveness.
              </p>
              <p>
                In addition to our software solutions, we're developing cutting-edge 
                <strong className="text-sky-400"> IoT gadgets and smart sports equipment</strong> that 
                will provide real-time performance analytics, helping academies make data-driven decisions 
                for player development.
              </p>
              <p>
                <strong className="text-sky-400">Academy-First Approach:</strong> Unlike platforms targeting individual athletes, 
                we focus exclusively on academy owners. Players access the platform through their academy's 
                portal, ensuring proper management hierarchy and data security.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-sky-400/30">
                <span className="text-sky-400 font-semibold">SaaS Platform</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-sky-400/30">
                <span className="text-sky-400 font-semibold">IoT Devices</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-sky-400/30">
                <span className="text-sky-400 font-semibold">Beta Testing</span>
              </div>
            </div>
          </div>

          {/* Logo and Company Info */}
          <div className={`transition-all duration-1000 transform ${
            isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
          }`}>
            <div className="relative">
              <div className="bg-gradient-to-br from-sky-400/20 to-transparent rounded-2xl p-8 backdrop-blur-sm border border-white/10">
                {/* Company Logo */}
                <div className="text-center mb-6">
                  <img
                    src="https://i.ibb.co/1tLZ0Dp1/TMA-LOGO-without-bg.png"
                    alt="Track My Academy Logo"
                    className="w-32 h-32 mx-auto mb-4"
                  />
                  <h3 className="text-2xl font-bold text-white mb-2">Track My Academy</h3>
                  <p className="text-sky-400 font-semibold">Chennai, Tamil Nadu</p>
                </div>
                
                {/* Company Stats */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-sky-400 font-bold text-lg">2025</div>
                    <div className="text-gray-300 text-sm">Launch Year</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-sky-400 font-bold text-lg">Beta</div>
                    <div className="text-gray-300 text-sm">Current Phase</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-sky-400 font-bold text-lg">India</div>
                    <div className="text-gray-300 text-sm">Primary Market</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-sky-400 font-bold text-lg">Academies</div>
                    <div className="text-gray-300 text-sm">Target Users</div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-sky-500 rounded-full w-16 h-16 flex items-center justify-center text-white font-bold animate-pulse">
                  Beta
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white/20 backdrop-blur-sm rounded-full w-20 h-20 flex items-center justify-center text-sky-400 font-bold border border-sky-400/30">
                  TMA
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`} style={{ transitionDelay: '600ms' }}>
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center group"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-sky-400/50 transition-all duration-500 transform hover:scale-105 hover:bg-white/10">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-sky-400 mb-2 group-hover:text-white transition-colors duration-300">
                  {stat.number}
                </div>
                <div className="text-gray-300 text-sm font-medium">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mission Statement */}
        <div className={`text-center mt-16 transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`} style={{ transitionDelay: '800ms' }}>
          <div className="bg-gradient-to-r from-sky-500/20 to-transparent rounded-2xl p-8 backdrop-blur-sm border border-sky-400/20">
            <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
            <p className="text-lg text-gray-300 max-w-4xl mx-auto leading-relaxed">
              "To empower sports academies across India with cutting-edge technology solutions that 
              streamline operations, enhance player development, and create a connected ecosystem 
              where academy owners and athletes can achieve their maximum potential together."
            </p>
            <div className="mt-6 inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
              <svg className="w-5 h-5 text-sky-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-white font-medium">Made in Chennai, Tamil Nadu</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;