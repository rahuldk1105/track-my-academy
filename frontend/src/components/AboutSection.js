import React from 'react';

const AboutSection = () => {
  return (
    <section id="about" className="py-20">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
             {/* Image suggestion: A professional photo of a team using a tablet, or an abstract brand graphic */}
            <div className="bg-secondary w-full h-80 rounded-lg"></div>
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-text-primary mb-4">
              Built for Academies, by Sports Enthusiasts
            </h2>
            <p className="text-text-secondary text-lg mb-4">
              We understand the challenges of running a sports academy. Our mission is to provide powerful, intuitive tools that empower coaches and administrators to build the next generation of athletes.
            </p>
            <p className="text-text-secondary text-lg">
              Track My Academy is more than just software; it's a partner in your success, designed to be scalable, secure, and incredibly easy to use.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
