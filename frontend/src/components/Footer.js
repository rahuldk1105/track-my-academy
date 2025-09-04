import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-secondary border-t border-gray-700">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-bold font-heading text-text-primary">Track My Academy</h3>
            <p className="text-text-secondary mt-2">The future of academy management.</p>
            {/* Optional: Add social media icons here */}
          </div>
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold text-text-primary">Product</h4>
              <ul className="mt-4 space-y-2">
                <li><a href="#features" className="text-text-secondary hover:text-accent">Features</a></li>
                <li><a href="#pricing" className="text-text-secondary hover:text-accent">Pricing</a></li>
                <li><a href="#" className="text-text-secondary hover:text-accent">Request Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-text-primary">Company</h4>
              <ul className="mt-4 space-y-2">
                <li><a href="#about" className="text-text-secondary hover:text-accent">About Us</a></li>
                <li><a href="#" className="text-text-secondary hover:text-accent">Contact</a></li>
                {/* A subtle link for investors */}
                <li><a href="/investors" className="text-text-secondary hover:text-accent">Investors</a></li>
              </ul>
            </div>
             <div>
              <h4 className="font-bold text-text-primary">Legal</h4>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-text-secondary hover:text-accent">Privacy Policy</a></li>
                <li><a href="#" className="text-text-secondary hover:text-accent">Terms of Service</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-700 pt-6 text-center text-text-secondary">
          <p>&copy; {new Date().getFullYear()} CP Infotech. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
