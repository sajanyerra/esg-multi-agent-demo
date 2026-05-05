import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const links = [
  { to: '/', label: 'Report' },
  { to: '/dashboard', label: 'Dashboard' },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="border-b border-gray-700 bg-gray-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Left — Brand */}
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 text-xl">🌱</span>
          <span className="font-semibold text-white tracking-tight">ESG Intelligence</span>
          <span className="text-xs text-gray-400 border border-gray-600 px-2 py-0.5 rounded-full">
            Demo
          </span>
        </div>

        {/* Center — Nav Links */}
        <div className="flex items-center gap-1">
          {links.map(({ to, label }) => (
            <Link key={to} to={to}>
              <motion.div
                whileHover={{ scale: 1.03 }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === to
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-gray-200 hover:text-white hover:bg-gray-700'
                }`}
              >
                {label}
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Right — External Links */}
        <div className="flex items-center gap-3 text-sm">
          <a
            href="https://github.com/sajanyerra"
            target="_blank"
            rel="noreferrer"
            className="text-gray-200 hover:text-white font-medium transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/sajanyerra/"
            target="_blank"
            rel="noreferrer"
            className="text-gray-200 hover:text-white font-medium transition-colors"
          >
            LinkedIn
          </a>
          <a
            href="https://esg-multi-agent-demo.onrender.com"
            target="_blank"
            rel="noreferrer"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-1.5 rounded-lg transition-colors text-sm"
          >
            🖥️ PI Server
          </a>
        </div>

      </div>
    </nav>
  )
}