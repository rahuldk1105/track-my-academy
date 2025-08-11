import React, { useState } from 'react';
import DemoRequestModal from './DemoRequestModal';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const footerSections = [
    {
      title: 'Product',
      links: [
        { name: 'SaaS Platform', href: '#features' },
        { name: 'IoT Devices', href: '#' },
        { name: 'Smart Equipment', href: '#' },
        { name: 'Mobile App', href: '#' },
        { name: 'Beta Program', href: '#' }
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '#about' },
        { name: 'Team', href: '#' },
        { name: 'Careers', href: '#' },
        { name: 'Blog', href: '#' },
        { name: 'Contact', href: '#' }
      ]
    },
    {
      title: 'Support',
      links: [
        { name: 'Documentation', href: '#' },
        { name: 'Help Center', href: '#' },
        { name: 'Academy Portal', href: '#' },
        { name: 'Beta Support', href: '#' },
        { name: 'API Reference', href: '#' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '#' },
        { name: 'Terms of Service', href: '#' },
        { name: 'Data Security', href: '#' },
        { name: 'Compliance', href: '#' },
        { name: 'Beta Terms', href: '#' }
      ]
    }
  ];

  const socialLinks = [
    {
      name: 'Twitter',
      href: '#',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      )
    },
    {
      name: 'LinkedIn',
      href: '#',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      )
    },
    {
      name: 'Instagram',
      href: '#',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.624 5.367 11.99 11.988 11.99s11.99-5.366 11.99-11.99C24.007 5.367 18.641.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.326-1.297-.877-.808-1.297-1.30-1.297-2.346V8.45c0-1.016.42-1.538 1.297-2.346C6.001 5.296 7.152 4.807 8.449 4.807h7.102c1.297 0 2.448.489 3.326 1.297.877.808 1.297 1.33 1.297 2.346v4.895c0 1.016-.42 1.538-1.297 2.346-.878.807-2.029 1.297-3.326 1.297H8.449z"/>
        </svg>
      )
    },
    {
      name: 'YouTube',
      href: '#',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    }
  ];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-gradient-to-b from-black to-gray-900 border-t border-white/10 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="grid grid-cols-8 gap-4 h-full w-full">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-sky-400/20 to-transparent rounded-lg animate-pulse"
              style={{
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${4 + (i % 3)}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <img 
                  src="https://i.ibb.co/1tLZ0Dp1/TMA-LOGO-without-bg.png" 
                  alt="Track My Academy" 
                  className="h-12 w-auto mr-3"
                />
                <h3 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-white bg-clip-text text-transparent">
                  Track My Academy
                </h3>
              </div>
              <p className="text-gray-400 leading-relaxed mb-4">
                Empowering sports academies across India with cutting-edge SaaS solutions 
                and smart IoT technology. Currently in beta testing phase.
              </p>
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20 inline-flex">
                <svg className="w-4 h-4 text-sky-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-white text-sm font-medium">Chennai, Tamil Nadu</span>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="bg-white/10 hover:bg-sky-500 text-gray-400 hover:text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={section.title} className="lg:col-span-1">
              <h4 className="text-lg font-semibold text-white mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <button
                      onClick={() => link.href.startsWith('#') && scrollToSection(link.href.slice(1))}
                      className="text-gray-400 hover:text-sky-400 transition-colors duration-300 text-sm"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 mb-12">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Stay Updated on Beta Progress</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Get the latest updates on our beta program, new features, and early access 
              opportunities for sports academies across India.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your academy email"
                className="flex-1 bg-white/10 border border-white/20 rounded-full px-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-sky-400 transition-colors duration-300"
              />
              <button className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 px-8 py-3 rounded-full text-white font-semibold transition-all duration-300 transform hover:scale-105">
                Request Demo List
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © {currentYear} Track My Academy. All rights reserved. Made in Chennai, Tamil Nadu, India.
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-semibold">
                🚀 Beta Phase
              </span>
              <button className="hover:text-sky-400 transition-colors duration-300">
                Privacy Policy
              </button>
              <button className="hover:text-sky-400 transition-colors duration-300">
                Beta Terms
              </button>
            </div>
          </div>
        </div>

        {/* Back to Top Button */}
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-sky-500 hover:bg-sky-600 text-white p-3 rounded-full shadow-lg hover:shadow-sky-500/25 transition-all duration-300 transform hover:scale-110"
            aria-label="Back to top"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;