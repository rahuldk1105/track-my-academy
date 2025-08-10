import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import AboutSection from './AboutSection';
import PricingSection from './PricingSection';
import TestimonialsSection from './TestimonialsSection';
import Footer from './Footer';

const LandingPage = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-black text-white overflow-x-hidden">
      <Navbar />
      <HeroSection scrollY={scrollY} />
      <FeaturesSection scrollY={scrollY} />
      <AboutSection scrollY={scrollY} />
      <PricingSection scrollY={scrollY} />
      <TestimonialsSection scrollY={scrollY} />
      <Footer />
    </div>
  );
};

export default LandingPage;