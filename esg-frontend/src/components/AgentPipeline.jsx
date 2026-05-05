import { motion } from 'framer-motion'

const agents = [
  { id: 1, icon: '🔍', name: 'Data Agent', desc: 'Fetching sensor readings' },
  { id: 2, icon: '🌱', name: 'ESG Agent', desc: 'Calculating emissions' },
  { id: 3, icon: '📝', name: 'Reporter', desc: 'Writing compliance report' },
]

export default function AgentPipeline({ status }) {
  // status: 'idle' | 'running' | 'done' | 'error'
  return (
    <div className="flex items-center gap-2 my-6">
      {agents.map((agent, i) => {
        const isDone = status === 'done'
        const isRunning = status === 'running'

        return (
          <div key={agent.id} className="flex items-center gap-2 flex-1">
            <motion.div
              animate={isRunning ? { scale: [1, 1.03, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }}
              className={`flex-1 rounded-xl p-4 border text-center transition-all ${
                isDone
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : isRunning
                  ? 'border-yellow-500/40 bg-yellow-500/10'
                  : 'border-gray-700 bg-gray-900'
              }`}
            >
              <div className="text-2xl mb-1">{agent.icon}</div>
              <div className="text-sm font-medium text-white">{agent.name}</div>
              <div className="text-xs text-gray-400 mt-1">
                {isDone ? '✓ Complete' : isRunning ? agent.desc + '...' : 'Waiting'}
              </div>
            </motion.div>
            {i < agents.length - 1 && (
              <div className={`text-lg ${isDone ? 'text-emerald-400' : 'text-gray-600'}`}>
                →
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}