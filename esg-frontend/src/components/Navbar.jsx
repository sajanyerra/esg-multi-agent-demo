import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, BarChart3, Activity, ExternalLink } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-emerald rounded-lg opacity-0 group-hover:opacity-100 blur-lg transition-all duration-300" />
              {/* Icon container */}
              <div className="relative bg-emerald-600 rounded-lg p-2 shadow-lg group-hover:shadow-glow-emerald transition-all duration-300">
                <BarChart3 size={24} className="text-slate-950 font-bold" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors duration-200">
                ESG Intelligence
              </span>
              <span className="text-xs text-slate-400 -mt-1">Carbon Analytics</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                isActive('/')
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/50'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-emerald-400'
              }`}
            >
              <BarChart3 size={18} />
              Report
            </Link>

            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                isActive('/dashboard')
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/50'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-emerald-400'
              }`}
            >
              <Activity size={18} />
              Dashboard
            </Link>
          </div>

          {/* PI Server Link */}
          <a
            href="https://esg-multi-agent-demo.onrender.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-slate-800/50 transition-all duration-200"
            title="View PI Server Dashboard"
          >
            <span className="hidden sm:inline text-sm">PI Server</span>
            <ExternalLink size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        {/* Mobile Navigation (visible only on small screens) */}
        <div className="md:hidden flex gap-2 pb-2">
          <Link
            to="/"
            className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-1 ${
              isActive('/')
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/50'
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-emerald-400'
            }`}
          >
            <BarChart3 size={16} />
            Report
          </Link>

          <Link
            to="/dashboard"
            className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-1 ${
              isActive('/dashboard')
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/50'
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-emerald-400'
            }`}
          >
            <Activity size={16} />
            Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}