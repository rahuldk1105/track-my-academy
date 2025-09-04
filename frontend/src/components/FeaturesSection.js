import React from 'react';

// Placeholder for icons. You can use an icon library like Heroicons or Feather Icons.
const FeatureIcon = () => (
  <svg className="w-8 h-8 text-accent mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);

const features = [
  {
    title: 'Effortless Player Management',
    description: 'Keep all player information, from contact details to performance history, in one organized and secure place.'
  },
  {
    title: 'Automated Attendance Tracking',
    description: 'Simplify your check-ins and monitor attendance records with just a few clicks, saving valuable time for your coaches.'
  },
  {
    title: 'In-Depth Performance Analytics',
    description: 'Make data-driven decisions with powerful analytics that track player progress and highlight areas for improvement.'
  },
  {
    title: 'Seamless Communication Hub',
    description: 'Connect with players, parents, and staff through integrated messaging and announcement features.'
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-secondary">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-text-primary">Why Choose Track My Academy?</h2>
          <p className="text-lg text-text-secondary mt-2">Everything you need to operate at a professional level.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-primary p-8 rounded-lg text-center">
              <div className="flex justify-center">
                <FeatureIcon />
              </div>
              <h3 className="text-xl font-bold font-heading text-text-primary mb-3">{feature.title}</h3>
              <p className="text-text-secondary">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
