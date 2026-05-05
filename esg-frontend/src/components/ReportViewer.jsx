import { motion } from 'framer-motion'
import { useState } from 'react'

export default function ReportViewer({ report, messages, elapsed }) {
  const [showLog, setShowLog] = useState(false)

  const download = () => {
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'esg_report.md'
    a.click()
  }

  // Parse markdown-ish text into sections
  const sections = report.split(/\n(?=##)/).filter(Boolean)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Compliance Report</h2>
          <p className="text-sm text-gray-400">Generated in {elapsed?.toFixed(1)}s</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLog(!showLog)}
            className="text-sm px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
          >
            {showLog ? 'Hide' : 'View'} Agent Log
          </button>
          <button
            onClick={download}
            className="text-sm px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            ⬇ Download
          </button>
        </div>
      </div>

      {/* Report sections */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        {sections.map((section, i) => {
          const lines = section.trim().split('\n')
          const heading = lines[0].replace(/^#+\s*/, '')
          const body = lines.slice(1).join('\n').trim()
          const isCompliant = body.includes('COMPLIANT') && !body.includes('NON-COMPLIANT')
          const isNonCompliant = body.includes('NON-COMPLIANT')

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <h3 className="text-emerald-400 font-semibold text-sm uppercase tracking-wider mb-2">
                {heading}
              </h3>
              <div
                className={`text-gray-300 text-sm leading-relaxed whitespace-pre-wrap rounded-lg p-3 ${
                  isNonCompliant
                    ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                    : isCompliant
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                    : 'bg-gray-800/50'
                }`}
              >
                {body}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Agent log */}
      {showLog && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3 max-h-96 overflow-y-auto"
        >
          <h3 className="text-sm font-medium text-gray-400">Agent Conversation Log</h3>
          {messages?.map((msg, i) => (
            <div key={i} className="text-xs border-b border-gray-800 pb-2">
              <span className={`font-mono font-bold ${
                msg.role === 'AI' ? 'text-blue-400' :
                msg.role === 'Tool' ? 'text-yellow-400' :
                'text-gray-400'
              }`}>
                {msg.role === 'AI' ? '🤖' : msg.role === 'Tool' ? '🔧' : '👤'} {msg.role}
              </span>
              <p className="text-gray-400 mt-1 leading-relaxed">
                {msg.content.slice(0, 400)}{msg.content.length > 400 ? '...' : ''}
              </p>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}