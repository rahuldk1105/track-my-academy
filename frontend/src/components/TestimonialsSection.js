import React, { useEffect, useRef, useState } from 'react';

const TestimonialsSection = ({ scrollY }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
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

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Olympic Tennis Player',
      image: 'https://images.unsplash.com/photo-1709403552725-97e0ba206cb8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwxfHxhdGhsZXRlcyUyMGluJTIwYWN0aW9ufGVufDB8fHx8MTc1NDgxNzA4M3ww&ixlib=rb-4.1.0&q=85',
      quote: "SportsTech revolutionized my training regimen. The AI-powered insights helped me identify weaknesses I never knew existed and improve my game significantly.",
      rating: 5,
      sport: 'Tennis'
    },
    {
      id: 2,
      name: 'Marcus Rodriguez',
      role: 'Professional Soccer Coach',
      image: 'https://images.unsplash.com/photo-1745103598675-85df75773d12?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwzfHxhdGhsZXRlcyUyMGluJTIwYWN0aW9ufGVufDB8fHx8MTc1NDgxNzA4M3ww&ixlib=rb-4.1.0&q=85',
      quote: "The team collaboration features are incredible. Being able to analyze player performance in real-time during matches has given us a competitive edge.",
      rating: 5,
      sport: 'Soccer'
    },
    {
      id: 3,
      name: 'Emily Chen',
      role: 'Swimming Academy Director',
      image: 'https://images.pexels.com/photos/159573/lacrosse-lax-lacrosse-game-game-159573.jpeg',
      quote: "Our academy has seen a 40% improvement in athlete performance since implementing SportsTech. The data-driven approach is phenomenal.",
      rating: 5,
      sport: 'Swimming'
    }
  ];

  const achievements = [
    { icon: '🏆', title: 'Olympic Gold Medals', count: '150+' },
    { icon: '⚡', title: 'Performance Boost', count: '45%' },
    { icon: '🎯', title: 'Injury Reduction', count: '60%' },
    { icon: '📊', title: 'Data Points Analyzed', count: '10M+' }
  ];

  return (
    <section id="testimonials" ref={sectionRef} className="py-20 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      {/* Parallax Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1532877590696-69a157b92b78?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwzfHxzcG9ydHMlMjB0ZWNobm9sb2d5fGVufDB8fHx8MTc1NDgxNzAyOHww&ixlib=rb-4.1.0&q=85')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: `translateY(${scrollY * 0.2}px)`,
        }}
      ></div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className={`text-center mb-16 transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-sky-400 to-white bg-clip-text text-transparent">
              Trusted by Champions
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover how elite athletes and organizations worldwide are achieving 
            unprecedented success with SportsTech.
          </p>
        </div>

        {/* Main Testimonial */}
        <div className={`mb-16 transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`} style={{ transitionDelay: '300ms' }}>
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/10 max-w-4xl mx-auto relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-sky-400/10 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Testimonial Content */}
                <div className="flex-1 text-center md:text-left">
                  {/* Quote */}
                  <div className="mb-6">
                    <svg className="w-12 h-12 text-sky-400 mx-auto md:mx-0 mb-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                    </svg>
                    <p className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-6">
                      "{testimonials[currentTestimonial].quote}"
                    </p>
                  </div>

                  {/* Rating */}
                  <div className="flex justify-center md:justify-start mb-4">
                    {Array.from({ length: testimonials[currentTestimonial].rating }).map((_, i) => (
                      <svg key={i} className="w-6 h-6 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>

                  {/* Author Info */}
                  <div>
                    <h4 className="text-xl font-bold text-white mb-1">
                      {testimonials[currentTestimonial].name}
                    </h4>
                    <p className="text-sky-400 font-semibold">
                      {testimonials[currentTestimonial].role}
                    </p>
                    <span className="inline-block bg-sky-500/20 text-sky-400 px-3 py-1 rounded-full text-sm font-medium mt-2">
                      {testimonials[currentTestimonial].sport}
                    </span>
                  </div>
                </div>

                {/* Profile Image */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-sky-400/30">
                      <img
                        src={testimonials[currentTestimonial].image}
                        alt={testimonials[currentTestimonial].name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-sky-500 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold">
                      #{currentTestimonial + 1}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial Navigation */}
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial
                      ? 'bg-sky-400 scale-125'
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`} style={{ transitionDelay: '600ms' }}>
          {achievements.map((achievement, index) => (
            <div
              key={index}
              className="text-center group"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-sky-400/50 transition-all duration-500 transform hover:scale-105 hover:bg-white/10">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {achievement.icon}
                </div>
                <div className="text-3xl font-bold text-sky-400 mb-2 group-hover:text-white transition-colors duration-300">
                  {achievement.count}
                </div>
                <div className="text-gray-300 text-sm font-medium">
                  {achievement.title}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className={`text-center mt-16 transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`} style={{ transitionDelay: '800ms' }}>
          <div className="bg-gradient-to-r from-sky-500/20 to-transparent rounded-2xl p-8 backdrop-blur-sm border border-sky-400/20 max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-4">Join the Champions</h3>
            <p className="text-lg text-gray-300 mb-6 leading-relaxed">
              Ready to unlock your full potential? Join thousands of athletes who have 
              transformed their performance with SportsTech.
            </p>
            <button className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 px-8 py-4 rounded-full text-white font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-sky-500/25">
              Start Your Free Trial
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;