import { useState } from 'react'
import { motion } from 'framer-motion'
import { runFacilityAudit } from '../api/client'
import AgentPipeline from '../components/AgentPipeline'
import ReportViewer from '../components/ReportViewer'

const CATEGORIES = ['Boilers', 'Reactors', 'Power Systems', 'Flow Meters', 'Tanks', 'Equipment']
const FUEL_OPTIONS = [
  { value: 'natural_gas', label: 'Natural Gas (m³)' },
  { value: 'diesel', label: 'Diesel (liters)' },
  { value: 'coal', label: 'Coal (kg)' },
]
const DEFAULTS = {
  Boilers: { fuel_type: 'natural_gas', amount: 5000 },
  Reactors: { fuel_type: 'diesel', amount: 3000 },
  'Power Systems': { fuel_type: 'natural_gas', amount: 10000 },
  'Flow Meters': { fuel_type: 'diesel', amount: 1000 },
  Tanks: { fuel_type: 'natural_gas', amount: 2000 },
  Equipment: { fuel_type: 'diesel', amount: 500 },
}

export default function FacilityAudit({ embedded = false }) {
  const [hours, setHours] = useState(24)
  const [assumptions, setAssumptions] = useState(DEFAULTS)
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [elapsed, setElapsed] = useState(null)
  const [error, setError] = useState(null)

  const update = (cat, field, value) => {
    setAssumptions((prev) => ({
      ...prev,
      [cat]: { ...prev[cat], [field]: field === 'amount' ? Number(value) : value },
    }))
  }

  const handleRun = async () => {
    setStatus('running')
    setResult(null)
    setError(null)
    const start = Date.now()
    try {
      const { data } = await runFacilityAudit({
        hours,
        fuel_assumptions: assumptions,
      })
      setResult(data)
      setElapsed((Date.now() - start) / 1000)
      setStatus('done')
    } catch (e) {
      setError(e.response?.data?.detail || 'Something went wrong.')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {!embedded && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white">Facility Audit</h1>
          <p className="text-gray-400 mt-1">
            Aggregate emissions across all asset categories. Get a facility-wide CSRD verdict.
          </p>
        </motion.div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            Fuel Assumptions by Category
          </h2>
          <select
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
          >
            {[6, 12, 24, 48].map((h) => (
              <option key={h} value={h}>Last {h} hours</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {CATEGORIES.map((cat) => (
            <div
              key={cat}
              className="grid grid-cols-3 gap-3 items-center bg-gray-800/50 rounded-lg p-3"
            >
              <span className="text-sm text-white font-medium">{cat}</span>
              <select
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm"
                value={assumptions[cat]?.fuel_type}
                onChange={(e) => update(cat, 'fuel_type', e.target.value)}
              >
                {FUEL_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <input
                type="number"
                value={assumptions[cat]?.amount}
                onChange={(e) => update(cat, 'amount', e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm"
              />
            </div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleRun}
          disabled={status === 'running'}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
        >
          {status === 'running' ? '⏳ Running facility audit (~30s)...' : '▶ Run Facility Audit'}
        </motion.button>
      </div>

      {status !== 'idle' && <AgentPipeline status={status} />}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <ReportViewer
          report={result.report}
          messages={result.messages}
          elapsed={elapsed}
        />
      )}
    </div>
  )
}