import React from 'react';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import AboutSection from './AboutSection';
import PricingSection from './PricingSection';
import TestimonialsSection from './TestimonialsSection';
import Footer from './Footer';

const LandingPage = () => {
  return (
    <div className="bg-primary font-sans overflow-x-hidden">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <AboutSection />
        <PricingSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
