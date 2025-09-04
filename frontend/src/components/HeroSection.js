import React from 'react';

const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center pt-24">
      {/* Background suggestion: A subtle, high-quality image of a sports field or an abstract tech pattern */}
      <div className="container mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-4 leading-tight">
          The All-in-One Platform for Your Sports Academy
        </h1>
        <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto mb-8">
          Streamline operations, track player performance, and enhance communication. Focus on coaching, we'll handle the rest.
        </p>
        <div className="flex justify-center space-x-4">
          <a href="#pricing" className="bg-accent text-primary font-bold py-3 px-8 rounded-lg hover:opacity-90 transition-opacity text-lg">
            Get Started
          </a>
          <a href="#" className="border-2 border-text-secondary text-text-secondary font-bold py-3 px-8 rounded-lg hover:bg-text-secondary hover:text-primary transition-colors text-lg">
            Request a Demo
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
