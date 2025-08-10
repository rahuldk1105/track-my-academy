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
    { number: '50K+', label: 'Professional Athletes', icon: '🏆' },
    { number: '200+', label: 'Sports Organizations', icon: '🏟️' },
    { number: '15+', label: 'Countries Worldwide', icon: '🌍' },
    { number: '98%', label: 'Customer Satisfaction', icon: '⭐' }
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
              About SportsTech
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            We're pioneers in sports technology, dedicated to pushing the boundaries of athletic 
            performance through innovative solutions and cutting-edge research.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Content */}
          <div className={`transition-all duration-1000 transform ${
            isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
          }`}>
            <h3 className="text-3xl font-bold text-white mb-6">
              Transforming Sports Through Innovation
            </h3>
            <div className="space-y-6 text-gray-300 leading-relaxed">
              <p>
                Founded by a team of former athletes, engineers, and data scientists, SportsTech 
                was born from the vision of merging cutting-edge technology with athletic excellence. 
                We understand the dedication it takes to reach peak performance.
              </p>
              <p>
                Our revolutionary platform combines artificial intelligence, IoT sensors, and 
                advanced analytics to provide athletes and coaches with unprecedented insights 
                into performance optimization, injury prevention, and strategic planning.
              </p>
              <p>
                From grassroots programs to professional leagues, we're democratizing access to 
                elite-level sports technology, making peak performance achievable for athletes 
                at every level.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-sky-400/30">
                <span className="text-sky-400 font-semibold">AI-Powered</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-sky-400/30">
                <span className="text-sky-400 font-semibold">Real-time Data</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-sky-400/30">
                <span className="text-sky-400 font-semibold">Global Reach</span>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className={`transition-all duration-1000 transform ${
            isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
          }`}>
            <div className="relative">
              <div className="bg-gradient-to-br from-sky-400/20 to-transparent rounded-2xl p-8 backdrop-blur-sm border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1745103598675-85df75773d12?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwzfHxhdGhsZXRlcyUyMGluJTIwYWN0aW9ufGVufDB8fHx8MTc1NDgxNzA4M3ww&ixlib=rb-4.1.0&q=85"
                  alt="Athletes in action"
                  className="w-full h-80 object-cover rounded-xl"
                />
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-sky-500 rounded-full w-16 h-16 flex items-center justify-center text-white font-bold animate-pulse">
                  AI
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white/20 backdrop-blur-sm rounded-full w-20 h-20 flex items-center justify-center text-sky-400 font-bold border border-sky-400/30">
                  24/7
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
              "To empower every athlete with the technology and insights needed to unlock their full potential, 
              while fostering a global community where sports excellence meets technological innovation."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;