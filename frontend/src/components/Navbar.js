import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const handleJoinBeta = () => {
    navigate('/signup');
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
      isScrolled ? 'bg-black/90 backdrop-blur-md border-b border-white/10' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <img 
              src="https://i.ibb.co/1tLZ0Dp1/TMA-LOGO-without-bg.png" 
              alt="Track My Academy" 
              className="h-10 w-auto mr-3"
            />
            <h1 className="text-xl font-bold bg-gradient-to-r from-sky-400 to-white bg-clip-text text-transparent">
              Track My Academy
            </h1>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <button onClick={() => scrollToSection('hero')} className="text-white hover:text-sky-400 transition-colors duration-300">Home</button>
              <button onClick={() => scrollToSection('features')} className="text-white hover:text-sky-400 transition-colors duration-300">Features</button>
              <button onClick={() => scrollToSection('about')} className="text-white hover:text-sky-400 transition-colors duration-300">About</button>
              <button onClick={() => scrollToSection('pricing')} className="text-white hover:text-sky-400 transition-colors duration-300">Pricing</button>
              <button onClick={() => scrollToSection('testimonials')} className="text-white hover:text-sky-400 transition-colors duration-300">Testimonials</button>
            </div>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <button 
              onClick={handleJoinBeta}
              className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 px-6 py-2 rounded-full text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-sky-500/25"
            >
              Request Demo
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-sky-400 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-white/10">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button onClick={() => scrollToSection('hero')} className="block text-white hover:text-sky-400 px-3 py-2 text-base font-medium w-full text-left">Home</button>
              <button onClick={() => scrollToSection('features')} className="block text-white hover:text-sky-400 px-3 py-2 text-base font-medium w-full text-left">Features</button>
              <button onClick={() => scrollToSection('about')} className="block text-white hover:text-sky-400 px-3 py-2 text-base font-medium w-full text-left">About</button>
              <button onClick={() => scrollToSection('pricing')} className="block text-white hover:text-sky-400 px-3 py-2 text-base font-medium w-full text-left">Pricing</button>
              <button onClick={() => scrollToSection('testimonials')} className="block text-white hover:text-sky-400 px-3 py-2 text-base font-medium w-full text-left">Testimonials</button>
              <button 
                onClick={handleJoinBeta}
                className="w-full mt-4 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 px-6 py-2 rounded-full text-white font-semibold transition-all duration-300"
              >
                Request Demo
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;