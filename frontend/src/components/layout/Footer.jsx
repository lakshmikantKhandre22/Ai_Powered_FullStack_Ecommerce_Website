import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Facebook, Twitter, Instagram, ArrowUp } from 'lucide-react';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-darkSlate-900 text-slate-300 mt-20 pt-16 pb-8 border-t border-darkSlate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand Information */}
        <div className="flex flex-col space-y-4">
          <Link to="/" className="flex items-center space-x-2 text-white group">
            <div className="bg-primary p-2 rounded-xl group-hover:scale-105 transition-transform duration-200">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <span className="font-display font-extrabold text-2xl tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              ShopSphere
            </span>
          </Link>
          <p className="text-slate-400 text-sm leading-relaxed">
            Your premium destination for discovering elite electronics, curated apparel, rustic home designs, and organic personal care. Explore standard catalog filters and enjoy secure checkout.
          </p>
          <div className="flex items-center space-x-4 pt-2">
            <a href="#" className="hover:text-primary transition-colors duration-200">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="hover:text-primary transition-colors duration-200">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="hover:text-primary transition-colors duration-200">
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Quick Shopping Categories */}
        <div>
          <h4 className="text-white font-display font-semibold text-lg mb-4">Shop Departments</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/catalog?category=electronics" className="hover:text-primary transition-colors">
                Electronics Catalog
              </Link>
            </li>
            <li>
              <Link to="/catalog?category=fashion" className="hover:text-primary transition-colors">
                Fashion Wearables
              </Link>
            </li>
            <li>
              <Link to="/catalog?category=home-kitchen" className="hover:text-primary transition-colors">
                Home Decor & Utility
              </Link>
            </li>
            <li>
              <Link to="/catalog?category=beauty-wellness" className="hover:text-primary transition-colors">
                Wellness & Skincare
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Service and Info */}
        <div>
          <h4 className="text-white font-display font-semibold text-lg mb-4">Customer Support</h4>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li>
              <Link to="/profile" className="hover:text-primary transition-colors">
                My Profile Dashboard
              </Link>
            </li>
            <li>
              <Link to="/orders" className="hover:text-primary transition-colors">
                Track My Shipments
              </Link>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Shipping Policies
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Secure Returns Help
              </a>
            </li>
          </ul>
        </div>

        {/* Newsletter Subscription */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-white font-display font-semibold text-lg">Stay in the Loop</h4>
          <p className="text-slate-400 text-sm leading-relaxed">
            Subscribe to our weekly circular for early access to discounts, new category seeding notifications, and premium curation.
          </p>
          <div className="flex space-x-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="bg-darkSlate-800 border border-darkSlate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary flex-1 transition-all"
            />
            <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
              Join
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-darkSlate-800 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between text-slate-500 text-xs">
        <p>© 2026 ShopSphere E-Commerce. Crafted by DeepMind pair programming.</p>
        <button
          onClick={scrollToTop}
          className="flex items-center space-x-1.5 hover:text-white bg-darkSlate-800 hover:bg-darkSlate-700 px-3 py-1.5 rounded-lg border border-darkSlate-700 transition-all mt-4 md:mt-0"
        >
          <span>Back to top</span>
          <ArrowUp className="h-3 w-3" />
        </button>
      </div>
    </footer>
  );
};

export default Footer;
