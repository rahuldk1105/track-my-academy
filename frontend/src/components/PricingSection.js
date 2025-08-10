import React, { useEffect, useRef, useState } from 'react';

const PricingSection = ({ scrollY }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('pro');
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

  const pricingPlans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$29',
      period: 'per month',
      description: 'Perfect for individual athletes and small teams',
      features: [
        'Basic performance analytics',
        'Up to 5 athlete profiles',
        'Mobile app access',
        'Standard reporting',
        'Email support',
        '1GB data storage'
      ],
      buttonText: 'Start Free Trial',
      popular: false,
      color: 'from-gray-600 to-gray-700'
    },
    {
      id: 'pro',
      name: 'Professional',
      price: '$99',
      period: 'per month',
      description: 'Advanced features for serious athletes and coaches',
      features: [
        'Advanced AI analytics',
        'Unlimited athlete profiles',
        'Real-time performance tracking',
        'Custom reports & insights',
        'Priority support',
        '50GB data storage',
        'Team collaboration tools',
        'Video analysis integration'
      ],
      buttonText: 'Get Started',
      popular: true,
      color: 'from-sky-500 to-sky-600'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$299',
      period: 'per month',
      description: 'Complete solution for organizations and academies',
      features: [
        'Full platform access',
        'Unlimited everything',
        'Custom integrations',
        'Dedicated account manager',
        '24/7 phone support',
        'Unlimited data storage',
        'Multi-location support',
        'Advanced security features',
        'Custom branding',
        'API access'
      ],
      buttonText: 'Contact Sales',
      popular: false,
      color: 'from-purple-600 to-purple-700'
    }
  ];

  return (
    <section id="pricing" ref={sectionRef} className="py-20 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-600/20 to-transparent"></div>
        <div className="grid grid-cols-6 gap-4 h-full w-full opacity-30">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-sky-400/10 to-transparent rounded-lg animate-pulse"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${3 + (i % 2)}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className={`text-center mb-16 transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-sky-400 to-white bg-clip-text text-transparent">
              Choose Your Plan
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Unlock your athletic potential with our flexible pricing options. 
            From individual athletes to enterprise organizations, we have the perfect plan for you.
          </p>
        </div>

        {/* Pricing Toggle */}
        <div className={`flex justify-center mb-12 transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`} style={{ transitionDelay: '200ms' }}>
          <div className="bg-white/10 backdrop-blur-sm rounded-full p-1 border border-white/20">
            <div className="flex">
              <button className="px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 bg-sky-500 text-white">
                Monthly
              </button>
              <button className="px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 text-gray-400 hover:text-white">
                Annual <span className="text-green-400 text-xs">(Save 20%)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative transition-all duration-1000 transform ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              } ${plan.popular ? 'lg:scale-105' : ''}`}
              style={{ transitionDelay: `${index * 200 + 400}ms` }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                  <span className="bg-gradient-to-r from-sky-500 to-sky-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className={`h-full bg-white/5 backdrop-blur-sm rounded-2xl p-8 border transition-all duration-500 hover:scale-105 relative overflow-hidden ${
                plan.popular 
                  ? 'border-sky-400/50 shadow-2xl shadow-sky-500/20' 
                  : 'border-white/10 hover:border-sky-400/30'
              }`}>
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${plan.color} opacity-10 rounded-2xl`}></div>
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-5xl font-bold text-sky-400">{plan.price}</span>
                      <span className="text-gray-400 ml-2">{plan.period}</span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="mb-8">
                    <ul className="space-y-4">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <svg className="w-5 h-5 text-sky-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <button className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-lg hover:shadow-sky-500/25'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-sky-400/50'
                  }`}>
                    {plan.buttonText}
                  </button>

                  {/* Extra Info */}
                  <p className="text-center text-xs text-gray-500 mt-4">
                    No setup fees • Cancel anytime
                  </p>
                </div>

                {/* Animated Border for Popular Plan */}
                {plan.popular && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-400/0 via-sky-400/50 to-sky-400/0 opacity-50 animate-pulse"></div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Info */}
        <div className={`text-center mt-16 transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`} style={{ transitionDelay: '1000ms' }}>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">Need a Custom Solution?</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              We understand that every organization has unique needs. Our team can create a 
              tailored solution that fits your specific requirements and budget.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 px-8 py-3 rounded-full text-white font-semibold transition-all duration-300 transform hover:scale-105">
                Schedule a Demo
              </button>
              <button className="border-2 border-sky-400 text-sky-400 hover:bg-sky-400 hover:text-black px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;