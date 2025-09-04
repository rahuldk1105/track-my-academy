import React from 'react';

const Navbar = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary/80 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold font-heading text-text-primary">Track My Academy</h1>
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-text-secondary hover:text-accent transition-colors">Features</a>
          <a href="#about" className="text-text-secondary hover:text-accent transition-colors">About</a>
          <a href="#pricing" className="text-text-secondary hover:text-accent transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center space-x-4">
          <a href="/login" className="text-text-secondary hover:text-accent transition-colors">Login</a>
          <a href="/signup" className="bg-accent text-primary font-bold py-2 px-5 rounded-lg hover:opacity-90 transition-opacity">
            Sign Up
          </a>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
