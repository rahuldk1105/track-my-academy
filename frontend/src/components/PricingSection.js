import React from 'react';

const CheckIcon = () => (
  <svg className="w-5 h-5 text-accent mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
);

const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 bg-secondary">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-text-primary">Find the Perfect Plan</h2>
          <p className="text-lg text-text-secondary mt-2">Simple, transparent pricing that scales with you.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-primary p-8 rounded-lg border-2 border-transparent">
            <h3 className="text-2xl font-bold font-heading text-text-primary mb-2">Starter</h3>
            <p className="text-text-secondary mb-6">For new and growing academies.</p>
            <p className="text-4xl font-black font-heading mb-6">₹4999 <span className="text-lg font-normal text-text-secondary">/mo</span></p>
            <ul className="space-y-4 text-text-secondary mb-8">
              <li className="flex items-center"><CheckIcon /> Up to 50 Players</li>
              <li className="flex items-center"><CheckIcon /> Basic Attendance Tracking</li>
              <li className="flex items-center"><CheckIcon /> Communication Hub</li>
              <li className="flex items-center"><CheckIcon /> Standard Support</li>
            </ul>
            <a href="#" className="w-full block text-center border-2 border-accent text-accent font-bold py-3 px-8 rounded-lg hover:bg-accent hover:text-primary transition-colors">
              Choose Plan
            </a>
          </div>

          {/* Pro Plan */}
          <div className="bg-primary p-8 rounded-lg border-2 border-accent relative">
            <span className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-accent text-primary text-sm font-bold px-4 py-1 rounded-full">
              MOST POPULAR
            </span>
            <h3 className="text-2xl font-bold font-heading text-text-primary mb-2">Pro</h3>
            <p className="text-text-secondary mb-6">For established academies.</p>
            <p className="text-4xl font-black font-heading mb-6">₹9999 <span className="text-lg font-normal text-text-secondary">/mo</span></p>
            <ul className="space-y-4 text-text-secondary mb-8">
              <li className="flex items-center"><CheckIcon /> Up to 200 Players</li>
              <li className="flex items-center"><CheckIcon /> Advanced Attendance Tracking</li>
              <li className="flex items-center"><CheckIcon /> Performance Analytics</li>
              <li className="flex items-center"><CheckIcon /> Priority Support</li>
            </ul>
            <a href="#" className="w-full block text-center bg-accent text-primary font-bold py-3 px-8 rounded-lg hover:opacity-90 transition-opacity">
              Choose Plan
            </a>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-primary p-8 rounded-lg border-2 border-transparent">
            <h3 className="text-2xl font-bold font-heading text-text-primary mb-2">Enterprise</h3>
            <p className="text-text-secondary mb-6">For large-scale organizations.</p>
            <p className="text-4xl font-black font-heading mb-6">Contact Us</p>
            <ul className="space-y-4 text-text-secondary mb-8">
              <li className="flex items-center"><CheckIcon /> Unlimited Players</li>
              <li className="flex items-center"><CheckIcon /> Custom Features</li>
              <li className="flex items-center"><CheckIcon /> Dedicated Account Manager</li>
              <li className="flex items-center"><CheckIcon /> White-labeling Options</li>
            </ul>
            <a href="#" className="w-full block text-center border-2 border-accent text-accent font-bold py-3 px-8 rounded-lg hover:bg-accent hover:text-primary transition-colors">
              Contact Sales
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
