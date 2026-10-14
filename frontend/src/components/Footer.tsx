import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Mail, Phone, MapPin, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <span className="font-extrabold text-white text-xl tracking-tight">Smart Campus</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              A modern, intelligent lost and found network connecting university campuses. Fast reporting, private verification, and automated similarity matching.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-lg w-fit">
              <ShieldCheck className="w-4 h-4" /> Secure Ownership Verification
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home Page</Link>
              </li>
              <li>
                <Link to="/browse" className="hover:text-white transition-colors">Browse All Listings</Link>
              </li>
              <li>
                <Link to="/report/lost" className="hover:text-white transition-colors">Report Lost Belonging</Link>
              </li>
              <li>
                <Link to="/report/found" className="hover:text-white transition-colors">Report Found Belonging</Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">How It Works Guide</Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Key Categories</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/browse?category=Electronics" className="hover:text-white transition-colors">Electronics &amp; Laptops</Link>
              </li>
              <li>
                <Link to="/browse?category=ID%20Cards" className="hover:text-white transition-colors">Student ID Cards</Link>
              </li>
              <li>
                <Link to="/browse?category=Wallets" className="hover:text-white transition-colors">Wallets &amp; Cards</Link>
              </li>
              <li>
                <Link to="/browse?category=Bags" className="hover:text-white transition-colors">Backpacks &amp; Pouches</Link>
              </li>
              <li>
                <Link to="/browse?category=Keys" className="hover:text-white transition-colors">Keys &amp; FOBs</Link>
              </li>
            </ul>
          </div>

          {/* Campus Safety Desk */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Campus Security Desk</h4>
            <div className="space-y-3 text-sm text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Central Campus Safety Center, Ground Floor Admin Wing</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>+1 (800) CAMPUS-HELP / Ext. 402</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>lostandfound@campus.edu</span>
              </div>
              <p className="text-xs text-slate-500 pt-1">
                Mon - Fri: 8:00 AM – 7:00 PM<br />Sat - Sun: 9:00 AM – 3:00 PM
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Smart Campus Lost &amp; Found. Built for University Campus Communities.</p>
          <div className="flex items-center gap-4">
            <span>B.Tech CSE Capstone Project</span>
            <span>•</span>
            <span>Privacy Compliant</span>
            <span>•</span>
            <span>Zero Data Selling</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
